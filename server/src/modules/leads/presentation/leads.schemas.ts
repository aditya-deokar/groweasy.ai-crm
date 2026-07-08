import { z } from 'zod';
import { CRM_STATUS_VALUES } from '../../imports/domain/constants/crm-status.js';
import { DATA_SOURCE_VALUES } from '../../imports/domain/constants/data-source.js';

const optionalNullableString = z
  .preprocess((value) => (value === '' ? null : value), z.string().nullable())
  .optional();

const optionalNullableCrmStatus = z
  .preprocess((value) => (value === '' ? null : value), z.enum(CRM_STATUS_VALUES).nullable())
  .optional();

const optionalNullableDataSource = z
  .preprocess((value) => (value === '' ? null : value), z.enum(DATA_SOURCE_VALUES).nullable())
  .optional();

export const leadIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listLeadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(CRM_STATUS_VALUES).optional(),
  source: z.enum(DATA_SOURCE_VALUES).optional(),
});

export const updateLeadBodySchema = z
  .object({
    created_at: optionalNullableString,
    name: optionalNullableString,
    email: optionalNullableString,
    country_code: optionalNullableString,
    mobile_without_country_code: optionalNullableString,
    company: optionalNullableString,
    city: optionalNullableString,
    state: optionalNullableString,
    country: optionalNullableString,
    lead_owner: optionalNullableString,
    crm_status: optionalNullableCrmStatus,
    crm_note: optionalNullableString,
    data_source: optionalNullableDataSource,
    possession_time: optionalNullableString,
    description: optionalNullableString,
  })
  .strict();

export type LeadIdParams = z.infer<typeof leadIdParamsSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
export type UpdateLeadBody = z.infer<typeof updateLeadBodySchema>;
