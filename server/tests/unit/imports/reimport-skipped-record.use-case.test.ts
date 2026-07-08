import { describe, expect, it, vi } from 'vitest';
import { ReimportSkippedRecordUseCase } from '../../../src/modules/imports/application/use-cases/reimport-skipped-record.use-case.js';
import { ImportNotFoundError, InvalidCsvError } from '../../../src/modules/imports/domain/errors/import-errors.js';
import type { ImportRepository } from '../../../src/modules/imports/domain/ports/import-repository.port.js';
import type { AiCrmExtractor } from '../../../src/modules/imports/domain/ports/ai-extractor.port.js';

describe('ReimportSkippedRecordUseCase', () => {
  it('throws ImportNotFoundError if job is missing', async () => {
    const mockRepo = { getJobSummary: vi.fn().mockResolvedValue(null) } as unknown as ImportRepository;
    const mockAi = {} as AiCrmExtractor;

    const useCase = new ReimportSkippedRecordUseCase(mockRepo, mockAi);
    await expect(useCase.execute({ importId: '1', rowIndex: 1, newRawData: {} })).rejects.toThrow(ImportNotFoundError);
  });

  it('throws if skipped record is missing', async () => {
    const mockRepo = {
      getJobSummary: vi.fn().mockResolvedValue({}),
      getSkippedRecord: vi.fn().mockResolvedValue(null),
    } as unknown as ImportRepository;
    const mockAi = {} as AiCrmExtractor;

    const useCase = new ReimportSkippedRecordUseCase(mockRepo, mockAi);
    await expect(useCase.execute({ importId: '1', rowIndex: 1, newRawData: {} })).rejects.toThrow('Skipped record not found');
  });

  it('re-extracts data and saves it', async () => {
    const mockRepo = {
      getJobSummary: vi.fn().mockResolvedValue({ headers: ['name', 'email'] }),
      getSkippedRecord: vi.fn().mockResolvedValue({ importRowId: 'row-1' }),
      reimportSkippedRecord: vi.fn().mockResolvedValue(undefined),
    } as unknown as ImportRepository;

    const mockAi = {
      extractBatch: vi.fn().mockResolvedValue({
        records: [{ rowIndex: 1, record: { name: 'John', email: 'john@example.com' } }],
        skippedRecords: [],
      }),
    } as unknown as AiCrmExtractor;

    const useCase = new ReimportSkippedRecordUseCase(mockRepo, mockAi);
    await useCase.execute({ importId: '1', rowIndex: 1, newRawData: { email: 'john@example.com' } });

    expect(mockAi.extractBatch).toHaveBeenCalled();
    expect(mockRepo.reimportSkippedRecord).toHaveBeenCalledWith('1', 'row-1', 1, { name: 'John', email: 'john@example.com' });
  });

  it('throws InvalidCsvError if AI skips it again', async () => {
    const mockRepo = {
      getJobSummary: vi.fn().mockResolvedValue({ headers: ['name', 'email'] }),
      getSkippedRecord: vi.fn().mockResolvedValue({ importRowId: 'row-1' }),
    } as unknown as ImportRepository;

    const mockAi = {
      extractBatch: vi.fn().mockResolvedValue({
        records: [],
        skippedRecords: [{ rowIndex: 1, reason: 'Invalid data' }],
      }),
    } as unknown as AiCrmExtractor;

    const useCase = new ReimportSkippedRecordUseCase(mockRepo, mockAi);
    await expect(useCase.execute({ importId: '1', rowIndex: 1, newRawData: { email: 'invalid' } })).rejects.toThrow(InvalidCsvError);
  });
});
