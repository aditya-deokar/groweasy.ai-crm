import { describe, expect, it, vi } from 'vitest';
import type { Env } from '../../../src/config/env.js';
import { logger } from '../../../src/config/logger.js';
import { LangGraphImportWorkflow } from '../../../src/modules/imports/infrastructure/ai/langgraph-import-workflow.js';
import type { AiCrmExtractor } from '../../../src/modules/imports/domain/ports/ai-extractor.port.js';
import type { ImportRepository } from '../../../src/modules/imports/domain/ports/import-repository.port.js';

describe('LangGraphImportWorkflow', () => {
  it('processes a pending batch and persists imported/skipped records', async () => {
    const repository = createWorkflowRepository();
    const aiExtractor: AiCrmExtractor = {
      extractBatch: vi.fn(async () => ({
        records: [
          {
            rowIndex: 1,
            record: {
              created_at: null,
              name: 'John Doe',
              email: 'john@example.com',
              country_code: '+91',
              mobile_without_country_code: '9876543210',
              company: null,
              city: null,
              state: null,
              country: null,
              lead_owner: null,
              crm_status: 'GOOD_LEAD_FOLLOW_UP',
              crm_note: null,
              data_source: null,
              possession_time: null,
              description: null,
            },
          },
        ],
        skippedRecords: [],
      })),
    };
    const workflow = new LangGraphImportWorkflow(repository, aiExtractor, {
      aiBatchConcurrency: 1,
      aiMaxRetries: 0,
      aiRetryBaseDelayMs: 1,
      aiCircuitBreakerFailureThreshold: 2,
      aiCircuitBreakerCooldownMs: 1000,
    } as Env, logger);

    const result = await workflow.invoke({ importId: 'import-1', includeFailed: false });

    expect(result.processedBatches).toBe(1);
    expect(aiExtractor.extractBatch).toHaveBeenCalledOnce();
    expect(repository.persistBatchResult).toHaveBeenCalledWith(
      expect.objectContaining({
        importId: 'import-1',
        records: expect.any(Array),
        skippedRecords: expect.arrayContaining([
          {
            rowIndex: 2,
            reason: 'Missing email and mobile number',
          },
        ]),
      })
    );
    expect(repository.markBatchCompleted).toHaveBeenCalledWith('batch-1');
    expect(repository.completeJobIfFinished).toHaveBeenCalledWith('import-1');
  });

  it('retries transient AI extraction failures before failing the batch', async () => {
    const repository = createWorkflowRepository();
    const aiExtractor: AiCrmExtractor = {
      extractBatch: vi
        .fn()
        .mockRejectedValueOnce(new Error('rate limit'))
        .mockResolvedValueOnce({
          records: [
            {
              rowIndex: 1,
              record: {
                created_at: null,
                name: 'John Doe',
                email: 'john@example.com',
                country_code: '+91',
                mobile_without_country_code: '9876543210',
                company: null,
                city: null,
                state: null,
                country: null,
                lead_owner: null,
                crm_status: 'GOOD_LEAD_FOLLOW_UP',
                crm_note: null,
                data_source: null,
                possession_time: null,
                description: null,
              },
            },
          ],
          skippedRecords: [],
        }),
    };
    const workflow = new LangGraphImportWorkflow(repository, aiExtractor, {
      aiBatchConcurrency: 1,
      aiMaxRetries: 2,
      aiRetryBaseDelayMs: 1,
      aiCircuitBreakerFailureThreshold: 2,
      aiCircuitBreakerCooldownMs: 1000,
    } as Env, logger);

    await workflow.invoke({ importId: 'import-1', includeFailed: false });

    expect(aiExtractor.extractBatch).toHaveBeenCalledTimes(2);
    expect(repository.markBatchCompleted).toHaveBeenCalledWith('batch-1');
    expect(repository.markBatchFailed).not.toHaveBeenCalled();
  });
});

function createWorkflowRepository(): ImportRepository {
  return {
    createPreview: vi.fn(),
    getJobSummary: vi.fn(async () => ({
      id: 'import-1',
      status: 'PROCESSING',
      headers: ['Name', 'Email', 'Phone'],
      totalRows: 2,
      totalBatches: 1,
      processedRows: 0,
      importedCount: 0,
      skippedCount: 0,
      errorMessage: null,
    })),
    markProcessing: vi.fn(),
    createBatches: vi.fn(),
    getProcessableBatches: vi.fn(async () => [
      {
        id: 'batch-1',
        batchIndex: 0,
        status: 'PENDING',
        rowStartIndex: 1,
        rowEndIndex: 2,
        rowCount: 2,
        retryCount: 0,
      },
    ]),
    getRowsForBatch: vi.fn(async () => [
      {
        id: 'row-1',
        rowIndex: 1,
        rawData: {
          Name: 'John Doe',
          Email: 'john@example.com',
          Phone: '+91 9876543210',
        },
        rawTextHash: 'hash-1',
      },
      {
        id: 'row-2',
        rowIndex: 2,
        rawData: {
          Name: 'No Contact',
        },
        rawTextHash: 'hash-2',
      },
    ]),
    markBatchProcessing: vi.fn(),
    markBatchCompleted: vi.fn(),
    markBatchFailed: vi.fn(),
    persistBatchResult: vi.fn(async () => ({
      processedRows: 2,
      importedCount: 1,
      skippedCount: 1,
    })),
    completeJobIfFinished: vi.fn(),
    failJob: vi.fn(),
    cancelJob: vi.fn(),
    getStatus: vi.fn(async () => ({
      importId: 'import-1',
      status: 'PROCESSING',
      progress: {
        totalRows: 2,
        processedRows: 2,
        totalBatches: 1,
        completedBatches: 1,
        failedBatches: 0,
        percent: 100,
      },
      totals: {
        imported: 1,
        skipped: 1,
      },
      error: null,
    })),
    getResult: vi.fn(),
  };
}
