import { describe, expect, it } from 'vitest';
import { normalizeCrmRecord } from '../../../src/modules/imports/domain/services/crm-record-normalizer.js';

describe('CRM record normalizer', () => {
  it('normalizes emails, dates, enums, and multiline notes', () => {
    const normalized = normalizeCrmRecord({
      created_at: '2026-05-13T14:20:48.000Z',
      name: ' John Doe ',
      email: ' JOHN@EXAMPLE.COM ',
      country_code: '+91',
      mobile_without_country_code: '98765 43210',
      company: 'GrowEasy',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      lead_owner: ' OWNER@EXAMPLE.COM ',
      crm_status: 'hot',
      crm_note: 'Line 1\nLine 2',
      data_source: 'Meridian Tower',
      possession_time: '',
      description: ' Interested ',
    });

    expect(normalized.email).toBe('john@example.com');
    expect(normalized.lead_owner).toBe('owner@example.com');
    expect(normalized.created_at).toBe('2026-05-13');
    expect(normalized.country_code).toBe('+91');
    expect(normalized.mobile_without_country_code).toBe('9876543210');
    expect(normalized.crm_status).toBe('GOOD_LEAD_FOLLOW_UP');
    expect(normalized.data_source).toBe('meridian_tower');
    expect(normalized.crm_note).toBe('Line 1\\nLine 2');
    expect(normalized.possession_time).toBeNull();
    expect(normalized.description).toBe('Interested');
  });

  it('normalizes Indian slash dates as DD/MM/YYYY', () => {
    const normalized = normalizeCrmRecord({
      created_at: '08/07/2026',
      name: null,
      email: 'lead@example.com',
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
      description: null,
    });

    expect(normalized.created_at).toBe('2026-07-08');
  });

  it('keeps invalid phone text in notes when the row still has email contact', () => {
    const normalized = normalizeCrmRecord({
      created_at: null,
      name: null,
      email: 'lead@example.com',
      country_code: '+91',
      mobile_without_country_code: '123',
      company: null,
      city: null,
      state: null,
      country: null,
      lead_owner: null,
      crm_status: null,
      crm_note: 'Original note',
      data_source: null,
      possession_time: null,
      description: null,
    });

    expect(normalized.country_code).toBeNull();
    expect(normalized.mobile_without_country_code).toBeNull();
    expect(normalized.crm_note).toBe('Original note | Unparsed phone: +91 123');
  });
});
