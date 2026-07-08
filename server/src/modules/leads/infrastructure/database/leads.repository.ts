import { and, eq, or, ilike, count, desc } from 'drizzle-orm';
import type { Database } from '../../../../db/index.js';
import { crmImportRecords } from '../../../../db/schema.js';
import type { crmStatusEnum, dataSourceEnum } from '../../../../db/schema.js';
import type { CrmRecord } from '../../../imports/domain/entities/crm-record.js';

type CrmStatusType = typeof crmStatusEnum.enumValues[number];
type DataSourceType = typeof dataSourceEnum.enumValues[number];
type DbLeadRow = typeof crmImportRecords.$inferSelect;

export interface ListLeadsInput {
  limit: number;
  offset: number;
  search?: string;
  status?: string;
  source?: string;
}

export interface LeadRecord extends CrmRecord {
  id: string;
  importJobId: string;
  importRowId: string;
  rowIndex: number;
  createdAt: Date;
}

export class LeadsRepository {
  public constructor(private readonly database: Database) {}

  public async listLeads(input: ListLeadsInput): Promise<{ leads: LeadRecord[]; totalCount: number }> {
    const conditions = [];

    if (input.search) {
      const searchPattern = `%${input.search}%`;
      conditions.push(
        or(
          ilike(crmImportRecords.name, searchPattern),
          ilike(crmImportRecords.email, searchPattern),
          ilike(crmImportRecords.mobileWithoutCountryCode, searchPattern),
          ilike(crmImportRecords.company, searchPattern),
          ilike(crmImportRecords.city, searchPattern),
          ilike(crmImportRecords.state, searchPattern),
          ilike(crmImportRecords.country, searchPattern),
          ilike(crmImportRecords.leadOwner, searchPattern),
          ilike(crmImportRecords.crmNote, searchPattern),
          ilike(crmImportRecords.description, searchPattern)
        )
      );
    }

    if (input.status) {
      conditions.push(eq(crmImportRecords.crmStatus, input.status as CrmStatusType));
    }

    if (input.source) {
      conditions.push(eq(crmImportRecords.dataSource, input.source as DataSourceType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalCountResult] = await this.database
      .select({ val: count() })
      .from(crmImportRecords)
      .where(whereClause);

    const totalCount = totalCountResult ? Number(totalCountResult.val) : 0;

    const leads = await this.database
      .select()
      .from(crmImportRecords)
      .where(whereClause)
      .orderBy(desc(crmImportRecords.createdAt))
      .limit(input.limit)
      .offset(input.offset);

    return {
      leads: leads.map(mapDbLeadToApiLead),
      totalCount,
    };
  }

  public async updateLead(
    leadId: string,
    data: Partial<CrmRecord>
  ): Promise<LeadRecord> {
    const updateData = mapApiLeadPatchToDbUpdate(data);

    const [updated] = await this.database
      .update(crmImportRecords)
      .set(updateData)
      .where(eq(crmImportRecords.id, leadId))
      .returning();

    if (!updated) {
      throw new Error(`Lead with ID ${leadId} not found.`);
    }

    return mapDbLeadToApiLead(updated);
  }

  public async deleteLead(leadId: string): Promise<void> {
    const deleted = await this.database
      .delete(crmImportRecords)
      .where(eq(crmImportRecords.id, leadId))
      .returning({ id: crmImportRecords.id });

    if (deleted.length === 0) {
      throw new Error(`Lead with ID ${leadId} not found.`);
    }
  }
}

export function mapDbLeadToApiLead(record: DbLeadRow): LeadRecord {
  return {
    id: record.id,
    importJobId: record.importJobId,
    importRowId: record.importRowId,
    rowIndex: record.rowIndex,
    created_at: record.createdAtValue,
    name: record.name,
    email: record.email,
    country_code: record.countryCode,
    mobile_without_country_code: record.mobileWithoutCountryCode,
    company: record.company,
    city: record.city,
    state: record.state,
    country: record.country,
    lead_owner: record.leadOwner,
    crm_status: record.crmStatus,
    crm_note: record.crmNote,
    data_source: record.dataSource,
    possession_time: record.possessionTime,
    description: record.description,
    confidence: record.confidence,
    createdAt: record.createdAt,
  };
}

export function mapApiLeadPatchToDbUpdate(data: Partial<CrmRecord>): Partial<DbLeadRow> {
  return removeUndefinedValues({
    createdAtValue: normalizeNullableString(data.created_at),
    name: normalizeNullableString(data.name),
    email: normalizeNullableString(data.email),
    countryCode: normalizeNullableString(data.country_code),
    mobileWithoutCountryCode: normalizeNullableString(data.mobile_without_country_code),
    company: normalizeNullableString(data.company),
    city: normalizeNullableString(data.city),
    state: normalizeNullableString(data.state),
    country: normalizeNullableString(data.country),
    leadOwner: normalizeNullableString(data.lead_owner),
    crmStatus: normalizeNullableString(data.crm_status) as CrmStatusType | null | undefined,
    crmNote: normalizeNullableString(data.crm_note),
    dataSource: normalizeNullableString(data.data_source) as DataSourceType | null | undefined,
    possessionTime: normalizeNullableString(data.possession_time),
    description: normalizeNullableString(data.description),
    confidence: data.confidence,
  });
}

function normalizeNullableString(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function removeUndefinedValues<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}
