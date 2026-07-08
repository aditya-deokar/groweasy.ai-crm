export const importStatusValues = [
  "UPLOADED",
  "PARSED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;

export const previewValidationStatusValues = ["CANDIDATE", "SKIPPED"] as const;

export type ImportStatusValue = (typeof importStatusValues)[number];
export type PreviewValidationStatus = (typeof previewValidationStatusValues)[number];

export interface ImportEvent {
  eventType: string;
  message: string;
  metadata: Record<string, unknown> | null;
  visibleToUser: boolean;
  createdAt: string;
}

export interface GrowEasyCrmRecord {
  created_at: string | null;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status: string | null;
  crm_note: string | null;
  data_source: string | null;
  possession_time: string | null;
  description: string | null;
  confidence: Record<string, number> | null;
}

export interface PreviewRow {
  rowIndex: number;
  values: Record<string, string>;
  validationStatus: PreviewValidationStatus;
  skipReason?: string;
}

export interface ImportPreview {
  importId: string;
  status: "PARSED";
  file: {
    originalName: string;
    sizeBytes: number;
    sha256: string;
  };
  headers: string[];
  previewRows: PreviewRow[];
  summary: {
    totalRows: number;
    previewRowCount: number;
    candidateRowCount: number;
    skippedRowCount: number;
    emptyRowCount: number;
    duplicateRowCount: number;
    noContactRowCount: number;
    warningCount: number;
  };
}

export interface ImportStatus {
  importId: string;
  status: ImportStatusValue;
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
  recentEvents: ImportEvent[];
}

export interface ImportBatch {
  id: string;
  batchIndex: number;
  status: string;
  rowStartIndex: number;
  rowEndIndex: number;
  rowCount: number;
  retryCount: number;
  errorMessage: string | null;
}

export interface ImportedRecord {
  rowIndex: number;
  record: GrowEasyCrmRecord;
}

export interface SkippedRecord {
  rowIndex: number;
  reason: string;
  rawData: Record<string, string>;
}

export interface ImportJobSummary {
  id: string;
  status: ImportStatusValue;
  headers: string[];
  totalRows: number;
  totalBatches: number;
  processedRows: number;
  importedCount: number;
  skippedCount: number;
  errorMessage: string | null;
  createdAt: string;
}

export interface ImportHistoryResponse {
  jobs: ImportJobSummary[];
  pageInfo: {
    nextCursor: number | null;
    hasMore: boolean;
  };
}

export interface ImportResult {
  importId: string;
  status: string;
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
  batches: ImportBatch[];
  skippedReasonCounts: Record<string, number>;
  events: ImportEvent[];
  records: ImportedRecord[];
  skippedRecords: SkippedRecord[];
  pageInfo: {
    nextCursor: number | null;
    hasMore: boolean;
  };
}

export function parseImportPreview(value: unknown): ImportPreview {
  const record = expectRecord(value, "Import preview");

  return {
    importId: expectString(record.importId, "preview.importId"),
    status: "PARSED",
    file: {
      originalName: expectString(expectRecord(record.file, "preview.file").originalName, "preview.file.originalName"),
      sizeBytes: expectNumber(expectRecord(record.file, "preview.file").sizeBytes, "preview.file.sizeBytes"),
      sha256: expectString(expectRecord(record.file, "preview.file").sha256, "preview.file.sha256"),
    },
    headers: expectStringArray(record.headers, "preview.headers"),
    previewRows: expectArray(record.previewRows, "preview.previewRows").map((item) =>
      parsePreviewRow(item)
    ),
    summary: parsePreviewSummary(record.summary),
  };
}

export function parseImportStatus(value: unknown): ImportStatus {
  const record = expectRecord(value, "Import status");

  return {
    importId: expectString(record.importId, "status.importId"),
    status: expectImportStatus(record.status),
    progress: {
      totalRows: expectNumber(expectRecord(record.progress, "status.progress").totalRows, "status.progress.totalRows"),
      processedRows: expectNumber(expectRecord(record.progress, "status.progress").processedRows, "status.progress.processedRows"),
      totalBatches: expectNumber(expectRecord(record.progress, "status.progress").totalBatches, "status.progress.totalBatches"),
      completedBatches: expectNumber(expectRecord(record.progress, "status.progress").completedBatches, "status.progress.completedBatches"),
      failedBatches: expectNumber(expectRecord(record.progress, "status.progress").failedBatches, "status.progress.failedBatches"),
      percent: expectNumber(expectRecord(record.progress, "status.progress").percent, "status.progress.percent"),
    },
    totals: {
      imported: expectNumber(expectRecord(record.totals, "status.totals").imported, "status.totals.imported"),
      skipped: expectNumber(expectRecord(record.totals, "status.totals").skipped, "status.totals.skipped"),
    },
    error: expectNullableString(record.error, "status.error"),
    recentEvents: expectArray(record.recentEvents, "status.recentEvents").map((item) =>
      parseImportEvent(item)
    ),
  };
}

export function parseImportResult(value: unknown): ImportResult {
  const record = expectRecord(value, "Import result");

  return {
    importId: expectString(record.importId, "result.importId"),
    status: expectString(record.status, "result.status"),
    summary: {
      totalRows: expectNumber(expectRecord(record.summary, "result.summary").totalRows, "result.summary.totalRows"),
      totalImported: expectNumber(expectRecord(record.summary, "result.summary").totalImported, "result.summary.totalImported"),
      totalSkipped: expectNumber(expectRecord(record.summary, "result.summary").totalSkipped, "result.summary.totalSkipped"),
      totalBatches: expectNumber(expectRecord(record.summary, "result.summary").totalBatches, "result.summary.totalBatches"),
      completedBatches: expectNumber(expectRecord(record.summary, "result.summary").completedBatches, "result.summary.completedBatches"),
      failedBatches: expectNumber(expectRecord(record.summary, "result.summary").failedBatches, "result.summary.failedBatches"),
      pendingBatches: expectNumber(expectRecord(record.summary, "result.summary").pendingBatches, "result.summary.pendingBatches"),
      processingBatches: expectNumber(expectRecord(record.summary, "result.summary").processingBatches, "result.summary.processingBatches"),
      processedRows: expectNumber(expectRecord(record.summary, "result.summary").processedRows, "result.summary.processedRows"),
      unprocessedRows: expectNumber(expectRecord(record.summary, "result.summary").unprocessedRows, "result.summary.unprocessedRows"),
    },
    batches: expectArray(record.batches, "result.batches").map((item) => parseImportBatch(item)),
    skippedReasonCounts: parseNumberRecord(record.skippedReasonCounts, "result.skippedReasonCounts"),
    events: expectArray(record.events, "result.events").map((item) => parseImportEvent(item)),
    records: expectArray(record.records, "result.records").map((item) => parseImportedRecord(item)),
    skippedRecords: expectArray(record.skippedRecords, "result.skippedRecords").map((item) =>
      parseSkippedRecord(item)
    ),
    pageInfo: {
      nextCursor: expectNullableNumber(expectRecord(record.pageInfo, "result.pageInfo").nextCursor, "result.pageInfo.nextCursor"),
      hasMore: expectBoolean(expectRecord(record.pageInfo, "result.pageInfo").hasMore, "result.pageInfo.hasMore"),
    },
  };
}

export function isImportPreview(value: unknown): value is ImportPreview {
  try {
    parseImportPreview(value);
    return true;
  } catch {
    return false;
  }
}

function parsePreviewRow(value: unknown): PreviewRow {
  const record = expectRecord(value, "preview row");
  const validationStatus = expectString(record.validationStatus, "previewRow.validationStatus");

  if (!previewValidationStatusValues.includes(validationStatus as PreviewValidationStatus)) {
    throw new Error("previewRow.validationStatus is invalid.");
  }

  return {
    rowIndex: expectNumber(record.rowIndex, "previewRow.rowIndex"),
    values: parseStringRecord(record.values, "previewRow.values"),
    validationStatus: validationStatus as PreviewValidationStatus,
    skipReason:
      typeof record.skipReason === "string" && record.skipReason.length > 0
        ? record.skipReason
        : undefined,
  };
}

function parsePreviewSummary(value: unknown): ImportPreview["summary"] {
  const record = expectRecord(value, "preview.summary");

  return {
    totalRows: expectNumber(record.totalRows, "preview.summary.totalRows"),
    previewRowCount: expectNumber(record.previewRowCount, "preview.summary.previewRowCount"),
    candidateRowCount: expectNumber(record.candidateRowCount, "preview.summary.candidateRowCount"),
    skippedRowCount: expectNumber(record.skippedRowCount, "preview.summary.skippedRowCount"),
    emptyRowCount: expectNumber(record.emptyRowCount, "preview.summary.emptyRowCount"),
    duplicateRowCount: expectNumber(record.duplicateRowCount, "preview.summary.duplicateRowCount"),
    noContactRowCount: expectNumber(record.noContactRowCount, "preview.summary.noContactRowCount"),
    warningCount: expectNumber(record.warningCount, "preview.summary.warningCount"),
  };
}

function parseImportEvent(value: unknown): ImportEvent {
  const record = expectRecord(value, "event");

  return {
    eventType: expectString(record.eventType, "event.eventType"),
    message: expectString(record.message, "event.message"),
    metadata: record.metadata == null ? null : expectRecord(record.metadata, "event.metadata"),
    visibleToUser: expectBoolean(record.visibleToUser, "event.visibleToUser"),
    createdAt: expectString(record.createdAt, "event.createdAt"),
  };
}

function parseImportBatch(value: unknown): ImportBatch {
  const record = expectRecord(value, "batch");

  return {
    id: expectString(record.id, "batch.id"),
    batchIndex: expectNumber(record.batchIndex, "batch.batchIndex"),
    status: expectString(record.status, "batch.status"),
    rowStartIndex: expectNumber(record.rowStartIndex, "batch.rowStartIndex"),
    rowEndIndex: expectNumber(record.rowEndIndex, "batch.rowEndIndex"),
    rowCount: expectNumber(record.rowCount, "batch.rowCount"),
    retryCount: expectNumber(record.retryCount, "batch.retryCount"),
    errorMessage: expectNullableString(record.errorMessage, "batch.errorMessage"),
  };
}

function parseImportedRecord(value: unknown): ImportedRecord {
  const record = expectRecord(value, "imported record");

  return {
    rowIndex: expectNumber(record.rowIndex, "record.rowIndex"),
    record: parseGrowEasyCrmRecord(record.record),
  };
}

function parseSkippedRecord(value: unknown): SkippedRecord {
  const record = expectRecord(value, "skipped record");

  return {
    rowIndex: expectNumber(record.rowIndex, "skipped.rowIndex"),
    reason: expectString(record.reason, "skipped.reason"),
    rawData: parseStringRecord(record.rawData, "skipped.rawData"),
  };
}

function parseGrowEasyCrmRecord(value: unknown): GrowEasyCrmRecord {
  const record = expectRecord(value, "crm record");

  return {
    created_at: expectNullableString(record.created_at, "record.created_at"),
    name: expectNullableString(record.name, "record.name"),
    email: expectNullableString(record.email, "record.email"),
    country_code: expectNullableString(record.country_code, "record.country_code"),
    mobile_without_country_code: expectNullableString(
      record.mobile_without_country_code,
      "record.mobile_without_country_code"
    ),
    company: expectNullableString(record.company, "record.company"),
    city: expectNullableString(record.city, "record.city"),
    state: expectNullableString(record.state, "record.state"),
    country: expectNullableString(record.country, "record.country"),
    lead_owner: expectNullableString(record.lead_owner, "record.lead_owner"),
    crm_status: expectNullableString(record.crm_status, "record.crm_status"),
    crm_note: expectNullableString(record.crm_note, "record.crm_note"),
    data_source: expectNullableString(record.data_source, "record.data_source"),
    possession_time: expectNullableString(record.possession_time, "record.possession_time"),
    description: expectNullableString(record.description, "record.description"),
    confidence: record.confidence == null ? null : parseNumberRecord(record.confidence, "record.confidence"),
  };
}

function parseStringRecord(value: unknown, label: string): Record<string, string> {
  const record = expectRecord(value, label);
  const parsed: Record<string, string> = {};

  for (const [key, entry] of Object.entries(record)) {
    parsed[key] = typeof entry === "string" ? entry : "";
  }

  return parsed;
}

function parseNumberRecord(value: unknown, label: string): Record<string, number> {
  const record = expectRecord(value, label);
  const parsed: Record<string, number> = {};

  for (const [key, entry] of Object.entries(record)) {
    parsed[key] = expectNumber(entry, `${label}.${key}`);
  }

  return parsed;
}

function expectImportStatus(value: unknown): ImportStatusValue {
  const status = expectString(value, "status.status");

  if (!importStatusValues.includes(status as ImportStatusValue)) {
    throw new Error("status.status is invalid.");
  }

  return status as ImportStatusValue;
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function expectArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value;
}

function expectStringArray(value: unknown, label: string): string[] {
  return expectArray(value, label).map((item, index) =>
    expectString(item, `${label}[${index}]`)
  );
}

function expectString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string.`);
  }

  return value;
}

function expectNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${label} must be a number.`);
  }

  return value;
}

function expectBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean.`);
  }

  return value;
}

function expectNullableString(value: unknown, label: string): string | null {
  if (value == null) {
    return null;
  }

  return expectString(value, label);
}

function expectNullableNumber(value: unknown, label: string): number | null {
  if (value == null) {
    return null;
  }

  return expectNumber(value, label);
}

export function parseImportHistory(value: unknown): ImportHistoryResponse {
  const record = expectRecord(value, "Import history response");
  const pageInfo = expectRecord(record.pageInfo, "history.pageInfo");

  return {
    jobs: expectArray(record.jobs, "Import history jobs").map((item, index) => {
      const job = expectRecord(item, `Import history jobs[${index}]`);
      return {
        id: expectString(job.id, "job.id"),
        status: expectString(job.status, "job.status") as ImportStatusValue,
        headers: expectArray(job.headers, "job.headers").map(String),
        totalRows: expectNumber(job.totalRows, "job.totalRows"),
        totalBatches: expectNumber(job.totalBatches, "job.totalBatches"),
        processedRows: expectNumber(job.processedRows, "job.processedRows"),
        importedCount: expectNumber(job.importedCount, "job.importedCount"),
        skippedCount: expectNumber(job.skippedCount, "job.skippedCount"),
        errorMessage: expectNullableString(job.errorMessage, "job.errorMessage"),
        createdAt: expectString(job.createdAt, "job.createdAt"),
      };
    }),
    pageInfo: {
      nextCursor: expectNullableNumber(pageInfo.nextCursor, "pageInfo.nextCursor"),
      hasMore: expectBoolean(pageInfo.hasMore, "pageInfo.hasMore"),
    },
  };
}
