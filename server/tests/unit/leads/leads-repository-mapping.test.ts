import { describe, expect, it } from 'vitest';
import {
  mapApiLeadPatchToDbUpdate,
  mapDbLeadToApiLead,
} from '../../../src/modules/leads/infrastructure/database/leads.repository.js';

describe('leads repository mapping', () => {
  it('maps database lead rows to the CRM-shaped API contract', () => {
    const createdAt = new Date('2026-07-09T10:00:00.000Z');

    const lead = mapDbLeadToApiLead({
      id: 'lead-1',
      importJobId: 'import-1',
      importRowId: 'row-1',
      rowIndex: 3,
      createdAtValue: '2026-07-01',
      name: 'Ananya Mehta',
      email: 'ananya@example.com',
      countryCode: '+91',
      mobileWithoutCountryCode: '9876543210',
      company: 'GrowEasy',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      leadOwner: 'Aditya',
      crmStatus: 'GOOD_LEAD_FOLLOW_UP',
      crmNote: 'Requested callback.',
      dataSource: 'leads_on_demand',
      possessionTime: 'Q4',
      description: 'Premium lead',
      confidence: { email: 0.98 },
      createdAt,
    } as never);

    expect(lead).toMatchObject({
      id: 'lead-1',
      created_at: '2026-07-01',
      country_code: '+91',
      mobile_without_country_code: '9876543210',
      lead_owner: 'Aditya',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      crm_note: 'Requested callback.',
      data_source: 'leads_on_demand',
      possession_time: 'Q4',
      description: 'Premium lead',
      createdAt,
    });
  });

  it('maps frontend CRM patch fields to database columns and clears empty values', () => {
    const update = mapApiLeadPatchToDbUpdate({
      name: '  Updated Lead  ',
      country_code: '+91',
      mobile_without_country_code: '',
      crm_status: null,
      data_source: 'eden_park',
      crm_note: '  ',
      lead_owner: 'Sales Team',
    });

    expect(update).toEqual({
      name: 'Updated Lead',
      countryCode: '+91',
      mobileWithoutCountryCode: null,
      crmStatus: null,
      dataSource: 'eden_park',
      crmNote: null,
      leadOwner: 'Sales Team',
    });
  });
});
