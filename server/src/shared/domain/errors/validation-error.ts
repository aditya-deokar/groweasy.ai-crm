import { StatusCodes } from 'http-status-codes';
import { AppError } from './app-error.js';

export class ValidationError extends AppError {
  public constructor(message = 'Validation failed.', details?: unknown) {
    super(message, StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}
