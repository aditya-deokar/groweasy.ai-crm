import type { Env } from '../../../../config/env.js';
import {
  ImportNotFoundError,
  ImportNotReadyError,
} from '../../domain/errors/import-errors.js';
import type { ImportRepository, ImportStatusResult } from '../../domain/ports/import-repository.port.js';
import type { ImportProcessor } from '../services/import-processor.js';

export class ConfirmImportUseCase {
  public constructor(
    private readonly repository: ImportRepository,
    private readonly processor: ImportProcessor,
    private readonly config: Env
  ) {}

  public async execute(importId: string): Promise<ImportStatusResult> {
    const job = await this.repository.getJobSummary(importId);
    if (!job) throw new ImportNotFoundError();

    if (job.status === 'PROCESSING') {
      const status = await this.repository.getStatus(importId);
      if (!status) throw new ImportNotFoundError();
      return status;
    }

    if (!['PARSED', 'FAILED'].includes(job.status)) {
      throw new ImportNotReadyError(`Cannot confirm import while status is ${job.status}.`);
    }

    const batchSize = clampBatchSize(this.config.aiBatchSize);
    const batches = await this.repository.createBatches({
      importId,
      batchSize,
    });

    await this.repository.markProcessing(importId, batches.length);

    if (batches.length === 0) {
      await this.repository.completeJobIfFinished(importId);
    } else {
      this.processor.start(importId);
    }

    const status = await this.repository.getStatus(importId);
    if (!status) throw new ImportNotFoundError();
    return status;
  }
}

function clampBatchSize(batchSize: number): number {
  return Math.min(Math.max(batchSize, 20), 50);
}
