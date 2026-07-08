export const IMPORT_ROW_SKIP_REASONS = [
  'EMPTY_ROW',
  'NO_CONTACT',
  'DUPLICATE_ROW',
] as const;

export type ImportRowSkipReason = (typeof IMPORT_ROW_SKIP_REASONS)[number];
export type ImportRowValidationStatus = 'CANDIDATE' | 'SKIPPED';

export interface ImportRow {
  id?: string;
  rowIndex: number;
  rawData: Record<string, string>;
  rawTextHash: string;
  parseWarnings?: string[];
}

export interface ImportPreviewRow {
  rowIndex: number;
  values: Record<string, string>;
  validationStatus: ImportRowValidationStatus;
  skipReason?: ImportRowSkipReason;
}
