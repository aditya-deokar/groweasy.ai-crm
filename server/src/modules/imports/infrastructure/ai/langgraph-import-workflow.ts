import pLimit from 'p-limit';
import type { Env } from '../../../../config/env.js';
import type { AppLogger } from '../../../../config/logger.js';
import { CircuitBreaker } from '../../../../shared/infrastructure/resilience/circuit-breaker.js';
import { RetryPolicy } from '../../../../shared/infrastructure/resilience/retry-policy.js';
import { AiInvalidStructuredOutputError } from '../../domain/errors/import-errors.js';
import type { AiCrmExtractor } from '../../domain/ports/ai-extractor.port.js';
import type {
  ImportRepository,
  PersistedImportRow,
} from '../../domain/ports/import-repository.port.js';
import { extractContactsFromRawRow } from '../../domain/services/row-contact-validator.js';
import {
  assessAiInputRows,
  combineDecision,
} from '../../../../shared/infrastructure/ai-safety-input-guardrails.js';
import { exceedsBatchTokenBudget } from '../../../../shared/infrastructure/ai-safety-budget.js';
import type {
  AiBudgetLimits,
  AiGuardrailFinding,
} from '../../../../shared/infrastructure/ai-safety-types.js';

export interface ImportWorkflowInput {
  importId: string;
  includeFailed: boolean;
}

export interface ImportWorkflowResult {
  importId: string;
  processedBatches: number;
}

interface LangGraphRuntime {
  task?: (
    options: { name: string },
    handler: (state: ImportWorkflowInput) => Promise<ImportWorkflowResult>
  ) => (state: ImportWorkflowInput) => Promise<ImportWorkflowResult>;
  entrypoint?: (
    options: { name: string },
    handler: (state: ImportWorkflowInput) => Promise<ImportWorkflowResult>
  ) => {
    invoke: (state: ImportWorkflowInput) => Promise<ImportWorkflowResult>;
  };
}

export class LangGraphImportWorkflow {
  private readonly retryPolicy: RetryPolicy;
  private readonly circuitBreaker: CircuitBreaker;

  public constructor(
    private readonly repository: ImportRepository,
    private readonly aiExtractor: AiCrmExtractor,
    private readonly config: Env,
    private readonly logger: AppLogger
  ) {
    this.retryPolicy = new RetryPolicy({
      maxRetries: config.aiMaxRetries,
      baseDelayMs: config.aiRetryBaseDelayMs,
      jitterRatio: 0.2,
      shouldRetry: (error, attempt) => shouldRetryAiBatch(error, attempt),
    });
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: config.aiCircuitBreakerFailureThreshold,
      cooldownMs: config.aiCircuitBreakerCooldownMs,
    });
  }

  public async invoke(input: ImportWorkflowInput): Promise<ImportWorkflowResult> {
    const runtime = (await import('@langchain/langgraph')) as LangGraphRuntime;

    if (!runtime.task || !runtime.entrypoint) {
      return this.processImport(input);
    }

    const processImportTask = runtime.task(
      { name: 'processGrowEasyImport' },
      async (state: ImportWorkflowInput) => this.processImport(state)
    );
    const workflow = runtime.entrypoint(
      { name: 'groweasyCsvImportWorkflow' },
      async (state: ImportWorkflowInput) => processImportTask(state)
    );

    return workflow.invoke(input);
  }

  private async processImport(input: ImportWorkflowInput): Promise<ImportWorkflowResult> {
    if (input.includeFailed) {
      this.circuitBreaker.reset();
    }

    const batches = await this.repository.getProcessableBatches(
      input.importId,
      input.includeFailed
    );
    const limiter = pLimit(this.config.aiBatchConcurrency);

    let processedBatches = 0;
    const failedBatchMessages: string[] = [];

    await Promise.all(
      batches.map((batch) =>
        limiter(async () => {
          const job = await this.repository.getJobSummary(input.importId);
          if (!job || job.status === 'CANCELLED') {
            return;
          }

          try {
            const startedAt = Date.now();
            this.logger.info(
              {
                importId: input.importId,
                batchId: batch.id,
                batchIndex: batch.batchIndex,
                rowCount: batch.rowCount,
                attempt: batch.retryCount + 1,
              },
              'Import batch processing started'
            );
            await this.repository.markBatchProcessing(batch.id);
            const rows = await this.repository.getRowsForBatch(
              input.importId,
              batch.rowStartIndex,
              batch.rowEndIndex
            );
            const result = await this.extractRows(
              input.importId,
              batch.id,
              batch.batchIndex,
              job.headers,
              rows
            );

            await this.repository.persistBatchResult({
              importId: input.importId,
              rows,
              records: result.records,
              skippedRecords: result.skippedRecords,
            });
            await this.repository.markBatchCompleted(batch.id);
            processedBatches += 1;
            this.logger.info(
              {
                importId: input.importId,
                batchId: batch.id,
                batchIndex: batch.batchIndex,
                rowCount: rows.length,
                importedCount: result.records.length,
                skippedCount: result.skippedRecords.length,
                durationMs: Date.now() - startedAt,
              },
              'Import batch processing completed'
            );
          } catch (error) {
            const message = getErrorMessage(error);
            failedBatchMessages.push(message);
            const guardrailFindings = getGuardrailFindings(error);
            if (guardrailFindings.length > 0) {
              await this.repository.recordAiGuardrailEvents({
                importId: input.importId,
                batchId: batch.id,
                findings: guardrailFindings,
              });
            }
            this.logger.error(
              {
                err: error,
                importId: input.importId,
                batchId: batch.id,
                batchIndex: batch.batchIndex,
              },
              'Import batch failed'
            );
            await this.repository.markBatchFailed(batch.id, message);
          }
        })
      )
    );

    const status = await this.repository.getStatus(input.importId);
    if (status && status.progress.failedBatches > 0) {
      await this.repository.failJob(input.importId, buildImportFailureMessage(failedBatchMessages));
    } else {
      await this.repository.completeJobIfFinished(input.importId);
    }

    return {
      importId: input.importId,
      processedBatches,
    };
  }

  private async extractRows(
    importId: string,
    batchId: string,
    batchIndex: number,
    headers: string[],
    rows: PersistedImportRow[]
  ) {
    const skippedRecords = rows
      .filter((row) => !extractContactsFromRawRow(row.rawData).hasContact)
      .map((row) => ({
        rowIndex: row.rowIndex,
        reason: 'Missing email and mobile number',
      }));
    const rowsForAi = rows.filter((row) => extractContactsFromRawRow(row.rawData).hasContact);

    if (rowsForAi.length === 0) {
      return {
        records: [],
        skippedRecords,
      };
    }

    const aiRows = rowsForAi.map((row) => ({
      rowIndex: row.rowIndex,
      rawData: row.rawData,
    }));
    const guardrailResult = assessAiInputRows({
      rows: aiRows,
      limits: this.getAiBudgetLimits(),
    });
    const budgetFindings = this.getBatchBudgetFindings(headers, guardrailResult.allowedRows);
    const findings = [...guardrailResult.findings, ...budgetFindings];
    const decision = combineDecision(findings);
    const blockedRowIndexes = new Set(guardrailResult.blockedRows.map((row) => row.rowIndex));

    if (decision !== 'ALLOW') {
      await this.repository.recordAiGuardrailEvents({
        importId,
        batchId,
        findings,
      });
      this.logger.warn(
        {
          importId,
          batchId,
          batchIndex,
          decision,
          findingCount: findings.length,
          blockedRows: guardrailResult.blockedRows.length,
          warnedRows: guardrailResult.warnedRows.length,
        },
        'AI input guardrails triggered'
      );
    }

    const rowsAllowedBeforeBudget = guardrailResult.allowedRows.filter(
      (row) => !blockedRowIndexes.has(row.rowIndex)
    );
    const rowsAllowedForAi = budgetFindings.length === 0 ? rowsAllowedBeforeBudget : [];
    const guardrailSkippedRecords = guardrailResult.blockedRows.map((row) => ({
      rowIndex: row.rowIndex,
      reason: 'AI_INPUT_GUARDRAIL_BLOCKED',
    }));
    const budgetSkippedRecords =
      budgetFindings.length > 0
        ? rowsAllowedBeforeBudget.map((row) => ({
            rowIndex: row.rowIndex,
            reason: 'AI_INPUT_BATCH_TOKEN_BUDGET_EXCEEDED',
          }))
        : [];

    if (rowsAllowedForAi.length === 0) {
      return {
        records: [],
        skippedRecords: [...skippedRecords, ...guardrailSkippedRecords, ...budgetSkippedRecords],
      };
    }

    const aiResult = await this.retryPolicy.execute(
      () =>
        this.circuitBreaker.execute(() =>
          this.aiExtractor.extractBatch({
            importId,
            batchId,
            batchIndex,
            headers,
            rows: rowsAllowedForAi,
          })
        ),
      ({ attempt, delayMs, error }) =>
        this.logger.warn(
          {
            importId,
            attempt: attempt + 1,
            nextAttempt: attempt + 2,
            delayMs,
            reason: error instanceof Error ? error.message : 'Unknown AI extraction error.',
          },
          'Retrying AI batch extraction'
        )
    );

    if (aiResult.metadata) {
      await this.repository.recordAiModelRun({
        importId,
        batchId,
        metadata: {
          ...aiResult.metadata,
          guardrailSummary: {
            inputDecision: decision,
            inputFindings: findings.length,
            blockedRows: guardrailResult.blockedRows.length,
            warnedRows: guardrailResult.warnedRows.length,
          },
        },
      });
    }

    return {
      records: aiResult.records,
      skippedRecords: [
        ...skippedRecords,
        ...guardrailSkippedRecords,
        ...budgetSkippedRecords,
        ...aiResult.skippedRecords,
      ],
    };
  }

  private getAiBudgetLimits(): AiBudgetLimits {
    return {
      maxCellChars: this.config.aiMaxCellChars,
      maxRowChars: this.config.aiMaxRowChars,
      maxBatchInputTokens: this.config.aiMaxBatchInputTokens,
    };
  }

  private getBatchBudgetFindings(
    headers: string[],
    rows: Array<{ rowIndex: number; rawData: Record<string, string> }>
  ): AiGuardrailFinding[] {
    if (
      !exceedsBatchTokenBudget({
        promptText: JSON.stringify({ headers, rows }),
        limits: this.getAiBudgetLimits(),
      })
    ) {
      return [];
    }

    return rows.map((row) => ({
      stage: 'INPUT' as const,
      ruleId: 'AI_INPUT_BATCH_TOKEN_BUDGET_EXCEEDED',
      severity: 'HIGH' as const,
      decision: 'BLOCK' as const,
      message: 'AI batch exceeds the configured input token budget.',
      rowIndex: row.rowIndex,
      metadata: {
        maxBatchInputTokens: this.config.aiMaxBatchInputTokens,
      },
    }));
  }
}

function shouldRetryAiBatch(error: unknown, attempt: number): boolean {
  if (error instanceof AiInvalidStructuredOutputError) {
    return attempt === 0;
  }

  return true;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown batch failure.';
}

function buildImportFailureMessage(failedBatchMessages: string[]): string {
  const uniqueMessages = Array.from(
    new Set(failedBatchMessages.map((message) => message.trim()).filter(Boolean))
  );

  if (uniqueMessages.length === 0) {
    return 'One or more import batches failed.';
  }

  if (uniqueMessages.length === 1) {
    return uniqueMessages[0]!;
  }

  return `${uniqueMessages.length} import batches failed. First failure: ${uniqueMessages[0]}`;
}

function getGuardrailFindings(error: unknown): AiGuardrailFinding[] {
  const details = (error as { details?: unknown } | null)?.details;
  if (!details || typeof details !== 'object') {
    return [];
  }

  const findings = (details as { findings?: unknown }).findings;
  if (!Array.isArray(findings)) {
    return [];
  }

  return findings.filter(isGuardrailFinding);
}

function isGuardrailFinding(value: unknown): value is AiGuardrailFinding {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.stage === 'string' &&
    typeof record.ruleId === 'string' &&
    typeof record.severity === 'string' &&
    typeof record.decision === 'string' &&
    typeof record.message === 'string'
  );
}
