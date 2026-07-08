import type { CrmRecordWithRow } from '../entities/crm-record.js';

export interface AiExtractionRow {
  rowIndex: number;
  rawData: Record<string, string>;
}

export interface AiCrmExtractionInput {
  importId: string;
  headers: string[];
  rows: AiExtractionRow[];
}

export interface AiSkippedRecord {
  rowIndex: number;
  reason: string;
}

export interface AiCrmExtractionBatchResult {
  records: CrmRecordWithRow[];
  skippedRecords: AiSkippedRecord[];
}

export interface AiCrmExtractor {
  extractBatch(input: AiCrmExtractionInput): Promise<AiCrmExtractionBatchResult>;
}
