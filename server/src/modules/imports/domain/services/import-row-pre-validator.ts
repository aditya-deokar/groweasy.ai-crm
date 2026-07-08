import type { ImportRow, ImportRowSkipReason } from '../entities/import-row.js';
import { extractContactsFromRawRow } from './row-contact-validator.js';

export interface PreValidatedImportRow {
  row: ImportRow;
  validationStatus: 'CANDIDATE' | 'SKIPPED';
  skipReason?: ImportRowSkipReason;
}

export interface PreValidateImportRowsResult {
  rows: PreValidatedImportRow[];
  candidateRows: ImportRow[];
  skippedRows: Array<{
    rowIndex: number;
    reason: ImportRowSkipReason;
  }>;
  summary: {
    candidateRowCount: number;
    skippedRowCount: number;
    emptyRowCount: number;
    duplicateRowCount: number;
    noContactRowCount: number;
  };
}

export function preValidateImportRows(rows: ImportRow[]): PreValidateImportRowsResult {
  const seenHashes = new Set<string>();
  const validatedRows: PreValidatedImportRow[] = [];
  const candidateRows: ImportRow[] = [];
  const skippedRows: Array<{ rowIndex: number; reason: ImportRowSkipReason }> = [];
  const summary = {
    candidateRowCount: 0,
    skippedRowCount: 0,
    emptyRowCount: 0,
    duplicateRowCount: 0,
    noContactRowCount: 0,
  };

  for (const row of rows) {
    const skipReason = getSkipReason(row, seenHashes);

    if (skipReason) {
      skippedRows.push({
        rowIndex: row.rowIndex,
        reason: skipReason,
      });
      validatedRows.push({
        row,
        validationStatus: 'SKIPPED',
        skipReason,
      });
      summary.skippedRowCount += 1;

      if (skipReason === 'EMPTY_ROW') summary.emptyRowCount += 1;
      if (skipReason === 'DUPLICATE_ROW') summary.duplicateRowCount += 1;
      if (skipReason === 'NO_CONTACT') summary.noContactRowCount += 1;

      continue;
    }

    seenHashes.add(row.rawTextHash);
    candidateRows.push(row);
    validatedRows.push({
      row,
      validationStatus: 'CANDIDATE',
    });
    summary.candidateRowCount += 1;
  }

  return {
    rows: validatedRows,
    candidateRows,
    skippedRows,
    summary,
  };
}

function getSkipReason(row: ImportRow, seenHashes: Set<string>): ImportRowSkipReason | null {
  if (isEmptyRawRow(row.rawData)) {
    return 'EMPTY_ROW';
  }

  if (seenHashes.has(row.rawTextHash)) {
    return 'DUPLICATE_ROW';
  }

  if (!extractContactsFromRawRow(row.rawData).hasContact) {
    return 'NO_CONTACT';
  }

  return null;
}

function isEmptyRawRow(rawData: Record<string, string>): boolean {
  return Object.values(rawData).every((value) => value.trim().length === 0);
}
