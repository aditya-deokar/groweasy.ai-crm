import path from 'node:path';
import type { Env } from '../../../../config/env.js';
import {
  EmptyCsvFileError,
  FileRequiredError,
  FileTooLargeError,
  UnsupportedFileTypeError,
} from '../../domain/errors/import-errors.js';
import type { PreviewImportFileDto } from '../../application/dto/preview-import.dto.js';

const ALLOWED_MIME_TYPES = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/octet-stream',
  'text/plain',
]);

export class CsvFileValidator {
  public constructor(private readonly config: Env) {}

  public validate(file: PreviewImportFileDto | undefined): PreviewImportFileDto {
    if (!file) {
      throw new FileRequiredError();
    }

    if (file.sizeBytes > this.config.uploadMaxFileSizeBytes) {
      throw new FileTooLargeError(this.config.uploadMaxFileSizeBytes);
    }

    if (file.sizeBytes === 0 || file.buffer.length === 0) {
      throw new EmptyCsvFileError();
    }

    const extension = path.extname(file.originalName).toLowerCase();
    const hasCsvExtension = extension === '.csv';
    const hasAllowedMimeType = ALLOWED_MIME_TYPES.has(file.mimeType);

    if (!hasCsvExtension || !hasAllowedMimeType) {
      throw new UnsupportedFileTypeError();
    }

    return file;
  }

  public isAllowedUpload(file: Express.Multer.File): boolean {
    const extension = path.extname(file.originalname).toLowerCase();
    return extension === '.csv' && ALLOWED_MIME_TYPES.has(file.mimetype);
  }
}
