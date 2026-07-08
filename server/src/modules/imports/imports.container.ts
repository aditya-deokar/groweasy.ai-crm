import type { Router } from 'express';
import type { Env } from '../../config/env.js';
import type { Database } from '../../db/index.js';
import { CreateImportPreviewUseCase } from './application/use-cases/create-import-preview.use-case.js';
import { ConfirmImportUseCase } from './application/use-cases/confirm-import.use-case.js';
import { GetImportStatusUseCase } from './application/use-cases/get-import-status.use-case.js';
import { GetImportResultUseCase } from './application/use-cases/get-import-result.use-case.js';
import { RetryFailedBatchesUseCase } from './application/use-cases/retry-failed-batches.use-case.js';
import { CancelImportUseCase } from './application/use-cases/cancel-import.use-case.js';
import { ImportProcessor } from './application/services/import-processor.js';
import type { AppLogger } from '../../config/logger.js';
import { CsvParseAdapter } from './infrastructure/csv/csv-parse-adapter.js';
import type { AiCrmExtractor } from './domain/ports/ai-extractor.port.js';
import { createAiCrmExtractor } from './infrastructure/ai/ai-extractor.factory.js';
import { LangGraphImportWorkflow } from './infrastructure/ai/langgraph-import-workflow.js';
import { DrizzleImportRepository } from './infrastructure/database/drizzle-import-repository.js';
import { ImportsController } from './presentation/imports.controller.js';
import { createImportsRouter } from './presentation/imports.routes.js';

export interface ImportsContainerInput {
  config: Env;
  database: Database;
  logger: AppLogger;
}

export interface ImportsModuleContainer {
  csvParser: CsvParseAdapter;
  repository: DrizzleImportRepository;
  aiExtractor: AiCrmExtractor;
  workflow: LangGraphImportWorkflow;
  processor: ImportProcessor;
  useCases: {
    createImportPreview: CreateImportPreviewUseCase;
    confirmImport: ConfirmImportUseCase;
    getImportStatus: GetImportStatusUseCase;
    getImportResult: GetImportResultUseCase;
    retryFailedBatches: RetryFailedBatchesUseCase;
    cancelImport: CancelImportUseCase;
  };
  controller: ImportsController;
  router: Router;
}

export function createImportsContainer(input: ImportsContainerInput): ImportsModuleContainer {
  const csvParser = new CsvParseAdapter();
  const repository = new DrizzleImportRepository(input.database);
  const aiExtractor = createAiCrmExtractor(input.config);
  const workflow = new LangGraphImportWorkflow(repository, aiExtractor, input.config, input.logger);
  const processor = new ImportProcessor(workflow, input.logger);
  const createImportPreview = new CreateImportPreviewUseCase(csvParser, repository, input.config);
  const confirmImport = new ConfirmImportUseCase(repository, processor, input.config);
  const getImportStatus = new GetImportStatusUseCase(repository);
  const getImportResult = new GetImportResultUseCase(repository);
  const retryFailedBatches = new RetryFailedBatchesUseCase(repository, processor);
  const cancelImport = new CancelImportUseCase(repository);
  const controller = new ImportsController(
    createImportPreview,
    confirmImport,
    getImportStatus,
    getImportResult,
    retryFailedBatches,
    cancelImport
  );
  const router = createImportsRouter(controller, input.config);

  return {
    csvParser,
    repository,
    aiExtractor,
    workflow,
    processor,
    useCases: {
      createImportPreview,
      confirmImport,
      getImportStatus,
      getImportResult,
      retryFailedBatches,
      cancelImport,
    },
    controller,
    router,
  };
}
