import { apiRequest } from "@/lib/api-client";
import {
  parseImportPreview,
  parseImportResult,
  parseImportStatus,
  type ImportResult,
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
