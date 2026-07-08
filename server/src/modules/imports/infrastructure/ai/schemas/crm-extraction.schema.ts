import { z } from 'zod';
import { CRM_STATUS_VALUES } from '../../../domain/constants/crm-status.js';
import { DATA_SOURCE_VALUES } from '../../../domain/constants/data-source.js';

export const crmExtractionRecordSchema = z
  .object({
    created_at: z.string().nullable(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    country_code: z.string().nullable(),
    mobile_without_country_code: z.string().nullable(),
    company: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    lead_owner: z.string().nullable(),
    crm_status: z.enum(CRM_STATUS_VALUES).nullable(),
    crm_note: z.string().nullable(),
    data_source: z.enum(DATA_SOURCE_VALUES).nullable(),
    possession_time: z.string().nullable(),
    description: z.string().nullable(),
  })
  .strict();

export const extractedRowSchema = z
  .object({
    rowIndex: z.number().int().positive(),
    action: z.enum(['IMPORT', 'SKIP']),
    skipReason: z.string().nullable(),
    record: crmExtractionRecordSchema.nullable(),
  })
  .strict();

export const crmExtractionBatchSchema = z
  .object({
    rows: z.array(extractedRowSchema),
  })
  .strict();

export type CrmExtractionBatchOutput = z.infer<typeof crmExtractionBatchSchema>;
export type CrmExtractionRecordOutput = z.infer<typeof crmExtractionRecordSchema>;
