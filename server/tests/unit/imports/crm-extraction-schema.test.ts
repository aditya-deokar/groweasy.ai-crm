import { describe, expect, it } from 'vitest';
import { crmExtractionBatchSchema } from '../../../src/modules/imports/infrastructure/ai/schemas/crm-extraction.schema.js';

describe('CRM extraction schema', () => {
  it('accepts valid structured AI output', () => {
    const result = crmExtractionBatchSchema.safeParse({
      rows: [
        {
          rowIndex: 1,
          action: 'IMPORT',
          skipReason: null,
          record: {
            created_at: '2026-05-13T14:20:48.000Z',
            name: 'John Doe',
            email: 'john@example.com',
            country_code: '+91',
            mobile_without_country_code: '9876543210',
            company: 'GrowEasy',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            lead_owner: 'owner@example.com',
            crm_status: 'GOOD_LEAD_FOLLOW_UP',
            crm_note: 'Asked for demo',
            data_source: 'leads_on_demand',
            possession_time: null,
            description: null,
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects unknown CRM status values', () => {
    const result = crmExtractionBatchSchema.safeParse({
      rows: [
        {
          rowIndex: 1,
          action: 'IMPORT',
          skipReason: null,
          record: {
            created_at: null,
            name: null,
            email: 'john@example.com',
            country_code: null,
            mobile_without_country_code: null,
            company: null,
            city: null,
            state: null,
            country: null,
            lead_owner: null,
            crm_status: 'HOT_LEAD',
            crm_note: null,
            data_source: null,
            possession_time: null,
            description: null,
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown fields in AI output', () => {
    const result = crmExtractionBatchSchema.safeParse({
      rows: [
        {
          rowIndex: 1,
          action: 'SKIP',
          skipReason: 'No lead',
          record: null,
          unexpectedField: 'must not be accepted',
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
