import { describe, expect, it, vi } from 'vitest';
import { ConfirmImportUseCase } from '../../../src/modules/imports/application/use-cases/confirm-import.use-case.js';
import type { Env } from '../../../src/config/env.js';
import type { ImportRepository } from '../../../src/modules/imports/domain/ports/import-repository.port.js';
import type { ImportProcessor } from '../../../src/modules/imports/application/services/import-processor.js';

describe('ConfirmImportUseCase', () => {
  it('creates batches, marks the job processing, and starts the processor', async () => {
    const repository = createRepository();
    const processor = {
      start: vi.fn(),
    } as unknown as ImportProcessor;
    const useCase = new ConfirmImportUseCase(repository, processor, {
      aiBatchSize: 25,
    } as Env);

    const result = await useCase.execute('import-1');

    expect(repository.createBatches).toHaveBeenCalledWith({
      importId: 'import-1',
      batchSize: 25,
    });
    expect(repository.markProcessing).toHaveBeenCalledWith('import-1', 2);
    expect(processor.start).toHaveBeenCalledWith('import-1');
    expect(result.status).toBe('PROCESSING');
  });

  it('clamps configured AI batch size to the safe 20-50 range', async () => {
    const repository = createRepository();
    const processor = {
      start: vi.fn(),
    } as unknown as ImportProcessor;
    const useCase = new ConfirmImportUseCase(repository, processor, {
      aiBatchSize: 500,
    } as Env);

    await useCase.execute('import-1');

    expect(repository.createBatches).toHaveBeenCalledWith({
      importId: 'import-1',
      batchSize: 50,
    });
  });

  it('completes immediately when every row was skipped before AI batching', async () => {
    const repository = createRepository({
      batches: [],
      status: 'COMPLETED',
      processedRows: 2,
      skippedCount: 2,
    });
    const processor = {
      start: vi.fn(),
    } as unknown as ImportProcessor;
    const useCase = new ConfirmImportUseCase(repository, processor, {
      aiBatchSize: 25,
    } as Env);

    const result = await useCase.execute('import-1');

    expect(repository.markProcessing).toHaveBeenCalledWith('import-1', 0);
    expect(repository.completeJobIfFinished).toHaveBeenCalledWith('import-1');
    expect(processor.start).not.toHaveBeenCalled();
    expect(result.status).toBe('COMPLETED');
  });
});

interface RepositoryOptions {
  batches?: Awaited<ReturnType<ImportRepository['createBatches']>>;
  status?: 'PROCESSING' | 'COMPLETED';
  processedRows?: number;
  skippedCount?: number;
}

function createRepository(options: RepositoryOptions = {}): ImportRepository {
  const batches = options.batches ?? [
    {
      id: 'batch-1',
      batchIndex: 0,
      status: 'PENDING' as const,
      rowStartIndex: 1,
      rowEndIndex: 25,
      rowCount: 25,
      retryCount: 0,
    },
    {
      id: 'batch-2',
      batchIndex: 1,
      status: 'PENDING' as const,
      rowStartIndex: 26,
      rowEndIndex: 50,
      rowCount: 25,
      retryCount: 0,
    },
  ];

  return {
    createPreview: vi.fn(),
    getJobSummary: vi.fn(async () => ({
      id: 'import-1',
      status: 'PARSED',
      headers: ['Name', 'Email'],
      totalRows: 50,
      totalBatches: 0,
      processedRows: options.processedRows ?? 0,
      importedCount: 0,
      skippedCount: options.skippedCount ?? 0,
      errorMessage: null,
    })),
    markProcessing: vi.fn(async () => undefined),
    createBatches: vi.fn(async () => batches),
    getProcessableBatches: vi.fn(),
    getRowsForBatch: vi.fn(),
    markBatchProcessing: vi.fn(),
    markBatchCompleted: vi.fn(),
    markBatchFailed: vi.fn(),
    persistBatchResult: vi.fn(),
    completeJobIfFinished: vi.fn(),
    failJob: vi.fn(),
    cancelJob: vi.fn(),
    getStatus: vi.fn(async () => ({
      importId: 'import-1',
      status: options.status ?? 'PROCESSING',
      progress: {
        totalRows: 50,
        processedRows: options.processedRows ?? 0,
        totalBatches: batches.length,
        completedBatches: options.status === 'COMPLETED' ? batches.length : 0,
        failedBatches: 0,
        percent: 0,
      },
      totals: {
        imported: 0,
        skipped: options.skippedCount ?? 0,
      },
      error: null,
    })),
    getResult: vi.fn(),
  };
}
