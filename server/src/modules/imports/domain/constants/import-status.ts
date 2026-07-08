export const IMPORT_STATUS_VALUES = [
  'UPLOADED',
  'PARSED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
] as const;

export type ImportStatus = (typeof IMPORT_STATUS_VALUES)[number];

export const IMPORT_BATCH_STATUS_VALUES = [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
] as const;

export type ImportBatchStatus = (typeof IMPORT_BATCH_STATUS_VALUES)[number];
