import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  public readonly isOperational = true;

  public constructor(
    message: string,
    public readonly statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    public readonly code: string = 'APP_ERROR',
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}
