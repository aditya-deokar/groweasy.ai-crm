import { describe, expect, it } from 'vitest';
import { preValidateImportRows } from '../../../src/modules/imports/domain/services/import-row-pre-validator.js';

describe('import row pre-validator', () => {
  it('keeps contactable rows as AI candidates', () => {
    const result = preValidateImportRows([
      {
        rowIndex: 1,
        rawData: {
          Name: 'John',
          Email: 'john@example.com',
        },
        rawTextHash: 'hash-1',
      },
    ]);

    expect(result.candidateRows).toHaveLength(1);
    expect(result.skippedRows).toEqual([]);
    expect(result.summary).toMatchObject({
      candidateRowCount: 1,
      skippedRowCount: 0,
    });
  });

  it('skips empty, no-contact, and duplicate candidate rows before AI', () => {
    const result = preValidateImportRows([
      {
        rowIndex: 1,
        rawData: {
          Name: 'John',
          Email: 'john@example.com',
        },
        rawTextHash: 'hash-1',
      },
      {
        rowIndex: 2,
        rawData: {
          Name: '',
          Email: '',
        },
        rawTextHash: 'hash-2',
      },
      {
        rowIndex: 3,
        rawData: {
          Name: 'No Contact',
          Notes: 'call someday',
        },
        rawTextHash: 'hash-3',
      },
      {
        rowIndex: 4,
        rawData: {
          Name: 'John',
          Email: 'john@example.com',
        },
        rawTextHash: 'hash-1',
      },
    ]);

    expect(result.candidateRows.map((row) => row.rowIndex)).toEqual([1]);
    expect(result.skippedRows).toEqual([
      {
        rowIndex: 2,
        reason: 'EMPTY_ROW',
      },
      {
        rowIndex: 3,
        reason: 'NO_CONTACT',
      },
      {
        rowIndex: 4,
        reason: 'DUPLICATE_ROW',
      },
    ]);
    expect(result.summary).toMatchObject({
      candidateRowCount: 1,
      skippedRowCount: 3,
      emptyRowCount: 1,
      noContactRowCount: 1,
      duplicateRowCount: 1,
    });
  });
});
