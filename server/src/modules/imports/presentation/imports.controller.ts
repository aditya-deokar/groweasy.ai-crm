import { StatusCodes } from 'http-status-codes';
import type { Request, Response } from 'express';
import type { CreateImportPreviewUseCase } from '../application/use-cases/create-import-preview.use-case.js';
import type { ConfirmImportUseCase } from '../application/use-cases/confirm-import.use-case.js';
import type { GetImportHistoryUseCase } from '../application/use-cases/get-import-history.use-case.js';
import type { GetImportStatusUseCase } from '../application/use-cases/get-import-status.use-case.js';
import type { GetImportResultUseCase } from '../application/use-cases/get-import-result.use-case.js';
import type { RetryFailedBatchesUseCase } from '../application/use-cases/retry-failed-batches.use-case.js';
import type { CancelImportUseCase } from '../application/use-cases/cancel-import.use-case.js';
import type { UpdateImportRecordUseCase } from '../application/use-cases/update-import-record.use-case.js';
import type { ReimportSkippedRecordUseCase } from '../application/use-cases/reimport-skipped-record.use-case.js';
import { sendSuccess } from '../../../shared/presentation/responses/response-sender.js';
import type { PreviewImportFileDto } from '../application/dto/preview-import.dto.js';
import type { ImportIdParams, ImportResultQuery, ImportHistoryQuery, ImportRowParams } from './imports.schemas.js';

export class ImportsController {
  public constructor(
    private readonly createImportPreviewUseCase: CreateImportPreviewUseCase,
    private readonly confirmImportUseCase: ConfirmImportUseCase,
    private readonly getImportHistoryUseCase: GetImportHistoryUseCase,
    private readonly getImportStatusUseCase: GetImportStatusUseCase,
    private readonly getImportResultUseCase: GetImportResultUseCase,
    private readonly updateImportRecordUseCase: UpdateImportRecordUseCase,
    private readonly reimportSkippedRecordUseCase: ReimportSkippedRecordUseCase,
    private readonly retryFailedBatchesUseCase: RetryFailedBatchesUseCase,
    private readonly cancelImportUseCase: CancelImportUseCase
  ) {}

  public async preview(req: Request, res: Response): Promise<void> {
    const preview = await this.createImportPreviewUseCase.execute(mapUploadedFile(req.file));
    sendSuccess(req, res, preview, 'CSV parsed successfully.', StatusCodes.CREATED);
  }

  public async confirm(req: Request, res: Response): Promise<void> {
    const { importId } = req.params as ImportIdParams;
    const status = await this.confirmImportUseCase.execute(importId);
    sendSuccess(req, res, status, 'Import processing started.', StatusCodes.ACCEPTED);
  }

  public async status(req: Request, res: Response): Promise<void> {
    const { importId } = req.params as ImportIdParams;
    const status = await this.getImportStatusUseCase.execute(importId);
    sendSuccess(req, res, status);
  }

  public async history(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ImportHistoryQuery;
    const history = await this.getImportHistoryUseCase.execute(query);
    sendSuccess(req, res, history);
  }

  public async result(req: Request, res: Response): Promise<void> {
    const { importId } = req.params as ImportIdParams;
    const query = (req.validated?.query ?? req.query) as ImportResultQuery;
    const result = await this.getImportResultUseCase.execute({
      importId,
      limit: query.limit,
      cursor: query.cursor,
      includeSkipped: query.includeSkipped,
    });
    sendSuccess(req, res, result, 'Import result fetched.');
  }

  public async retryFailed(req: Request, res: Response): Promise<void> {
    const { importId } = req.params as ImportIdParams;
    const status = await this.retryFailedBatchesUseCase.execute(importId);
    sendSuccess(req, res, status, 'Failed batches retry started.', StatusCodes.ACCEPTED);
  }

  public async cancel(req: Request, res: Response): Promise<void> {
    const { importId } = req.params as ImportIdParams;
    const status = await this.cancelImportUseCase.execute(importId);
    sendSuccess(req, res, status, 'Import cancelled.');
  }

  public async updateRecord(req: Request, res: Response): Promise<void> {
    const { importId, rowIndex } = req.params as unknown as ImportRowParams;
    await this.updateImportRecordUseCase.execute({
      importId,
      rowIndex,
      record: req.body,
    });
    sendSuccess(req, res, null, 'Record updated successfully.');
  }

  public async reimportSkipped(req: Request, res: Response): Promise<void> {
    const { importId, rowIndex } = req.params as unknown as ImportRowParams;
    await this.reimportSkippedRecordUseCase.execute({
      importId,
      rowIndex,
      newRawData: req.body.newRawData,
    });
    sendSuccess(req, res, null, 'Record re-imported successfully.');
  }
}

function mapUploadedFile(file: Express.Multer.File | undefined): PreviewImportFileDto | undefined {
  if (!file) {
    return undefined;
  }

  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    buffer: file.buffer,
  };
}
