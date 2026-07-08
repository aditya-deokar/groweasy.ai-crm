import type { RequestHandler } from 'express';
import multer from 'multer';
import type { Env } from '../../../../config/env.js';
import {
  CsvUploadRejectedError,
  FileTooLargeError,
  UnsupportedFileTypeError,
} from '../../domain/errors/import-errors.js';
import { CsvFileValidator } from '../csv/csv-file-validator.js';

export function createCsvUploadMiddleware(config: Env): RequestHandler {
  const validator = new CsvFileValidator(config);
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: config.uploadMaxFileSizeBytes,
      files: 1,
    },
    fileFilter(_req, file, callback) {
      if (!validator.isAllowedUpload(file)) {
        callback(new UnsupportedFileTypeError());
        return;
      }

      callback(null, true);
    },
  }).single('file');

  return (req, res, next) => {
    upload(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        next(new FileTooLargeError(config.uploadMaxFileSizeBytes));
        return;
      }

      if (error instanceof multer.MulterError) {
        next(new CsvUploadRejectedError(getMulterErrorMessage(error)));
        return;
      }

      next(error);
    });
  };
}

function getMulterErrorMessage(error: multer.MulterError): string {
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return 'Upload a single CSV file in the "file" form field.';
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return 'Only one CSV file can be uploaded at a time.';
  }

  return 'CSV upload was rejected.';
}
