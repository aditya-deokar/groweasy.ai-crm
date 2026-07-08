import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestApp } from '../helpers/test-app.js';

describe('health endpoints', () => {
  const app = createTestApp();

  it('returns a health report from the root health route', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.data.checks).toEqual([
      {
        name: 'http-server',
        status: 'healthy',
        optional: false,
      },
      {
        name: 'postgres',
        status: 'healthy',
        optional: false,
      },
    ]);
    expect(response.body.meta.requestId).toEqual(expect.any(String));
  });

  it('returns liveness and readiness under the API prefix', async () => {
    const live = await request(app).get('/api/v1/health/live').expect(200);
    const ready = await request(app).get('/api/v1/health/ready').expect(200);

    expect(live.body.data.status).toBe('alive');
    expect(ready.body.data.ready).toBe(true);
    expect(ready.body.data.status).toBe('healthy');
  });
});
