import { describe, expect, it, vi } from 'vitest';
import { GetImportHistoryUseCase } from '../../../src/modules/imports/application/use-cases/get-import-history.use-case.js';
import type { ImportRepository } from '../../../src/modules/imports/domain/ports/import-repository.port.js';

describe('GetImportHistoryUseCase', () => {
  it('returns paginated history from repository', async () => {
    const mockRepo = {
      getHistory: vi.fn().mockResolvedValue({
        jobs: [{ id: 'job-1', status: 'COMPLETED' }],
        hasMore: false,
        nextCursor: null,
      }),
    } as unknown as ImportRepository;

    const useCase = new GetImportHistoryUseCase(mockRepo);
    const result = await useCase.execute({ limit: 10, cursor: 5 });

    expect(mockRepo.getHistory).toHaveBeenCalledWith(10, 5);
    expect(result.jobs).toHaveLength(1);
    expect(result.pageInfo.hasMore).toBe(false);
  });
});
