import pLimit from 'p-limit';
import type { Env } from '../../../../config/env.js';
import type { AppLogger } from '../../../../config/logger.js';
import { CircuitBreaker } from '../../../../shared/infrastructure/resilience/circuit-breaker.js';
import { RetryPolicy } from '../../../../shared/infrastructure/resilience/retry-policy.js';
import { AiInvalidStructuredOutputError } from '../../domain/errors/import-errors.js';
import type { AiCrmExtractor } from '../../domain/ports/ai-extractor.port.js';
import type { ImportRepository, PersistedImportRow } from '../../domain/ports/import-repository.port.js';
import { extractContactsFromRawRow } from '../../domain/services/row-contact-validator.js';

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
    const batches = await this.repository.getProcessableBatches(input.importId, input.includeFailed);
    const limiter = pLimit(this.config.aiBatchConcurrency);

    let processedBatches = 0;

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
            const result = await this.extractRows(input.importId, job.headers, rows);

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
            const message = error instanceof Error ? error.message : 'Unknown batch failure.';
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
      await this.repository.failJob(input.importId, 'One or more import batches failed.');
    } else {
      await this.repository.completeJobIfFinished(input.importId);
    }

    return {
      importId: input.importId,
      processedBatches,
    };
  }

  private async extractRows(importId: string, headers: string[], rows: PersistedImportRow[]) {
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

    const aiResult = await this.retryPolicy.execute(
      () =>
        this.circuitBreaker.execute(() =>
          this.aiExtractor.extractBatch({
            importId,
            headers,
            rows: aiRows,
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

    return {
      records: aiResult.records,
      skippedRecords: [...skippedRecords, ...aiResult.skippedRecords],
    };
  }
}

function shouldRetryAiBatch(error: unknown, attempt: number): boolean {
  if (error instanceof AiInvalidStructuredOutputError) {
    return attempt === 0;
  }

  return true;
}
