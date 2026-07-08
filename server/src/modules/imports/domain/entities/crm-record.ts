import type { CrmStatus } from '../constants/crm-status.js';
import type { DataSource } from '../constants/data-source.js';

export interface CrmRecord {
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
  crm_status: CrmStatus | null;
  crm_note: string | null;
  data_source: DataSource | null;
  possession_time: string | null;
  description: string | null;
  confidence: Record<string, number> | null;
}

export interface CrmRecordWithRow {
  rowIndex: number;
  record: CrmRecord;
}

