import { apiRequest } from "@/lib/api-client";
import {
  parseImportPreview,
  parseImportResult,
  parseImportStatus,
  parseImportHistory,
  type ImportResult,
  type GrowEasyCrmRecord,
  type ImportHistoryResponse,
} from "@/lib/imports/contracts";

export async function previewImport(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest("/imports/preview", {
    method: "POST",
    body: formData,
    parse: parseImportPreview,
  });
}

export async function confirmImport(importId: string) {
  return apiRequest(`/imports/${importId}/confirm`, {
    method: "POST",
    parse: parseImportStatus,
  });
}

export async function getImportStatus(importId: string) {
  return apiRequest(`/imports/${importId}/status`, {
    method: "GET",
    parse: parseImportStatus,
  });
}

export async function getImportResult(input: {
  importId: string;
  cursor?: number;
  includeSkipped?: boolean;
  limit?: number;
}) {
  const params = new URLSearchParams();
  params.set("limit", String(input.limit ?? 100));
  params.set("includeSkipped", String(input.includeSkipped ?? true));

  if (input.cursor) {
    params.set("cursor", String(input.cursor));
  }

  return apiRequest<ImportResult>(`/imports/${input.importId}/result?${params.toString()}`, {
    method: "GET",
    parse: parseImportResult,
  });
}

export async function retryFailedImport(importId: string) {
  return apiRequest(`/imports/${importId}/retry-failed`, {
    method: "POST",
    parse: parseImportStatus,
  });
}

export async function cancelImport(importId: string) {
  return apiRequest(`/imports/${importId}/cancel`, {
    method: "POST",
    parse: parseImportStatus,
  });
}

export async function updateImportedRecord(importId: string, rowIndex: number, record: Partial<GrowEasyCrmRecord>) {
  return apiRequest(`/imports/${importId}/records/${rowIndex}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(record),
    parse: (data) => data as unknown,
  });
}

export async function reimportSkippedRecord(importId: string, rowIndex: number, newRawData: Record<string, string>) {
  return apiRequest(`/imports/${importId}/skipped/${rowIndex}/reimport`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ newRawData }),
    parse: (data) => data as unknown,
  });
}

export async function getImportHistory(cursor?: number, limit = 20): Promise<ImportHistoryResponse> {
  const params = new URLSearchParams();
  params.set("limit", limit.toString());
  if (cursor !== undefined) {
    params.set("cursor", cursor.toString());
  }
  return apiRequest(`/imports/history?${params.toString()}`, {
    method: "GET",
    parse: parseImportHistory,
  });
}
