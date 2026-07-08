import { describe, expect, it, vi } from 'vitest';
import type { Env } from '../../../src/config/env.js';
import { CreateImportPreviewUseCase } from '../../../src/modules/imports/application/use-cases/create-import-preview.use-case.js';
import type { CsvParser } from '../../../src/modules/imports/domain/ports/csv-parser.port.js';
import type { ImportRepository } from '../../../src/modules/imports/domain/ports/import-repository.port.js';

describe('CreateImportPreviewUseCase', () => {
  it('parses CSV and persists a preview without invoking AI', async () => {
    const csvParser: CsvParser = {
      parse: vi.fn(async () => ({
        headers: ['Name', 'Email'],
        rows: [
          {
            rowIndex: 1,
            rawData: {
              Name: 'John',
              Email: 'john@example.com',
            },
            rawTextHash: 'hash-1',
          },
        ],
        emptyRowCount: 0,
        warningCount: 0,
      })),
    };
    const repository: ImportRepository = {
      createPreview: vi.fn(async (input) => ({
        importId: 'import-1',
        status: 'PARSED',
        file: input.file,
        headers: input.headers,
        previewRows: input.rows.map((row) => ({
          rowIndex: row.rowIndex,
          values: row.rawData,
          validationStatus: 'CANDIDATE',
        })),
        summary: {
          totalRows: input.rows.length,
          previewRowCount: input.rows.length,
          candidateRowCount: input.validationSummary.candidateRowCount,
          skippedRowCount: input.validationSummary.skippedRowCount,
          emptyRowCount: input.emptyRowCount,
          duplicateRowCount: input.validationSummary.duplicateRowCount,
          noContactRowCount: input.validationSummary.noContactRowCount,
          warningCount: input.warningCount,
        },
      })),
      getJobSummary: vi.fn(),
      markProcessing: vi.fn(),
      createBatches: vi.fn(),
      getProcessableBatches: vi.fn(),
      getRowsForBatch: vi.fn(),
      markBatchProcessing: vi.fn(),
      markBatchCompleted: vi.fn(),
      markBatchFailed: vi.fn(),
      persistBatchResult: vi.fn(),
      completeJobIfFinished: vi.fn(),
      failJob: vi.fn(),
      cancelJob: vi.fn(),
      getStatus: vi.fn(),
      getResult: vi.fn(),
    };
    const useCase = new CreateImportPreviewUseCase(csvParser, repository, {
      uploadMaxFileSizeBytes: 1024 * 1024,
      importMaxRows: 100,
      csvMaxRecordSizeBytes: 1024 * 1024,
      csvPreviewRowLimit: 20,
    } as Env);

    const result = await useCase.execute({
      originalName: 'leads.csv',
      mimeType: 'text/csv',
      sizeBytes: 30,
      buffer: Buffer.from('Name,Email\nJohn,john@example.com'),
    });

    expect(csvParser.parse).toHaveBeenCalledOnce();
    expect(repository.createPreview).toHaveBeenCalledOnce();
    expect(repository.createPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        skippedRows: [],
        validationSummary: expect.objectContaining({
          candidateRowCount: 1,
          skippedRowCount: 0,
        }),
      })
    );
    expect(result.status).toBe('PARSED');
    expect(result.previewRows).toHaveLength(1);
  });

  it('pre-validates rows and passes skipped rows to the repository before AI processing', async () => {
    const csvParser: CsvParser = {
      parse: vi.fn(async () => ({
        headers: ['Name', 'Email'],
        rows: [
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
              Name: 'No Contact',
              Email: '',
            },
            rawTextHash: 'hash-2',
          },
          {
            rowIndex: 3,
            rawData: {
              Name: 'John',
              Email: 'john@example.com',
            },
            rawTextHash: 'hash-1',
          },
        ],
        emptyRowCount: 0,
        warningCount: 0,
      })),
    };
    const repository = createRepository();
    const useCase = new CreateImportPreviewUseCase(csvParser, repository, {
      uploadMaxFileSizeBytes: 1024 * 1024,
      importMaxRows: 100,
      csvMaxRecordSizeBytes: 1024 * 1024,
      csvPreviewRowLimit: 20,
    } as Env);

    await useCase.execute({
      originalName: 'leads.csv',
      mimeType: 'text/csv',
      sizeBytes: 30,
      buffer: Buffer.from('Name,Email\nJohn,john@example.com'),
    });

    expect(repository.createPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        skippedRows: [
          {
            rowIndex: 2,
            reason: 'NO_CONTACT',
          },
          {
            rowIndex: 3,
            reason: 'DUPLICATE_ROW',
          },
        ],
        validationSummary: expect.objectContaining({
          candidateRowCount: 1,
          skippedRowCount: 2,
          noContactRowCount: 1,
          duplicateRowCount: 1,
        }),
      })
    );
  });
});

function createRepository(): ImportRepository {
  return {
    createPreview: vi.fn(async (input) => ({
      importId: 'import-1',
      status: 'PARSED',
      file: input.file,
      headers: input.headers,
      previewRows: input.rows.map((row) => ({
        rowIndex: row.rowIndex,
        values: row.rawData,
        validationStatus: input.skippedRows.some((skipped) => skipped.rowIndex === row.rowIndex)
          ? 'SKIPPED'
          : 'CANDIDATE',
      })),
      summary: {
        totalRows: input.rows.length,
        previewRowCount: input.rows.length,
        candidateRowCount: input.validationSummary.candidateRowCount,
        skippedRowCount: input.validationSummary.skippedRowCount,
        emptyRowCount: input.emptyRowCount,
        duplicateRowCount: input.validationSummary.duplicateRowCount,
        noContactRowCount: input.validationSummary.noContactRowCount,
        warningCount: input.warningCount,
      },
    })),
    getJobSummary: vi.fn(),
    markProcessing: vi.fn(),
    createBatches: vi.fn(),
    getProcessableBatches: vi.fn(),
    getRowsForBatch: vi.fn(),
    markBatchProcessing: vi.fn(),
    markBatchCompleted: vi.fn(),
    markBatchFailed: vi.fn(),
    persistBatchResult: vi.fn(),
    completeJobIfFinished: vi.fn(),
    failJob: vi.fn(),
    cancelJob: vi.fn(),
    getStatus: vi.fn(),
    getResult: vi.fn(),
  };
}
