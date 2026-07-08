import { AiInvalidStructuredOutputError } from '../../../domain/errors/import-errors.js';
import type {
  AiCrmExtractionBatchResult,
  AiCrmExtractionInput,
} from '../../../domain/ports/ai-extractor.port.js';
import {
  hasUsableContact,
  normalizeCrmRecord,
  type NormalizeCrmRecordOptions,
} from '../../../domain/services/crm-record-normalizer.js';
import {
  crmExtractionBatchSchema,
  type CrmExtractionBatchOutput,
} from '../schemas/crm-extraction.schema.js';

export function validateCrmExtractionOutput(
  output: unknown,
  input: AiCrmExtractionInput,
  options: NormalizeCrmRecordOptions = {}
): AiCrmExtractionBatchResult {
  const parsed = crmExtractionBatchSchema.safeParse(output);

  if (!parsed.success) {
    throw new AiInvalidStructuredOutputError({
      code: 'AI_SCHEMA_VALIDATION_FAILED',
      issues: parsed.error.issues,
    });
  }

  assertRowsMatchInput(parsed.data, input);

  const records: AiCrmExtractionBatchResult['records'] = [];
  const skippedRecords: AiCrmExtractionBatchResult['skippedRecords'] = [];

  for (const row of parsed.data.rows) {
    if (row.action === 'SKIP') {
      skippedRecords.push({
        rowIndex: row.rowIndex,
        reason: row.skipReason ?? 'Skipped by AI extraction.',
      });
      continue;
    }

    if (!row.record) {
      skippedRecords.push({
        rowIndex: row.rowIndex,
        reason: 'AI_OUTPUT_INVALID_RECORD',
      });
      continue;
    }

    const normalizedRecord = normalizeCrmRecord(row.record, options);

    if (!hasUsableContact(normalizedRecord)) {
      skippedRecords.push({
        rowIndex: row.rowIndex,
        reason: 'AI_OUTPUT_NO_USABLE_CONTACT',
      });
      continue;
    }

    records.push({
      rowIndex: row.rowIndex,
      record: normalizedRecord,
    });
  }

  return {
    records,
    skippedRecords,
  };
}

function assertRowsMatchInput(
  output: CrmExtractionBatchOutput,
  input: AiCrmExtractionInput
): void {
  const expectedIndexes = new Set(input.rows.map((row) => row.rowIndex));
  const seenIndexes = new Set<number>();
  const duplicateIndexes = new Set<number>();
  const unknownIndexes = new Set<number>();

  for (const row of output.rows) {
    if (!expectedIndexes.has(row.rowIndex)) {
      unknownIndexes.add(row.rowIndex);
      continue;
    }

    if (seenIndexes.has(row.rowIndex)) {
      duplicateIndexes.add(row.rowIndex);
    }

    seenIndexes.add(row.rowIndex);
  }

  const missingIndexes = [...expectedIndexes].filter((rowIndex) => !seenIndexes.has(rowIndex));

  if (unknownIndexes.size > 0 || duplicateIndexes.size > 0 || missingIndexes.length > 0) {
    throw new AiInvalidStructuredOutputError({
      code: 'AI_ROW_RECONCILIATION_FAILED',
      expectedRowIndexes: [...expectedIndexes],
      missingRowIndexes: missingIndexes,
      duplicateRowIndexes: [...duplicateIndexes],
      unknownRowIndexes: [...unknownIndexes],
    });
  }
}
