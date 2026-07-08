import { AsyncLocalStorage } from 'node:async_hooks';
import type { Request } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

export interface RequestContext {
  requestId: string;
  startedAt: number;
}

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function runWithRequestContext(context: RequestContext, callback: () => void): void {
  requestContextStorage.run(context, callback);
}

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

export function getRequestId(req?: Request): string | undefined {
  return getRequestContext()?.requestId ?? req?.requestId;
}
