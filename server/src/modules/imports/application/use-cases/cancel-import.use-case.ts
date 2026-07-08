import { ImportNotFoundError } from '../../domain/errors/import-errors.js';
import type { ImportRepository, ImportStatusResult } from '../../domain/ports/import-repository.port.js';

export class CancelImportUseCase {
  public constructor(private readonly repository: ImportRepository) {}

  public async execute(importId: string): Promise<ImportStatusResult> {
    const job = await this.repository.getJobSummary(importId);
    if (!job) throw new ImportNotFoundError();

    await this.repository.cancelJob(importId);

    const status = await this.repository.getStatus(importId);
    if (!status) throw new ImportNotFoundError();
    return status;
  }
}
