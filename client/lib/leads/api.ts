import { apiRequest } from "@/lib/api-client";
import type { GrowEasyCrmRecord } from "@/lib/imports/contracts";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface LeadWithId extends GrowEasyCrmRecord {
  id: string;
  importJobId: string;
  importRowId: string;
  rowIndex: number;
  createdAt: string;
}

export interface LeadsListResponse {
  leads: LeadWithId[];
  pagination: PaginationMeta;
}

export const leadsQueryKeys = {
  all: ["leads"] as const,
  list: (filters: Record<string, unknown>) => [...leadsQueryKeys.all, "list", filters] as const,
};

export async function getLeads(input: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  source?: string;
}): Promise<LeadsListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(input.page));
  params.set("limit", String(input.limit));

  if (input.search) {
    params.set("search", input.search);
  }
  if (input.status && input.status !== "ALL") {
    params.set("status", input.status);
  }
  if (input.source && input.source !== "ALL") {
    params.set("source", input.source);
  }

  return apiRequest<LeadsListResponse>(`/leads?${params.toString()}`, {
    method: "GET",
    parse: parseLeadsListResponse,
  });
}

export async function updateLead(leadId: string, record: Partial<GrowEasyCrmRecord>): Promise<LeadWithId> {
  return apiRequest<LeadWithId>(`/leads/${leadId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(record),
    parse: parseLead,
  });
}

export async function deleteLead(leadId: string): Promise<void> {
  return apiRequest<void>(`/leads/${leadId}`, {
    method: "DELETE",
    parse: () => {},
  });
}

function parseLeadsListResponse(value: unknown): LeadsListResponse {
  const record = expectRecord(value, "Leads response");
  const pagination = expectRecord(record.pagination, "Leads pagination");

  return {
    leads: expectArray(record.leads, "Leads list").map(parseLead),
    pagination: {
      total: expectNumber(pagination.total, "pagination.total"),
      page: expectNumber(pagination.page, "pagination.page"),
      limit: expectNumber(pagination.limit, "pagination.limit"),
      pages: expectNumber(pagination.pages, "pagination.pages"),
    },
  };
}

function parseLead(value: unknown): LeadWithId {
  const record = expectRecord(value, "Lead");

  return {
    id: expectString(record.id, "lead.id"),
    importJobId: expectString(record.importJobId, "lead.importJobId"),
    importRowId: expectString(record.importRowId, "lead.importRowId"),
    rowIndex: expectNumber(record.rowIndex, "lead.rowIndex"),
    createdAt: expectString(record.createdAt, "lead.createdAt"),
    created_at: expectNullableString(record.created_at, "lead.created_at"),
    name: expectNullableString(record.name, "lead.name"),
    email: expectNullableString(record.email, "lead.email"),
    country_code: expectNullableString(record.country_code, "lead.country_code"),
    mobile_without_country_code: expectNullableString(
      record.mobile_without_country_code,
      "lead.mobile_without_country_code"
    ),
    company: expectNullableString(record.company, "lead.company"),
    city: expectNullableString(record.city, "lead.city"),
    state: expectNullableString(record.state, "lead.state"),
    country: expectNullableString(record.country, "lead.country"),
    lead_owner: expectNullableString(record.lead_owner, "lead.lead_owner"),
    crm_status: expectNullableString(record.crm_status, "lead.crm_status"),
    crm_note: expectNullableString(record.crm_note, "lead.crm_note"),
    data_source: expectNullableString(record.data_source, "lead.data_source"),
    possession_time: expectNullableString(
      record.possession_time,
      "lead.possession_time"
    ),
    description: expectNullableString(record.description, "lead.description"),
    confidence:
      record.confidence == null
        ? null
        : (expectRecord(record.confidence, "lead.confidence") as Record<
            string,
            number
          >),
  };
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function expectArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value;
}

function expectString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string.`);
  }

  return value;
}

function expectNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${label} must be a number.`);
  }

  return value;
}

function expectNullableString(value: unknown, label: string): string | null {
  if (value == null) {
    return null;
  }

  return expectString(value, label);
}
