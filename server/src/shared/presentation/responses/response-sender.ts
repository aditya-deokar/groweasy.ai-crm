import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getRequestId } from '../../infrastructure/http/request-context.js';
import type { ErrorApiResponse, SuccessApiResponse } from './api-response.js';

export function sendSuccess<TData>(
  req: Request,
  res: Response,
  data: TData,
  message = 'Success',
  statusCode: number = StatusCodes.OK
): void {
  const response: SuccessApiResponse<TData> = {
    success: true,
    message,
    data,
    meta: {
      requestId: getRequestId(req),
    },
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}

export function sendError(
  req: Request,
  res: Response,
  message: string,
  statusCode: number,
  code: string,
  details?: unknown
): void {
  const response: ErrorApiResponse = {
    success: false,
    message,
    error: {
      code,
      ...(details !== undefined ? { details } : {}),
    },
    meta: {
      requestId: getRequestId(req),
    },
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}
