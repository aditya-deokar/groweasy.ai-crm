import { CRM_STATUS_VALUES } from '../../../domain/constants/crm-status.js';
import { DATA_SOURCE_VALUES } from '../../../domain/constants/data-source.js';

type JsonSchema = Record<string, unknown>;

const nullableStringSchema = nullable({
  type: 'STRING',
});

const crmExtractionRecordJsonSchema: JsonSchema = {
  type: 'OBJECT',
  properties: {
    created_at: nullableStringSchema,
    name: nullableStringSchema,
    email: nullableStringSchema,
    country_code: nullableStringSchema,
    mobile_without_country_code: nullableStringSchema,
    company: nullableStringSchema,
    city: nullableStringSchema,
    state: nullableStringSchema,
    country: nullableStringSchema,
    lead_owner: nullableStringSchema,
    crm_status: nullable({
      type: 'STRING',
      enum: CRM_STATUS_VALUES,
    }),
    crm_note: nullableStringSchema,
    data_source: nullable({
      type: 'STRING',
      enum: DATA_SOURCE_VALUES,
    }),
    possession_time: nullableStringSchema,
    description: nullableStringSchema,
  },
  required: [
    'created_at',
    'name',
    'email',
    'country_code',
    'mobile_without_country_code',
    'company',
    'city',
    'state',
    'country',
    'lead_owner',
    'crm_status',
    'crm_note',
    'data_source',
    'possession_time',
    'description',
  ],
};

const extractedRowJsonSchema: JsonSchema = {
  type: 'OBJECT',
  properties: {
    rowIndex: {
      type: 'INTEGER',
    },
    action: {
      type: 'STRING',
      enum: ['IMPORT', 'SKIP'],
    },
    skipReason: nullableStringSchema,
    record: nullable(crmExtractionRecordJsonSchema),
  },
  required: ['rowIndex', 'action', 'skipReason', 'record'],
};

export const geminiCrmExtractionJsonSchema: JsonSchema = {
  type: 'OBJECT',
  properties: {
    rows: {
      type: 'ARRAY',
      items: extractedRowJsonSchema,
    },
  },
  required: ['rows'],
};

function nullable(schema: JsonSchema): JsonSchema {
  return {
    ...schema,
    nullable: true,
  };
}
