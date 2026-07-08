import type { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import type { AppLogger } from '../../../config/logger.js';
import { AppError } from '../../domain/errors/app-error.js';
import { sendError } from '../responses/response-sender.js';

export function createErrorHandlerMiddleware(logger: AppLogger): ErrorRequestHandler {
  return (err, req, res, _next) => {
    if (res.headersSent) {
      logger.error({ err, requestId: req.requestId }, 'Error occurred after headers were sent');
      return;
    }

    if (err instanceof AppError) {
      if (err.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
        logger.error(
          {
            err: {
              name: err.name,
              message: err.message,
              stack: err.stack,
            },
            requestId: req.requestId,
            code: err.code,
            statusCode: err.statusCode,
          },
          'Operational server error'
        );
      }

      sendError(req, res, err.message, err.statusCode, err.code, getSafeErrorDetails(err));
      return;
    }

    if (err instanceof ZodError) {
      sendError(
        req,
        res,
        'Validation failed.',
        StatusCodes.BAD_REQUEST,
        'VALIDATION_ERROR',
        err.issues
      );
      return;
    }

    logger.error({ err, requestId: req.requestId }, 'Unhandled application error');

    sendError(
      req,
      res,
      'Internal server error.',
      StatusCodes.INTERNAL_SERVER_ERROR,
      'INTERNAL_SERVER_ERROR'
    );
  };
}

function getSafeErrorDetails(error: AppError): unknown {
  if (process.env.NODE_ENV === 'production' && error.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    return undefined;
  }

  return error.details;
}
