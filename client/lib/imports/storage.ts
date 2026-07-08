import {
  isImportPreview,
  type ImportPreview,
} from "@/lib/imports/contracts";

const PREVIEW_STORAGE_PREFIX = "groweasy:import-preview";

export function readCachedPreview(importId: string): ImportPreview | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(getPreviewStorageKey(importId));
  if (!rawValue) {
    return null;
  }

  try {
    const parsedJson = JSON.parse(rawValue);
    return isImportPreview(parsedJson) ? parsedJson : null;
  } catch {
    return null;
  }
}

export function writeCachedPreview(preview: ImportPreview) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    getPreviewStorageKey(preview.importId),
    JSON.stringify(preview)
  );
}

export function clearCachedPreview(importId: string | null | undefined) {
  if (!importId || typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(getPreviewStorageKey(importId));
}

function getPreviewStorageKey(importId: string) {
  return `${PREVIEW_STORAGE_PREFIX}:${importId}`;
}
