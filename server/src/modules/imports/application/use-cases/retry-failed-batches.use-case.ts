import {
  ImportNotFoundError,
  ImportNotReadyError,
} from '../../domain/errors/import-errors.js';
import type { ImportRepository, ImportStatusResult } from '../../domain/ports/import-repository.port.js';
import type { ImportProcessor } from '../services/import-processor.js';

export class RetryFailedBatchesUseCase {
  public constructor(
    private readonly repository: ImportRepository,
    private readonly processor: ImportProcessor
  ) {}

  public async execute(importId: string): Promise<ImportStatusResult> {
    const job = await this.repository.getJobSummary(importId);
    if (!job) throw new ImportNotFoundError();

    if (!['FAILED', 'PROCESSING'].includes(job.status)) {
      throw new ImportNotReadyError(`Cannot retry failed batches while status is ${job.status}.`);
    }

    await this.repository.markProcessing(importId, job.totalBatches);
    this.processor.start(importId, true);

    const status = await this.repository.getStatus(importId);
    if (!status) throw new ImportNotFoundError();
    return status;
  }
}
