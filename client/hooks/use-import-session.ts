"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api-client";
import {
  cancelImport,
  confirmImport,
  getImportResult,
  getImportStatus,
  previewImport,
  retryFailedImport,
} from "@/lib/imports/api";
import type {
  ImportEvent,
  ImportPreview,
  ImportStatus,
} from "@/lib/imports/contracts";
import { importQueryKeys } from "@/lib/imports/query-keys";
import {
  clearCachedPreview,
  readCachedPreview,
  writeCachedPreview,
} from "@/lib/imports/storage";
import {
  downloadImportedRecordsCsv,
  downloadSampleCsvTemplate,
  downloadSkippedRecordsCsv,
} from "@/lib/imports/export";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED", "CANCELLED"]);

export type ImportSessionStep =
  | "idle"
  | "preview"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export function useImportSession() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const importId = searchParams.get("importId");
  const [cachedPreview, setCachedPreview] = useState<ImportPreview | null>(null);

  useEffect(() => {
    setCachedPreview(importId ? readCachedPreview(importId) : null);
  }, [importId]);

  const previewMutation = useMutation({
    mutationFn: previewImport,
    onSuccess: (preview) => {
      writeCachedPreview(preview);
      setCachedPreview(preview);
      setImportIdInUrl(preview.importId);
      toast.success("CSV preview is ready.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to preview CSV file."));
    },
  });

  const statusQuery = useQuery({
    queryKey: importId ? importQueryKeys.status(importId) : [...importQueryKeys.all, "status-idle"],
    queryFn: () => getImportStatus(importId as string),
    enabled: Boolean(importId),
    refetchInterval: (query) =>
      query.state.data?.status === "PROCESSING" ? 2_000 : false,
  });

  const resultQuery = useInfiniteQuery({
    queryKey: importId
      ? importQueryKeys.result(importId, true)
      : [...importQueryKeys.all, "result-idle"],
    queryFn: ({ pageParam }) =>
      getImportResult({
        importId: importId as string,
        limit: 100,
        includeSkipped: true,
        cursor: typeof pageParam === "number" ? pageParam : undefined,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasMore ? (lastPage.pageInfo.nextCursor ?? undefined) : undefined,
    enabled: Boolean(importId && statusQuery.data && TERMINAL_STATUSES.has(statusQuery.data.status)),
  });

  const confirmMutation = useMutation({
    mutationFn: (targetImportId: string) => confirmImport(targetImportId),
    onSuccess: (status) => {
      queryClient.setQueryData(importQueryKeys.status(status.importId), status);
      queryClient.invalidateQueries({ queryKey: importQueryKeys.detail(status.importId) });
      toast.success(
        status.status === "COMPLETED" ? "Import completed." : "Import processing started."
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to confirm import."));
    },
  });

  const retryMutation = useMutation({
    mutationFn: (targetImportId: string) => retryFailedImport(targetImportId),
    onSuccess: (status) => {
      queryClient.setQueryData(importQueryKeys.status(status.importId), status);
      queryClient.invalidateQueries({ queryKey: importQueryKeys.detail(status.importId) });
      toast.success("Retry started for failed batches.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to retry failed batches."));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (targetImportId: string) => cancelImport(targetImportId),
    onSuccess: (status) => {
      queryClient.setQueryData(importQueryKeys.status(status.importId), status);
      queryClient.invalidateQueries({ queryKey: importQueryKeys.detail(status.importId) });
      toast.success("Import cancelled.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to cancel import."));
    },
  });

  const preview = previewMutation.data ?? cachedPreview;
  const status = statusQuery.data ?? deriveStatusFromPreview(preview);
  const resultPages = resultQuery.data?.pages ?? [];
  const firstResultPage = resultPages[0] ?? null;

  const records = useMemo(
    () => resultPages.flatMap((page) => page.records),
    [resultPages]
  );
  const skippedRecords = useMemo(
    () => resultPages.flatMap((page) => page.skippedRecords),
    [resultPages]
  );
  const batches = firstResultPage?.batches ?? [];
  const events = mergeEvents(status?.recentEvents ?? [], firstResultPage?.events ?? []);
  const previewUnavailable = Boolean(importId && status?.status === "PARSED" && !preview);

  const step = deriveSessionStep(status?.status ?? null, preview);

  function handleFileUpload(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Only CSV files are supported.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("The selected file is larger than 5 MB.");
      return;
    }

    previewMutation.mutate(file);
  }

  function handleConfirmImport() {
    if (!importId) {
      toast.error("Upload a CSV file before confirming the import.");
      return;
    }

    confirmMutation.mutate(importId);
  }

  function handleRetryFailed() {
    if (!importId) {
      return;
    }

    retryMutation.mutate(importId);
  }

  function handleCancelImport() {
    if (!importId) {
      return;
    }

    cancelMutation.mutate(importId);
  }

  function handleResetImport() {
    if (importId) {
      clearCachedPreview(importId);
      queryClient.removeQueries({ queryKey: importQueryKeys.detail(importId) });
    }

    setCachedPreview(null);
    router.replace(pathname, { scroll: false });
  }

  function handleDownloadImported() {
    downloadImportedRecordsCsv(records);
  }

  function handleDownloadSkipped() {
    downloadSkippedRecordsCsv(skippedRecords);
  }

  return {
    importId,
    step,
    preview,
    previewUnavailable,
    status,
    result: firstResultPage,
    records,
    skippedRecords,
    batches,
    events,
    isPreviewLoading: previewMutation.isPending,
    isStatusLoading: statusQuery.isLoading,
    isResultLoading: resultQuery.isLoading,
    isConfirming: confirmMutation.isPending,
    isRetrying: retryMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isLoadingMore: resultQuery.isFetchingNextPage,
    hasMoreResults: firstResultPage?.pageInfo.hasMore ?? false,
    activeFileName: preview?.file.originalName ?? previewMutation.variables?.name ?? null,
    latestError:
      status?.error ??
      getErrorMessage(
        previewMutation.error ??
          confirmMutation.error ??
          retryMutation.error ??
          cancelMutation.error ??
          statusQuery.error ??
          resultQuery.error,
        null
      ),
    handleFileUpload,
    handleConfirmImport,
    handleRetryFailed,
    handleCancelImport,
    handleResetImport,
    handleLoadMore: () => resultQuery.fetchNextPage(),
    handleDownloadImported,
    handleDownloadSkipped,
    handleDownloadSample: downloadSampleCsvTemplate,
  };

  function setImportIdInUrl(nextImportId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("importId", nextImportId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }
}

function deriveStatusFromPreview(preview: ImportPreview | null): ImportStatus | null {
  if (!preview) {
    return null;
  }

  return {
    importId: preview.importId,
    status: preview.status,
    progress: {
      totalRows: preview.summary.totalRows,
      processedRows: 0,
      totalBatches: 0,
      completedBatches: 0,
      failedBatches: 0,
      percent: 0,
    },
    totals: {
      imported: 0,
      skipped: preview.summary.skippedRowCount,
    },
    error: null,
    recentEvents: [],
  };
}

function deriveSessionStep(status: string | null, preview: ImportPreview | null): ImportSessionStep {
  switch (status) {
    case "PROCESSING":
      return "processing";
    case "COMPLETED":
      return "completed";
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
    case "PARSED":
      return "preview";
    default:
      return preview ? "preview" : "idle";
  }
}

function mergeEvents(statusEvents: ImportEvent[], resultEvents: ImportEvent[]) {
  const seen = new Set<string>();
  const merged: ImportEvent[] = [];

  for (const event of [...statusEvents, ...resultEvents]) {
    const key = `${event.createdAt}:${event.eventType}:${event.message}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(event);
  }

  return merged.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function getErrorMessage(error: unknown, fallback: string | null) {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
