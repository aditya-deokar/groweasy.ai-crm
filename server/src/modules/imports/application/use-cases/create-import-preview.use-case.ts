import { createHash } from 'node:crypto';
import type { Env } from '../../../../config/env.js';
import type { CsvParser } from '../../domain/ports/csv-parser.port.js';
import type { ImportRepository } from '../../domain/ports/import-repository.port.js';
import type { ImportPreview } from '../../domain/entities/import-job.js';
import type { PreviewImportFileDto } from '../dto/preview-import.dto.js';
import { CsvFileValidator } from '../../infrastructure/csv/csv-file-validator.js';
import { preValidateImportRows } from '../../domain/services/import-row-pre-validator.js';

export class CreateImportPreviewUseCase {
  private readonly fileValidator: CsvFileValidator;

  public constructor(
    private readonly csvParser: CsvParser,
    private readonly importRepository: ImportRepository,
    private readonly config: Env
  ) {
    this.fileValidator = new CsvFileValidator(config);
  }

  public async execute(file: PreviewImportFileDto | undefined): Promise<ImportPreview> {
    const validFile = this.fileValidator.validate(file);
    const parsedCsv = await this.csvParser.parse({
      buffer: validFile.buffer,
      maxRows: this.config.importMaxRows,
      maxRecordSizeBytes: this.config.csvMaxRecordSizeBytes,
    });
    const validation = preValidateImportRows(parsedCsv.rows);

    const fileSha256 = createHash('sha256').update(validFile.buffer).digest('hex');

    return this.importRepository.createPreview({
      file: {
        originalName: validFile.originalName,
        sizeBytes: validFile.sizeBytes,
        sha256: fileSha256,
      },
      headers: parsedCsv.headers,
      rows: parsedCsv.rows,
      skippedRows: validation.skippedRows,
      validationSummary: validation.summary,
      emptyRowCount: parsedCsv.emptyRowCount + validation.summary.emptyRowCount,
      warningCount: parsedCsv.warningCount,
      previewRowLimit: this.config.csvPreviewRowLimit,
    });
  }
}
