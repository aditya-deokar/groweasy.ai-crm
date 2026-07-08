import { StatusCodes } from 'http-status-codes';
import { AppError } from '../../../../shared/domain/errors/app-error.js';

export class FileRequiredError extends AppError {
  public constructor() {
    super('CSV file is required.', StatusCodes.BAD_REQUEST, 'CSV_FILE_REQUIRED');
  }
}

export class EmptyCsvFileError extends AppError {
  public constructor() {
    super('CSV file is empty.', StatusCodes.BAD_REQUEST, 'CSV_FILE_EMPTY');
  }
}

export class UnsupportedFileTypeError extends AppError {
  public constructor(message = 'Unsupported file type. Please upload a CSV file.') {
    super(message, StatusCodes.UNSUPPORTED_MEDIA_TYPE, 'CSV_UNSUPPORTED_FILE_TYPE');
  }
}

export class FileTooLargeError extends AppError {
  public constructor(maxSizeBytes: number) {
    super(
      `File is too large. Maximum allowed size is ${maxSizeBytes} bytes.`,
      StatusCodes.REQUEST_TOO_LONG,
      'CSV_FILE_TOO_LARGE',
      { maxSizeBytes }
    );
  }
}

export class InvalidCsvError extends AppError {
  public constructor(message = 'Invalid CSV file.', details?: unknown) {
    super(message, StatusCodes.BAD_REQUEST, 'CSV_PARSE_FAILED', details);
  }
}

export class ImportRowLimitExceededError extends AppError {
  public constructor(maxRows: number) {
    super(
      `CSV row limit exceeded. Maximum allowed rows: ${maxRows}.`,
      StatusCodes.UNPROCESSABLE_ENTITY,
      'CSV_TOO_MANY_ROWS',
      { maxRows }
    );
  }
}

export class ImportNotFoundError extends AppError {
  public constructor() {
    super('Import job not found.', StatusCodes.NOT_FOUND, 'IMPORT_NOT_FOUND');
  }
}

export class ImportNotReadyError extends AppError {
  public constructor(message = 'Import job is not ready for this action.') {
    super(message, StatusCodes.CONFLICT, 'IMPORT_INVALID_STATE');
  }
}

export class CsvUploadRejectedError extends AppError {
  public constructor(message = 'CSV upload was rejected.') {
    super(message, StatusCodes.BAD_REQUEST, 'CSV_UPLOAD_REJECTED');
  }
}

export class AiProviderUnavailableError extends AppError {
  public constructor(message = 'AI provider is unavailable.', details?: unknown) {
    super(message, StatusCodes.SERVICE_UNAVAILABLE, 'AI_PROVIDER_UNAVAILABLE', details);
  }
}

export class AiInvalidStructuredOutputError extends AppError {
  public constructor(details?: unknown) {
    super(
      'AI returned invalid structured output.',
      StatusCodes.BAD_GATEWAY,
      'AI_INVALID_STRUCTURED_OUTPUT',
      details
    );
  }
}

export class AiBatchFailedError extends AppError {
  public constructor(message = 'AI batch processing failed.', details?: unknown) {
    super(message, StatusCodes.BAD_GATEWAY, 'AI_BATCH_FAILED', details);
  }
}
