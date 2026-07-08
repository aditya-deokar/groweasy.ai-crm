import type { NextFunction, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import {
  REQUEST_ID_HEADER,
  runWithRequestContext,
} from '../../infrastructure/http/request-context.js';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingRequestId = req.header(REQUEST_ID_HEADER);
  const requestId = incomingRequestId && incomingRequestId.length > 0 ? incomingRequestId : nanoid();

  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  runWithRequestContext({ requestId, startedAt: Date.now() }, next);
}
