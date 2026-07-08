import type { Request, RequestHandler, Response } from 'express';
import { pinoHttp } from 'pino-http';
import type { AppLogger } from '../../../config/logger.js';

export function createRequestLoggerMiddleware(logger: AppLogger): RequestHandler {
  return pinoHttp<Request, Response>({
    logger,
    customProps(req) {
      return {
        requestId: req.requestId,
      };
    },
  }) as RequestHandler;
}
