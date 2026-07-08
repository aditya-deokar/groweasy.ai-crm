import type { CrmRecordWithRow } from '../entities/crm-record.js';
import type { AiModelCallMetadata } from '../../../../shared/infrastructure/ai-safety-types.js';

export interface AiExtractionRow {
  rowIndex: number;
  rawData: Record<string, string>;
}

export interface AiCrmExtractionInput {
  importId: string;
  batchId?: string;
  batchIndex?: number;
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
  metadata?: AiModelCallMetadata;
}

export interface AiCrmExtractor {
  extractBatch(input: AiCrmExtractionInput): Promise<AiCrmExtractionBatchResult>;
}
