import type { ImportRow } from '../entities/import-row.js';

export interface ParseCsvInput {
  buffer: Buffer;
  maxRows: number;
  maxRecordSizeBytes: number;
}

export interface ParseCsvResult {
  headers: string[];
  rows: ImportRow[];
  emptyRowCount: number;
  warningCount: number;
}

export interface CsvParser {
  parse(input: ParseCsvInput): Promise<ParseCsvResult>;
}
