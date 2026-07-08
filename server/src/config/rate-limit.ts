import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import { env } from './env.js';
import { sendError } from '../shared/presentation/responses/response-sender.js';

export function createRateLimitMiddleware() {
  return rateLimit({
    windowMs: env.rateLimitWindowMs,
    limit: env.rateLimitMaxRequests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler(req, res) {
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
