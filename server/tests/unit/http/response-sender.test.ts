import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { requestIdMiddleware } from '../../../src/shared/presentation/middlewares/request-id.middleware.js';
import { sendSuccess } from '../../../src/shared/presentation/responses/response-sender.js';

describe('response sender', () => {
  it('returns the standard success envelope with a request id', async () => {
    const app = express();
    app.use(requestIdMiddleware);
    app.get('/ok', (req, res) => {
      sendSuccess(req, res, { value: 1 }, 'Done.');
    });

    const response = await request(app).get('/ok').expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Done.',
      data: {
        value: 1,
      },
    });
    expect(response.body.meta.requestId).toEqual(expect.any(String));
    expect(response.headers['x-request-id']).toEqual(response.body.meta.requestId);
  });
});
