import type { ImportResult } from '../../domain/ports/import-repository.port.js';

export interface GetImportResultDto {
  importId: string;
  limit: number;
  cursor?: number;
  includeSkipped: boolean;
}

export type ImportResultDto = ImportResult;
