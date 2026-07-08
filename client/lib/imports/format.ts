import type { ImportEvent, ImportStatusValue } from "@/lib/imports/contracts";

export function formatCellValue(value: string | null | undefined) {
  if (!value || value.trim().length === 0) {
    return "—";
  }

  return value;
}

export function formatStatusLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getImportStatusTone(status: string) {
  switch (status) {
    case "COMPLETED":
    case "SALE_DONE":
    case "GOOD_LEAD_FOLLOW_UP":
    case "CANDIDATE":
      return "success";
    case "FAILED":
    case "BAD_LEAD":
    case "SKIPPED":
      return "danger";
    case "PROCESSING":
    case "PARSED":
      return "warning";
    default:
      return "neutral";
  }
}

export function getProcessingHeadline(status: ImportStatusValue | null, events: ImportEvent[]) {
  const latestVisibleEvent = [...events]
    .reverse()
    .find((event) => event.visibleToUser && event.message.trim().length > 0);

  if (latestVisibleEvent) {
    return latestVisibleEvent.message;
  }

  switch (status) {
    case "PROCESSING":
      return "Processing import batches";
    case "COMPLETED":
      return "Import completed";
    case "FAILED":
      return "Import failed";
    case "CANCELLED":
      return "Import cancelled";
    case "PARSED":
      return "Preview ready for confirmation";
    default:
      return "Waiting for import activity";
  }
}
