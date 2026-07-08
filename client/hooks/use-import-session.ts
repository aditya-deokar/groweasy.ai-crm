"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { toast } from "sonner"
import { ApiClientError } from "@/lib/api-client"
import {
  cancelImport,
  confirmImport,
  getImportResult,
  getImportStatus,
  previewImport,
  retryFailedImport,
  updateImportedRecord,
  reimportSkippedRecord,
} from "@/lib/imports/api"
import type {
  ImportEvent,
  ImportPreview,
  ImportStatus,
  GrowEasyCrmRecord,
  ImportBatch,
} from "@/lib/imports/contracts"
import { importQueryKeys } from "@/lib/imports/query-keys"
import {
  clearCachedPreview,
  readCachedPreview,
  writeCachedPreview,
} from "@/lib/imports/storage"
import {
  downloadImportedRecordsCsv,
  downloadSampleCsvTemplate,
  downloadSkippedRecordsCsv,
} from "@/lib/imports/export"
import { useCsvParser, type LocalCsvPreview } from "@/hooks/use-csv-parser"

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED", "CANCELLED"])
const GENERIC_IMPORT_BATCH_FAILURE = "One or more import batches failed."

export type ImportSessionStep =
  | "idle"
  | "local-preview"
  | "preview"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"

export function useImportSession() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const importId = searchParams.get("importId")

  const csvParser = useCsvParser()

  const previewMutation = useMutation({
    mutationFn: previewImport,
    onSuccess: (preview) => {
      writeCachedPreview(preview)
      setImportIdInUrl(preview.importId)
      csvParser.clearLocalPreview()
      toast.success("CSV validated and ready for import.")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to preview CSV file."))
    },
  })

  const statusQuery = useQuery({
    queryKey: importId
      ? importQueryKeys.status(importId)
      : [...importQueryKeys.all, "status-idle"],
    queryFn: () => getImportStatus(importId as string),
    enabled: Boolean(importId),
    refetchInterval: (query) =>
      query.state.data?.status === "PROCESSING" ? 2_000 : false,
  })

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
      lastPage.pageInfo.hasMore
        ? (lastPage.pageInfo.nextCursor ?? undefined)
        : undefined,
    enabled: Boolean(
      importId &&
      statusQuery.data &&
      TERMINAL_STATUSES.has(statusQuery.data.status)
    ),
  })

  const confirmMutation = useMutation({
    mutationFn: (targetImportId: string) => confirmImport(targetImportId),
    onSuccess: (status) => {
      queryClient.setQueryData(importQueryKeys.status(status.importId), status)
      queryClient.invalidateQueries({
        queryKey: importQueryKeys.detail(status.importId),
      })
      toast.success(
        status.status === "COMPLETED"
          ? "Import completed."
          : "Import processing started."
      )
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to confirm import."))
    },
  })

  const retryMutation = useMutation({
    mutationFn: (targetImportId: string) => retryFailedImport(targetImportId),
    onSuccess: (status) => {
      queryClient.setQueryData(importQueryKeys.status(status.importId), status)
      queryClient.invalidateQueries({
        queryKey: importQueryKeys.detail(status.importId),
      })
      toast.success("Retry started for failed batches.")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to retry failed batches."))
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (targetImportId: string) => cancelImport(targetImportId),
    onSuccess: (status) => {
      queryClient.setQueryData(importQueryKeys.status(status.importId), status)
      queryClient.invalidateQueries({
        queryKey: importQueryKeys.detail(status.importId),
      })
      toast.success("Import cancelled.")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to cancel import."))
    },
  })

  const updateRecordMutation = useMutation({
    mutationFn: ({
      targetImportId,
      rowIndex,
      record,
    }: {
      targetImportId: string
      rowIndex: number
      record: Partial<GrowEasyCrmRecord>
    }) => updateImportedRecord(targetImportId, rowIndex, record),
    onSuccess: (_, { targetImportId }) => {
      queryClient.invalidateQueries({
        queryKey: importQueryKeys.result(targetImportId, true),
      })
      toast.success("Record updated successfully.")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update record."))
    },
  })

  const reimportSkippedMutation = useMutation({
    mutationFn: ({
      targetImportId,
      rowIndex,
      newRawData,
    }: {
      targetImportId: string
      rowIndex: number
      newRawData: Record<string, string>
    }) => reimportSkippedRecord(targetImportId, rowIndex, newRawData),
    onSuccess: (_, { targetImportId }) => {
      queryClient.invalidateQueries({
        queryKey: importQueryKeys.detail(targetImportId),
      })
      toast.success("Record corrected and re-imported successfully.")
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, "Failed to correct and re-import record.")
      )
    },
  })

  const cachedPreview = useMemo(
    () => (importId ? readCachedPreview(importId) : null),
    [importId]
  )
  const preview = previewMutation.data ?? cachedPreview
  const status = statusQuery.data ?? deriveStatusFromPreview(preview)
  const resultPages = useMemo(
    () => resultQuery.data?.pages ?? [],
    [resultQuery.data?.pages]
  )
  const firstResultPage = resultPages[0] ?? null

  const records = useMemo(
    () => resultPages.flatMap((page) => page.records),
    [resultPages]
  )
  const skippedRecords = useMemo(
    () => resultPages.flatMap((page) => page.skippedRecords),
    [resultPages]
  )
  const batches = useMemo(
    () => firstResultPage?.batches ?? [],
    [firstResultPage?.batches]
  )
  const events = mergeEvents(
    status?.recentEvents ?? [],
    firstResultPage?.events ?? []
  )
  const previewUnavailable = Boolean(
    importId && status?.status === "PARSED" && !preview
  )
  const importFailureMessage = useMemo(
    () => getImportFailureMessage(status?.error ?? null, batches),
    [status?.error, batches]
  )

  const step = deriveSessionStep(
    status?.status ?? null,
    preview,
    csvParser.localPreview
  )

  function handleFileUpload(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Only CSV files are supported.")
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("The selected file is larger than 5 MB.")
      return
    }

    csvParser.parseCsvFile(file)
  }

  // No more auto-upload! The user must explicitly click "Upload & Validate"
  function handleUploadToServer() {
    if (!csvParser.localPreview) {
      toast.error("No CSV file parsed locally. Please upload a file first.")
      return
    }

    previewMutation.mutate(csvParser.localPreview.file)
  }

  function handleConfirmImport() {
    if (!importId) {
      toast.error("Upload a CSV file before confirming the import.")
      return
    }

    confirmMutation.mutate(importId)
  }

  function handleRetryFailed() {
    if (!importId) {
      return
    }

    retryMutation.mutate(importId)
  }

  function handleCancelImport() {
    if (!importId) {
      return
    }

    cancelMutation.mutate(importId)
  }

  function handleResetImport() {
    if (importId) {
      clearCachedPreview(importId)
      queryClient.removeQueries({ queryKey: importQueryKeys.detail(importId) })
    }

    csvParser.clearLocalPreview()
    router.replace(pathname, { scroll: false })
  }

  function handleDownloadImported() {
    downloadImportedRecordsCsv(records)
  }

  function handleDownloadSkipped() {
    downloadSkippedRecordsCsv(skippedRecords)
  }

  function handleUpdateRecord(
    rowIndex: number,
    record: Partial<GrowEasyCrmRecord>
  ) {
    if (!importId) return
    updateRecordMutation.mutate({ targetImportId: importId, rowIndex, record })
  }

  function handleReimportSkipped(
    rowIndex: number,
    newRawData: Record<string, string>
  ) {
    if (!importId) return
    reimportSkippedMutation.mutate({
      targetImportId: importId,
      rowIndex,
      newRawData,
    })
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
    localPreview: csvParser.localPreview,
    isLocalParsing: csvParser.isLocalParsing,
    localParseError: csvParser.localParseError,
    isPreviewLoading: previewMutation.isPending,
    isStatusLoading: statusQuery.isLoading,
    isResultLoading: resultQuery.isLoading,
    isConfirming: confirmMutation.isPending,
    isRetrying: retryMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isUpdatingRecord: updateRecordMutation.isPending,
    isReimportingSkipped: reimportSkippedMutation.isPending,
    isLoadingMore: resultQuery.isFetchingNextPage,
    hasMoreResults: firstResultPage?.pageInfo.hasMore ?? false,
    activeFileName:
      csvParser.localPreview?.fileName ??
      preview?.file.originalName ??
      previewMutation.variables?.name ??
      null,
    activeFileSize: csvParser.localPreview?.fileSize ?? null,
    latestError:
      csvParser.localParseError ??
      importFailureMessage ??
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
    handleUploadToServer,
    handleConfirmImport,
    handleRetryFailed,
    handleCancelImport,
    handleResetImport,
    handleLoadMore: () => resultQuery.fetchNextPage(),
    handleDownloadImported,
    handleDownloadSkipped,
    handleDownloadSample: downloadSampleCsvTemplate,
    handleUpdateRecord,
    handleReimportSkipped,
  }

  function setImportIdInUrl(nextImportId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("importId", nextImportId)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }
}

function deriveStatusFromPreview(
  preview: ImportPreview | null
): ImportStatus | null {
  if (!preview) {
    return null
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
    aiSafety: {
      promptVersion: null,
      provider: null,
      model: null,
      blockedRows: 0,
      warnedRows: 0,
      outputRejectedBatches: 0,
      safetyEvents: 0,
    },
    recentEvents: [],
  }
}

function deriveSessionStep(
  status: string | null,
  preview: ImportPreview | null,
  localPreview: LocalCsvPreview | null
): ImportSessionStep {
  switch (status) {
    case "PROCESSING":
      return "processing"
    case "COMPLETED":
      return "completed"
    case "FAILED":
      return "failed"
    case "CANCELLED":
      return "cancelled"
    case "PARSED":
      return "preview"
    default:
      if (preview) return "preview"
      if (localPreview) return "local-preview"
      return "idle"
  }
}

function mergeEvents(statusEvents: ImportEvent[], resultEvents: ImportEvent[]) {
  const seen = new Set<string>()
  const merged: ImportEvent[] = []

  for (const event of [...statusEvents, ...resultEvents]) {
    const key = `${event.createdAt}:${event.eventType}:${event.message}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    merged.push(event)
  }

  return merged.sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt)
  )
}

function getErrorMessage(error: unknown, fallback: string | null) {
  if (error instanceof ApiClientError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

function getImportFailureMessage(
  statusError: string | null,
  batches: ImportBatch[]
): string | null {
  const normalizedStatusError = normalizeOptionalMessage(statusError)
  const failedBatchErrors = getFailedBatchErrors(batches)

  if (failedBatchErrors.length === 0) {
    return normalizedStatusError
  }

  if (
    !normalizedStatusError ||
    normalizedStatusError === GENERIC_IMPORT_BATCH_FAILURE
  ) {
    return summarizeFailedBatchErrors(failedBatchErrors)
  }

  return normalizedStatusError
}

function getFailedBatchErrors(batches: ImportBatch[]): string[] {
  return Array.from(
    new Set(
      batches
        .filter((batch) => batch.status === "FAILED")
        .map((batch) => normalizeOptionalMessage(batch.errorMessage))
        .filter((message): message is string => Boolean(message))
    )
  )
}

function summarizeFailedBatchErrors(failedBatchErrors: string[]): string {
  if (failedBatchErrors.length === 1) {
    return failedBatchErrors[0]!
  }

  return `${failedBatchErrors.length} import batches failed. First failure: ${failedBatchErrors[0]}`
}

function normalizeOptionalMessage(
  message: string | null | undefined
): string | null {
  const normalizedMessage = message?.trim()
  return normalizedMessage ? normalizedMessage : null
}
