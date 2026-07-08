import { ImportNotFoundError } from '../../domain/errors/import-errors.js';
import type {
  GetImportResultInput,
  ImportRepository,
  ImportResult,
} from '../../domain/ports/import-repository.port.js';

export class GetImportResultUseCase {
  public constructor(private readonly repository: ImportRepository) {}

  public async execute(input: GetImportResultInput): Promise<ImportResult> {
    const result = await this.repository.getResult(input);
    if (!result) throw new ImportNotFoundError();
    return result;
  }
}
