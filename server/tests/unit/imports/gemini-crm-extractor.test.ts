import { describe, expect, it, vi } from 'vitest';
import type { Env } from '../../../src/config/env.js';
import { AiProviderUnavailableError } from '../../../src/modules/imports/domain/errors/import-errors.js';
import { GeminiCrmExtractor } from '../../../src/modules/imports/infrastructure/ai/gemini-crm-extractor.js';

describe('GeminiCrmExtractor', () => {
  it('calls Gemini generateContent API and validates structured output', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
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
                  created_at: '2026-07-08',
                  name: 'John Doe',
                  email: 'JOHN@EXAMPLE.COM',
                  country_code: '+91',
                  mobile_without_country_code: '98765 43210',
                  company: null,
                  city: null,
                  state: null,
                  country: null,
                  lead_owner: null,
                  crm_status: 'GOOD_LEAD_FOLLOW_UP',
                  crm_note: null,
                  data_source: null,
                  possession_time: null,
                  description: null,
                },
              },
            ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    );
    const extractor = new GeminiCrmExtractor(createEnv(), fetchMock as unknown as typeof fetch);

    const result = await extractor.extractBatch({
      importId: 'import-1',
      headers: ['Name', 'Email', 'Phone'],
      rows: [
        {
          rowIndex: 1,
          rawData: {
            Name: 'John Doe',
            Email: 'john@example.com',
            Phone: '+91 98765 43210',
          },
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-goog-api-key': 'gemini-test-key',
        }),
      })
    );
    const requestBody = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(requestBody).toMatchObject({
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });
    expect(requestBody.generationConfig.responseSchema.required).toContain('rows');
    expect(requestBody.contents[0].parts[0].text).toContain('Extract GrowEasy CRM records');
    expect(result.records[0]).toEqual({
      rowIndex: 1,
      record: expect.objectContaining({
        email: 'john@example.com',
        country_code: '+91',
        mobile_without_country_code: '9876543210',
      }),
    });
  });

  it('requires a Gemini API key', async () => {
    const extractor = new GeminiCrmExtractor({
      ...createEnv(),
      geminiApiKey: undefined,
    } as Env);

    await expect(
      extractor.extractBatch({
        importId: 'import-1',
        headers: [],
        rows: [],
      })
    ).rejects.toThrow(AiProviderUnavailableError);
  });
});

function createEnv(): Env {
  return {
    aiProvider: 'gemini',
    geminiApiKey: 'gemini-test-key',
    geminiModel: 'gemini-3.5-flash',
    defaultPhoneRegion: 'IN',
    aiTemperature: 0,
  } as Env;
}
