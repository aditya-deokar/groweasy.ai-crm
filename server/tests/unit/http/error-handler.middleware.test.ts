import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../../src/config/logger.js';
import { AppError } from '../../../src/shared/domain/errors/app-error.js';
import { createErrorHandlerMiddleware } from '../../../src/shared/presentation/middlewares/error-handler.middleware.js';
import { requestIdMiddleware } from '../../../src/shared/presentation/middlewares/request-id.middleware.js';

const originalNodeEnv = process.env.NODE_ENV;

describe('error handler middleware', () => {
  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
      return;
    }

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('returns operational application errors in the standard envelope', async () => {
    const app = express();
    app.use(requestIdMiddleware);
    app.get('/error', () => {
      throw new AppError('Nope.', StatusCodes.CONFLICT, 'CONFLICT_ERROR', { field: 'email' });
    });
    app.use(createErrorHandlerMiddleware(logger));

    const response = await request(app).get('/error').expect(409);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Nope.',
      error: {
        code: 'CONFLICT_ERROR',
        details: {
          field: 'email',
        },
      },
    });
    expect(response.body.meta.requestId).toEqual(expect.any(String));
  });

  it('hides operational server error details in production responses', async () => {
    process.env.NODE_ENV = 'production';
    const app = express();
    app.use(requestIdMiddleware);
    app.get('/error', () => {
      throw new AppError('Provider failed.', StatusCodes.BAD_GATEWAY, 'AI_PROVIDER_UNAVAILABLE', {
        providerMessage: 'sensitive upstream detail',
      });
    });
    app.use(createErrorHandlerMiddleware(logger));

    const response = await request(app).get('/error').expect(502);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Provider failed.',
      error: {
        code: 'AI_PROVIDER_UNAVAILABLE',
      },
    });
    expect(response.body.error.details).toBeUndefined();
  });
});
