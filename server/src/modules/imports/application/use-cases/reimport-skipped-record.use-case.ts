import { ImportNotFoundError, InvalidCsvError } from '../../domain/errors/import-errors.js';
import type { ImportRepository } from '../../domain/ports/import-repository.port.js';
import type { AiCrmExtractor } from '../../domain/ports/ai-extractor.port.js';
import { preValidateImportRows } from '../../domain/services/import-row-pre-validator.js';
import type { Env } from '../../../../config/env.js';
import { assessAiInputRows } from '../../../../shared/infrastructure/ai-safety-input-guardrails.js';

export interface ReimportSkippedRecordInput {
  importId: string;
  rowIndex: number;
  newRawData: Record<string, string>;
}

export class ReimportSkippedRecordUseCase {
  public constructor(
    private readonly repository: ImportRepository,
    private readonly aiExtractor: AiCrmExtractor,
    private readonly config: Env
  ) {}

  public async execute(input: ReimportSkippedRecordInput): Promise<void> {
    const job = await this.repository.getJobSummary(input.importId);
    if (!job) {
      throw new ImportNotFoundError();
    }

    const skippedRecord = await this.repository.getSkippedRecord(input.importId, input.rowIndex);
    if (!skippedRecord) {
      throw new Error('Skipped record not found.');
    }

    // 1. Pre-validate the new raw data
    const preValidationResult = preValidateImportRows([
      {
        rowIndex: input.rowIndex,
        rawData: input.newRawData,
        rawTextHash: '', // We don't check duplicate hash on manual correction
        parseWarnings: [],
      },
    ]);

    const rowResult = preValidationResult.rows[0];
    if (rowResult?.validationStatus === 'SKIPPED') {
      throw new InvalidCsvError(`Still invalid: ${rowResult.skipReason}`);
    }

    const guardrailResult = assessAiInputRows({
      rows: [
        {
          rowIndex: input.rowIndex,
          rawData: input.newRawData,
        },
      ],
      limits: {
        maxCellChars: this.config.aiMaxCellChars,
        maxRowChars: this.config.aiMaxRowChars,
        maxBatchInputTokens: this.config.aiMaxBatchInputTokens,
      },
    });

    if (guardrailResult.findings.length > 0) {
      await this.repository.recordAiGuardrailEvents({
        importId: input.importId,
        findings: guardrailResult.findings,
      });
    }

    if (guardrailResult.decision === 'BLOCK') {
      throw new InvalidCsvError('AI input guardrail blocked this corrected row.');
    }

    // 2. Extract with AI synchronously
    const extractionResult = await this.aiExtractor.extractBatch({
      importId: input.importId,
      headers: job.headers,
      rows: [
        {
          rowIndex: input.rowIndex,
          rawData: input.newRawData,
        },
      ],
    });

    if (extractionResult.metadata) {
      await this.repository.recordAiModelRun({
        importId: input.importId,
        metadata: extractionResult.metadata,
      });
    }

    if (extractionResult.skippedRecords.length > 0) {
      throw new InvalidCsvError(
        `AI Extraction failed: ${extractionResult.skippedRecords[0]?.reason}`
      );
    }

    const extractedRecord = extractionResult.records[0];
    if (!extractedRecord) {
      throw new Error('No record returned from AI extractor.');
    }

    // 3. Save the result and remove from skipped
    await this.repository.reimportSkippedRecord(
      input.importId,
      skippedRecord.importRowId,
      input.rowIndex,
      extractedRecord.record
    );
  }
}
