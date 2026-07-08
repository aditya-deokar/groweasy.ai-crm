import { describe, expect, it } from 'vitest';
import { planImportBatches } from '../../../src/modules/imports/domain/services/import-batch-planner.js';

describe('import batch planner', () => {
  it('plans 5,000 rows into bounded 25-row AI batches', () => {
    const rowIndexes = Array.from({ length: 5_000 }, (_, index) => index + 1);

    const batches = planImportBatches(rowIndexes, 25);

    expect(batches).toHaveLength(200);
    expect(batches[0]).toEqual({
      batchIndex: 0,
      rowStartIndex: 1,
      rowEndIndex: 25,
      rowCount: 25,
    });
    expect(batches.at(-1)).toEqual({
      batchIndex: 199,
      rowStartIndex: 4976,
      rowEndIndex: 5000,
      rowCount: 25,
    });
    expect(Math.max(...batches.map((batch) => batch.rowCount))).toBe(25);
  });

  it('sorts sparse candidate row indexes and preserves source row bounds', () => {
    const batches = planImportBatches([9, 1, 7, 3, 10], 2);

    expect(batches).toEqual([
      {
        batchIndex: 0,
        rowStartIndex: 1,
        rowEndIndex: 3,
        rowCount: 2,
      },
      {
        batchIndex: 1,
        rowStartIndex: 7,
        rowEndIndex: 9,
        rowCount: 2,
      },
      {
        batchIndex: 2,
        rowStartIndex: 10,
        rowEndIndex: 10,
        rowCount: 1,
      },
    ]);
  });

  it('rejects invalid batch sizes', () => {
    expect(() => planImportBatches([1], 0)).toThrow('Batch size must be a positive integer.');
  });
});
