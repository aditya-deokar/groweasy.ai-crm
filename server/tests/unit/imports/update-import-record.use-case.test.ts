import { describe, expect, it, vi } from 'vitest';
import { UpdateImportRecordUseCase } from '../../../src/modules/imports/application/use-cases/update-import-record.use-case.js';
import { ImportNotFoundError, ImportNotReadyError } from '../../../src/modules/imports/domain/errors/import-errors.js';
import type { ImportRepository } from '../../../src/modules/imports/domain/ports/import-repository.port.js';

describe('UpdateImportRecordUseCase', () => {
  it('updates a record when job is completed', async () => {
    const mockRepo = {
      getJobSummary: vi.fn().mockResolvedValue({ status: 'COMPLETED' }),
      updateImportedRecord: vi.fn().mockResolvedValue(undefined),
    } as unknown as ImportRepository;

    const useCase = new UpdateImportRecordUseCase(mockRepo);
    await useCase.execute({ importId: 'imp-1', rowIndex: 1, record: { name: 'New Name' } });

    expect(mockRepo.updateImportedRecord).toHaveBeenCalledWith('imp-1', 1, { name: 'New Name' });
  });

  it('throws ImportNotFoundError if job does not exist', async () => {
    const mockRepo = {
      getJobSummary: vi.fn().mockResolvedValue(null),
    } as unknown as ImportRepository;

    const useCase = new UpdateImportRecordUseCase(mockRepo);
    await expect(useCase.execute({ importId: 'imp-1', rowIndex: 1, record: { name: 'New Name' } })).rejects.toThrow(ImportNotFoundError);
  });

});
