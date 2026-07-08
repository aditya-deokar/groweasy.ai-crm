import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../../domain/errors/app-error.js';

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, StatusCodes.NOT_FOUND, 'ROUTE_NOT_FOUND'));
}
