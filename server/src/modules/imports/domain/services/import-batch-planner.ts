export interface PlannedImportBatch {
  batchIndex: number;
  rowStartIndex: number;
  rowEndIndex: number;
  rowCount: number;
}

export function planImportBatches(rowIndexes: number[], batchSize: number): PlannedImportBatch[] {
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error('Batch size must be a positive integer.');
  }

  const sortedRowIndexes = [...rowIndexes].sort((left, right) => left - right);
  const batches: PlannedImportBatch[] = [];

  for (let start = 0; start < sortedRowIndexes.length; start += batchSize) {
    const batchRows = sortedRowIndexes.slice(start, start + batchSize);
    const firstRowIndex = batchRows[0];
    const lastRowIndex = batchRows.at(-1);

    if (firstRowIndex === undefined || lastRowIndex === undefined) {
      continue;
    }

    batches.push({
      batchIndex: batches.length,
      rowStartIndex: firstRowIndex,
      rowEndIndex: lastRowIndex,
      rowCount: batchRows.length,
    });
  }

  return batches;
}
