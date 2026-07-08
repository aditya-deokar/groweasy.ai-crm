import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { logger } from '../../../src/config/logger.js';
import { createErrorHandlerMiddleware } from '../../../src/shared/presentation/middlewares/error-handler.middleware.js';
import { validateRequest } from '../../../src/shared/presentation/middlewares/validate-request.middleware.js';

describe('validateRequest', () => {
  it('passes parsed request data to the handler', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/demo',
      validateRequest({
        body: z.object({
          name: z.string().min(2),
          count: z.coerce.number().int().positive(),
        }),
      }),
      (req, res) => {
        res.status(200).json({
          body: req.body,
          validated: req.validated?.body,
        });
      }
    );
    app.use(createErrorHandlerMiddleware(logger));

    const response = await request(app).post('/demo').send({ name: 'Lead', count: '2' }).expect(200);

    expect(response.body.body).toEqual({ name: 'Lead', count: 2 });
    expect(response.body.validated).toEqual({ name: 'Lead', count: 2 });
  });

  it('returns normalized validation errors', async () => {
    const app = express();
    app.use(express.json());
    app.post(
      '/demo',
      validateRequest({
        body: z.object({
          name: z.string().min(2),
        }),
      }),
      (_req, res) => {
        res.status(204).send();
      }
    );
    app.use(createErrorHandlerMiddleware(logger));

    const response = await request(app).post('/demo').send({ name: '' }).expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual([
      {
        path: 'name',
        code: 'too_small',
        message: expect.any(String),
      },
    ]);
  });

  it('stores parsed query values without mutating Express query getter', async () => {
    const app = express();
    app.get(
      '/demo',
      validateRequest({
        query: z.object({
          limit: z.coerce.number().int().positive(),
          includeSkipped: z.coerce.boolean(),
        }),
      }),
      (req, res) => {
        res.status(200).json({
          rawQuery: req.query,
          validatedQuery: req.validated?.query,
        });
      }
    );
    app.use(createErrorHandlerMiddleware(logger));

    const response = await request(app)
      .get('/demo?limit=100&includeSkipped=true')
      .expect(200);

    expect(response.body.rawQuery).toEqual({
      limit: '100',
      includeSkipped: 'true',
    });
    expect(response.body.validatedQuery).toEqual({
      limit: 100,
      includeSkipped: true,
    });
  });
});
