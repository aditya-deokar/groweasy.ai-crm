import type { ImportJobSummary, ImportRepository } from '../../domain/ports/import-repository.port.js';

export interface GetImportHistoryInput {
  limit: number;
  cursor?: number;
}

export interface GetImportHistoryOutput {
  jobs: ImportJobSummary[];
  pageInfo: {
    nextCursor: number | null;
    hasMore: boolean;
  };
}

export class GetImportHistoryUseCase {
  public constructor(private readonly repository: ImportRepository) {}

  public async execute(input: GetImportHistoryInput): Promise<GetImportHistoryOutput> {
    const result = await this.repository.getHistory(input.limit, input.cursor);

    return {
      jobs: result.jobs,
      pageInfo: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    };
  }
}
