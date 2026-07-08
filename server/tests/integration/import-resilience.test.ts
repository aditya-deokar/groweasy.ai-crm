import request from 'supertest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createTestApp } from '../helpers/test-app.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Import Resilience and Failover', () => {
  let app: any;
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    app = createTestApp();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fails the job if Gemini is rate-limited, and allows retry to complete it', async () => {
    // 1. Upload CSV to parse and create preview
    const smallMessyCsv = `name,email,phone,notes
"John ""Messy"" Doe",john@example.com,1234567890,"This is a
multiline note"
Jane Doe,invalid-email,,`;

    const previewRes = await request(app)
      .post('/api/v1/imports/preview')
      .attach('file', Buffer.from(smallMessyCsv), 'messy.csv')
      .expect(201);

    const importId = previewRes.body.data.importId;
    expect(importId).toBeTruthy();

    // 2. Start the import
    // Mock Gemini to fail consistently with 503 (rate limit / high demand)
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      text: async () => 'High demand'
    });

    await request(app)
      .post(`/api/v1/imports/${importId}/confirm`)
      .expect(202);

    // Wait for processing to fail
    let status;
    for (let i = 0; i < 30; i++) {
      const statusRes = await request(app).get(`/api/v1/imports/${importId}/status`);
      if (statusRes.status === 200) {
        status = statusRes.body.data;
        if (status.status === 'FAILED' || status.status === 'COMPLETED') break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    expect(status.status).toBe('FAILED');
    expect(status.progress.failedBatches).toBeGreaterThan(0);

    // 3. Mock Gemini to succeed for the retry
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    rows: [
                      {
                        rowIndex: 1,
                        action: 'IMPORT',
                        skipReason: null,
                        record: { 
                          name: 'Recovered Lead',
                          email: 'recovered@example.com',
                          created_at: null,
                          country_code: null,
                          mobile_without_country_code: null,
                          company: null,
                          city: null,
                          state: null,
                          country: null,
                          lead_owner: null,
                          crm_status: null,
                          crm_note: null,
                          data_source: null,
                          possession_time: null,
                          description: null
                        }
                      }
                    ]
                  })
                }
              ]
            }
          }
        ]
      })
    });

    // 4. Trigger Retry
    await request(app)
      .post(`/api/v1/imports/${importId}/retry-failed`)
      .expect(202);

    // Wait for processing to complete
    for (let i = 0; i < 30; i++) {
      const statusRes = await request(app).get(`/api/v1/imports/${importId}/status`);
      if (statusRes.status === 200) {
        status = statusRes.body.data;
        if (status.status === 'COMPLETED' || status.status === 'FAILED') break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    expect(status.status).toBe('COMPLETED');
    expect(status.progress.failedBatches).toBe(0);
    expect(status.progress.completedBatches).toBeGreaterThan(0);
  }, 45000);
});
