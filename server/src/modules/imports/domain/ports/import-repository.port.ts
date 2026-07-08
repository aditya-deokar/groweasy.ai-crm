import type { ImportFileMetadata, ImportPreview } from '../entities/import-job.js';
import type { ImportRow, ImportRowSkipReason } from '../entities/import-row.js';
import type { CrmRecordWithRow } from '../entities/crm-record.js';
import type { ImportBatchStatus, ImportStatus } from '../constants/import-status.js';

export interface CreateImportPreviewInput {
  file: ImportFileMetadata;
  headers: string[];
  rows: ImportRow[];
  skippedRows: Array<{
    rowIndex: number;
    reason: ImportRowSkipReason;
  }>;
  validationSummary: {
    candidateRowCount: number;
    skippedRowCount: number;
    emptyRowCount: number;
    duplicateRowCount: number;
    noContactRowCount: number;
  };
  emptyRowCount: number;
  warningCount: number;
  previewRowLimit: number;
}

export interface ImportRepository {
  createPreview(input: CreateImportPreviewInput): Promise<ImportPreview>;
  getJobSummary(importId: string): Promise<ImportJobSummary | null>;
  markProcessing(importId: string, totalBatches: number): Promise<void>;
  createBatches(input: CreateImportBatchesInput): Promise<ImportBatchSummary[]>;
  getProcessableBatches(importId: string, includeFailed: boolean): Promise<ImportBatchSummary[]>;
  getRowsForBatch(importId: string, rowStartIndex: number, rowEndIndex: number): Promise<PersistedImportRow[]>;
  markBatchProcessing(batchId: string): Promise<void>;
  markBatchCompleted(batchId: string): Promise<void>;
  markBatchFailed(batchId: string, errorMessage: string): Promise<void>;
  persistBatchResult(input: PersistBatchResultInput): Promise<PersistBatchResultSummary>;
  completeJobIfFinished(importId: string): Promise<void>;
  failJob(importId: string, errorMessage: string): Promise<void>;
  cancelJob(importId: string): Promise<void>;
  getStatus(importId: string): Promise<ImportStatusResult | null>;
  getResult(input: GetImportResultInput): Promise<ImportResult | null>;
}

export interface ImportJobSummary {
  id: string;
  status: ImportStatus;
  headers: string[];
  totalRows: number;
  totalBatches: number;
  processedRows: number;
  importedCount: number;
  skippedCount: number;
  errorMessage: string | null;
}

export interface ImportBatchSummary {
  id: string;
  batchIndex: number;
  status: ImportBatchStatus;
  rowStartIndex: number;
  rowEndIndex: number;
  rowCount: number;
  retryCount: number;
}

export interface ImportResultBatchSummary extends ImportBatchSummary {
  errorMessage: string | null;
}

export interface ImportEventSummary {
  eventType: string;
  message: string;
  metadata: Record<string, unknown> | null;
  visibleToUser: boolean;
  createdAt: Date;
}

export interface PersistedImportRow extends ImportRow {
  id: string;
}

export interface CreateImportBatchesInput {
  importId: string;
  batchSize: number;
}

export interface PersistBatchResultInput {
  importId: string;
  rows: PersistedImportRow[];
  records: CrmRecordWithRow[];
  skippedRecords: {
    rowIndex: number;
    reason: string;
  }[];
}

export interface PersistBatchResultSummary {
  processedRows: number;
  importedCount: number;
  skippedCount: number;
}

export interface ImportStatusResult {
  importId: string;
  status: ImportStatus;
  progress: {
    totalRows: number;
    processedRows: number;
    totalBatches: number;
    completedBatches: number;
    failedBatches: number;
    percent: number;
  };
  totals: {
    imported: number;
    skipped: number;
  };
  error: string | null;
  recentEvents?: ImportEventSummary[];
}

export interface GetImportResultInput {
  importId: string;
  limit: number;
  cursor?: number;
  includeSkipped: boolean;
}

export interface ImportResult {
  importId: string;
  status: ImportStatus;
  summary: {
    totalRows: number;
    totalImported: number;
    totalSkipped: number;
    totalBatches: number;
    completedBatches: number;
    failedBatches: number;
    pendingBatches: number;
    processingBatches: number;
    processedRows: number;
    unprocessedRows: number;
  };
  batches: ImportResultBatchSummary[];
  skippedReasonCounts: Record<string, number>;
  events: ImportEventSummary[];
  records: Array<CrmRecordWithRow>;
  skippedRecords: Array<{
    rowIndex: number;
    reason: string;
    rawData: Record<string, string>;
  }>;
  pageInfo: {
    nextCursor: number | null;
    hasMore: boolean;
  };
}
