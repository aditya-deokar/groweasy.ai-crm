import type { Request, RequestHandler, Response } from 'express';
import rateLimitLib from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../shared/presentation/responses/response-sender.js';
import { env, getEnv } from './env.js';

const rateLimit = (
  typeof rateLimitLib === 'function'
    ? rateLimitLib
    : (rateLimitLib as unknown as { default: (options: unknown) => RequestHandler }).default || rateLimitLib
) as (options: unknown) => RequestHandler;

export function createRateLimitMiddleware(): RequestHandler {
  const config = env ?? getEnv();
  return rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMaxRequests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    validate: {
      xForwardedForHeader: false,
      forwardedHeader: false,
    },

    handler(req: Request, res: Response) {
      sendError(
        req,
        res,
        'Too many requests. Please try again later.',
        StatusCodes.TOO_MANY_REQUESTS,
        'RATE_LIMIT_EXCEEDED'
      );
    },
  });
}
