import { ImportNotFoundError } from '../../domain/errors/import-errors.js';
import type { ImportRepository } from '../../domain/ports/import-repository.port.js';
import type { CrmRecord } from '../../domain/entities/crm-record.js';

export interface UpdateImportRecordInput {
  importId: string;
  rowIndex: number;
  record: Partial<CrmRecord>;
}

export class UpdateImportRecordUseCase {
  public constructor(private readonly repository: ImportRepository) {}

  public async execute(input: UpdateImportRecordInput): Promise<void> {
    const exists = await this.repository.getJobSummary(input.importId);
    if (!exists) {
      throw new ImportNotFoundError();
    }

    await this.repository.updateImportedRecord(input.importId, input.rowIndex, input.record);
  }
}
