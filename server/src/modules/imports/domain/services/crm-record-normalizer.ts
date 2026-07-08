import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import type { CrmRecord } from '../entities/crm-record.js';
import type { CrmStatus } from '../constants/crm-status.js';
import { isCrmStatus } from '../constants/crm-status.js';
import type { DataSource } from '../constants/data-source.js';
import { isDataSource } from '../constants/data-source.js';

export interface NormalizableCrmRecord extends Omit<CrmRecord, 'crm_status' | 'data_source' | 'confidence'> {
  crm_status: string | null;
  data_source: string | null;
}

export interface NormalizeCrmRecordOptions {
  defaultPhoneRegion?: string;
  maxNoteLength?: number;
}

const DEFAULT_PHONE_REGION = 'IN';
const DEFAULT_MAX_NOTE_LENGTH = 2_000;

const CRM_STATUS_ALIASES = new Map<string, CrmStatus>([
  ['good lead follow up', 'GOOD_LEAD_FOLLOW_UP'],
  ['good_lead_follow_up', 'GOOD_LEAD_FOLLOW_UP'],
  ['follow up', 'GOOD_LEAD_FOLLOW_UP'],
  ['follow_up', 'GOOD_LEAD_FOLLOW_UP'],
  ['callback', 'GOOD_LEAD_FOLLOW_UP'],
  ['call back', 'GOOD_LEAD_FOLLOW_UP'],
  ['hot', 'GOOD_LEAD_FOLLOW_UP'],
  ['qualified', 'GOOD_LEAD_FOLLOW_UP'],
  ['did not connect', 'DID_NOT_CONNECT'],
  ['did_not_connect', 'DID_NOT_CONNECT'],
  ['not connected', 'DID_NOT_CONNECT'],
  ['no answer', 'DID_NOT_CONNECT'],
  ['bad lead', 'BAD_LEAD'],
  ['bad_lead', 'BAD_LEAD'],
  ['invalid', 'BAD_LEAD'],
  ['junk', 'BAD_LEAD'],
  ['lost', 'BAD_LEAD'],
  ['sale done', 'SALE_DONE'],
  ['sale_done', 'SALE_DONE'],
  ['converted', 'SALE_DONE'],
  ['won', 'SALE_DONE'],
]);

const DATA_SOURCE_ALIASES = new Map<string, DataSource>([
  ['leads on demand', 'leads_on_demand'],
  ['leads_on_demand', 'leads_on_demand'],
  ['lead on demand', 'leads_on_demand'],
  ['lod', 'leads_on_demand'],
  ['meridian tower', 'meridian_tower'],
  ['meridian_tower', 'meridian_tower'],
  ['meridian', 'meridian_tower'],
  ['eden park', 'eden_park'],
  ['eden_park', 'eden_park'],
  ['eden', 'eden_park'],
  ['varah swamy', 'varah_swamy'],
  ['varah_swamy', 'varah_swamy'],
  ['varah', 'varah_swamy'],
  ['sarjapur plots', 'sarjapur_plots'],
  ['sarjapur_plots', 'sarjapur_plots'],
  ['sarjapur', 'sarjapur_plots'],
]);

export function normalizeCrmRecord(
  record: NormalizableCrmRecord,
  options: NormalizeCrmRecordOptions = {}
): CrmRecord {
  const phone = normalizePhone(
    record.country_code,
    record.mobile_without_country_code,
    options.defaultPhoneRegion
  );
  const noteFragments = [
    normalizeNullableText(record.crm_note, options),
    phone.unparsedPhone ? `Unparsed phone: ${phone.unparsedPhone}` : null,
  ].filter((value) => value !== null);

  const normalized: CrmRecord = {
    created_at: normalizeDateString(record.created_at),
    name: normalizeNullableText(record.name),
    email: normalizeEmail(record.email),
    country_code: phone.countryCode,
    mobile_without_country_code: phone.mobileWithoutCountryCode,
    company: normalizeNullableText(record.company),
    city: normalizeNullableText(record.city),
    state: normalizeNullableText(record.state),
    country: normalizeNullableText(record.country),
    lead_owner: normalizeEmail(record.lead_owner),
    crm_status: normalizeCrmStatus(record.crm_status),
    crm_note: normalizeNullableText(noteFragments.join(' | '), options),
    data_source: normalizeDataSource(record.data_source),
    possession_time: normalizeNullableText(record.possession_time),
    description: normalizeNullableText(record.description),
    confidence: {},
  };

  return normalized;
}

export function hasUsableContact(record: CrmRecord): boolean {
  return Boolean(record.email || record.mobile_without_country_code);
}

export function normalizeNullableText(
  value: string | null,
  options: NormalizeCrmRecordOptions = {}
): string | null {
  if (!value) return null;

  const maxLength = options.maxNoteLength ?? DEFAULT_MAX_NOTE_LENGTH;
  const normalized = value.replace(/\r?\n/g, '\\n').replace(/\s+/g, ' ').trim();
  if (normalized.length === 0) return null;

  if (normalized.length > maxLength) {
    return normalized.slice(0, maxLength).trim();
  }

  return normalized.length > 0 ? normalized : null;
}

function normalizeEmail(value: string | null): string | null {
  const normalized = normalizeNullableText(value)?.toLowerCase() ?? null;
  if (!normalized) return null;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

function normalizeDateString(value: string | null): string | null {
  const normalized = normalizeNullableText(value);
  if (!normalized) return null;

  const isoDateMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    return toIsoDate(Number(isoDateMatch[1]), Number(isoDateMatch[2]), Number(isoDateMatch[3]));
  }

  const slashDateMatch = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashDateMatch) {
    return toIsoDate(Number(slashDateMatch[3]), Number(slashDateMatch[2]), Number(slashDateMatch[1]));
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizePhone(
  countryCode: string | null,
  mobileWithoutCountryCode: string | null,
  defaultPhoneRegion = DEFAULT_PHONE_REGION
): {
  countryCode: string | null;
  mobileWithoutCountryCode: string | null;
  unparsedPhone: string | null;
} {
  const rawCountryCode = normalizeNullableText(countryCode);
  const rawMobile = normalizeNullableText(mobileWithoutCountryCode);
  if (!rawCountryCode && !rawMobile) {
    return {
      countryCode: null,
      mobileWithoutCountryCode: null,
      unparsedPhone: null,
    };
  }

  const phoneText = [rawCountryCode, rawMobile].filter(Boolean).join(' ');
  const parsed = parsePhoneNumberFromString(phoneText, defaultPhoneRegion as CountryCode);

  if (parsed?.isValid()) {
    return {
      countryCode: `+${parsed.countryCallingCode}`,
      mobileWithoutCountryCode: parsed.nationalNumber,
      unparsedPhone: null,
    };
  }

  return {
    countryCode: null,
    mobileWithoutCountryCode: null,
    unparsedPhone: phoneText || null,
  };
}

function normalizeCrmStatus(value: string | null): CrmStatus | null {
  const normalized = normalizeEnumCandidate(value);
  if (!normalized) return null;

  if (isCrmStatus(normalized)) {
    return normalized;
  }

  return CRM_STATUS_ALIASES.get(normalized) ?? null;
}

function normalizeDataSource(value: string | null): DataSource | null {
  const normalized = normalizeEnumCandidate(value);
  if (!normalized) return null;

  if (isDataSource(normalized)) {
    return normalized;
  }

  return DATA_SOURCE_ALIASES.get(normalized) ?? null;
}

function normalizeEnumCandidate(value: string | null): string | null {
  const normalized = normalizeNullableText(value)?.toLowerCase().replace(/[-]+/g, ' ') ?? null;
  if (!normalized) return null;

  return normalized.replace(/\s+/g, ' ');
}

function toIsoDate(year: number, month: number, day: number): string | null {
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;

  return isValid ? parsed.toISOString().slice(0, 10) : null;
}
