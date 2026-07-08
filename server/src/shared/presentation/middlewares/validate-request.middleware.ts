import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';
import { ZodError } from 'zod';
import { ValidationError } from '../../domain/errors/validation-error.js';
import { formatZodError } from '../../infrastructure/validation/zod-error-map.js';

export type RequestValidationTarget = 'body' | 'query' | 'params' | 'headers';

export type RequestValidationSchemas = Partial<Record<RequestValidationTarget, ZodType<unknown>>>;

type ValidatedRequestData = Partial<Record<RequestValidationTarget, unknown>>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validated?: ValidatedRequestData;
    }
  }
}

export function validateRequest(schemas: RequestValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.validated = req.validated ?? {};

      for (const [target, schema] of Object.entries(schemas) as [
        RequestValidationTarget,
        ZodType<unknown>,
      ][]) {
        const parsed = schema.parse(getRequestTarget(req, target));
        req.validated[target] = parsed;
        applyParsedTarget(req, target, parsed);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Validation failed.', formatZodError(error)));
        return;
      }

      next(error);
    }
  };
}

function getRequestTarget(req: Request, target: RequestValidationTarget): unknown {
  switch (target) {
    case 'body':
      return req.body;
    case 'query':
      return req.query;
    case 'params':
      return req.params;
    case 'headers':
      return req.headers;
  }
}

function applyParsedTarget(req: Request, target: RequestValidationTarget, parsed: unknown): void {
  switch (target) {
    case 'body':
      req.body = parsed;
      return;
    case 'query':
      return;
    case 'params':
      req.params = parsed as Request['params'];
      return;
    case 'headers':
      return;
  }
}
