"use client"

import { Suspense, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
  RotateCcw,
  Upload,
} from "lucide-react"
import { PageLayout } from "@/components/layout/page-layout"
import { BatchesTable } from "@/components/import/batches-table"
import { CsvPreviewTable } from "@/components/import/csv-preview-table"
import { DownloadActions } from "@/components/import/download-actions"
import {
  ImportSummary,
  type ImportSummaryCard,
} from "@/components/import/import-summary"
import {
  ImportStepper,
  type ImportStep,
} from "@/components/import/import-stepper"
import { ParsedRecordsTable } from "@/components/import/parsed-records-table"
import { ProcessingProgress } from "@/components/import/processing-progress"
import { SkippedRecordsTable } from "@/components/import/skipped-records-table"
import { UploadZone } from "@/components/import/upload-zone"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useImportSession } from "@/hooks/use-import-session"
import { SourceCard, type LeadSource } from "@/components/import/source-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { formatBytes } from "@/lib/utils/format"

export default function ImportPage() {
  return (
    <PageLayout
      title="CSV Lead Import"
      subtitle="Preview, process, and review AI-normalized CRM records with live backend status."
    >
      <Suspense fallback={<ImportPageFallback />}>
        <ImportPageContent />
      </Suspense>
    </PageLayout>
  )
}

function ImportPageContent() {
  const [activeTab, setActiveTab] = useState("records")
  const session = useImportSession()

  const [dialogSource, setDialogSource] = useState<string | null>(null)
  const isDialogOpen = dialogSource !== null || Boolean(session.importId)

  const [sources] = useState<LeadSource[]>([
    {
      id: "csv",
      name: "Custom CSV Upload",
      description:
        "Upload a CSV file to map and import contacts directly into your CRM database.",
      iconType: "csv",
      connected: false,
    },
    {
      id: "google",
      name: "Google Ads Leads",
      description:
        "Sync search campaign leads automatically from your Google Ads account.",
      iconType: "google",
      connected: false,
    },
    {
      id: "facebook",
      name: "Facebook Lead Ads",
      description:
        "Sync Facebook and Instagram Lead Ads form entries in real time.",
      iconType: "facebook",
      connected: false,
    },
    {
      id: "linkedin",
      name: "LinkedIn Lead Gen",
      description:
        "Pull lead form submissions from LinkedIn campaigns automatically.",
      iconType: "linkedin",
      connected: false,
    },
  ])

  const handleConnect = () => {
    toast.info("This integration is coming soon!")
  }

  const handleUploadCsvClick = (id: string) => {
    setDialogSource(id)
  }

  const handleDialogClose = (open: boolean) => {
    if (open) {
      setDialogSource((currentSource) => currentSource ?? "csv")
      return
    }

    session.handleResetImport()
    setDialogSource(null)
  }

  // Map session steps to stepper steps
  const getStepperStep = (): ImportStep => {
    switch (session.step) {
      case "idle":
      case "local-preview":
        return "upload"
      case "preview":
        return "review"
      case "processing":
        return "processing"
      case "completed":
      case "failed":
      case "cancelled":
        return "results"
      default:
        return "upload"
    }
  }

  const previewCards: ImportSummaryCard[] = session.preview
    ? [
        {
          id: "total",
          label: "Total Rows",
          value: session.preview.summary.totalRows,
        },
        {
          id: "candidate",
          label: "Ready for AI",
          value: session.preview.summary.candidateRowCount,
          tone: "success",
        },
        {
          id: "skipped",
          label: "Will Be Skipped",
          value: session.preview.summary.skippedRowCount,
          tone:
            session.preview.summary.skippedRowCount > 0 ? "danger" : "neutral",
        },
        {
          id: "warnings",
          label: "Warnings",
          value: session.preview.summary.warningCount,
          tone:
            session.preview.summary.warningCount > 0 ? "warning" : "neutral",
        },
      ]
    : []

  const resultCards: ImportSummaryCard[] = session.result
    ? [
        {
          id: "total",
          label: "Total Rows",
          value: session.result.summary.totalRows,
        },
        {
          id: "imported",
          label: "Imported",
          value: session.result.summary.totalImported,
          tone: "success",
        },
        {
          id: "skipped",
          label: "Skipped",
          value: session.result.summary.totalSkipped,
          tone: session.result.summary.totalSkipped > 0 ? "danger" : "neutral",
        },
        {
          id: "accuracy",
          label: "Accuracy",
          value: `${getAccuracy(
            session.result.summary.totalImported,
            session.result.summary.totalRows
          )}%`,
          tone: "warning",
        },
        {
          id: "ai-safety",
          label: "AI Safety",
          value: session.result.aiSafety.safetyEvents,
          tone: session.result.aiSafety.blockedRows > 0 ? "danger" : "neutral",
        },
      ]
    : []
  const failedBatchCount =
    session.result?.summary.failedBatches ??
    session.status?.progress.failedBatches ??
    0

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* ── TOP SECTION ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge className="border-0 bg-[#E6F4EA] text-xs font-medium text-[#0D652D] hover:bg-[#E6F4EA]">
              AI Powered
            </Badge>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Lead Import Sources
            </h2>
            <p className="text-sm text-muted-foreground">
              Upload CSV files to import leads, or connect a campaign source.
            </p>
          </div>
        </div>
      </div>

      {/* ── LEAD SOURCES GRID ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            onConnect={handleConnect}
            onUploadCsv={handleUploadCsvClick}
          />
        ))}
      </div>

      {/* ── IMPORT DIALOG ── */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="flex max-h-[88vh] w-[92vw] flex-col gap-0 overflow-y-auto p-0 sm:max-w-4xl">
          {/* Dialog Header with Stepper */}
          <div className="sticky top-0 z-20 space-y-4 border-b bg-background px-6 py-4">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg font-semibold">
                Import Leads via CSV
              </DialogTitle>
              <DialogDescription className="text-sm">
                Upload, validate, and import your leads with AI-powered
                normalization.
              </DialogDescription>
            </DialogHeader>
            <ImportStepper currentStep={getStepperStep()} />
          </div>

          {/* Dialog Body */}
          <div className="flex-1 space-y-5 px-6 py-5">
            {/* ── STEP 1: Upload ── */}
            {session.step === "idle" && (
              <UploadZone
                onUpload={session.handleFileUpload}
                onDownloadSample={session.handleDownloadSample}
                activeFileName={session.activeFileName}
                activeFileSize={session.activeFileSize}
                isUploading={session.isLocalParsing}
              />
            )}

            {/* ── STEP 1b: Local Preview (user can review before uploading to server) ── */}
            {session.step === "local-preview" && session.localPreview && (
              <div className="space-y-5">
                {/* File info bar */}
                <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#0D652D] dark:bg-emerald-950/40 dark:text-emerald-400">
                      <FileSpreadsheet className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {session.localPreview.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(session.localPreview.fileSize)} ·{" "}
                        {session.localPreview.totalRows} rows ·{" "}
                        {session.localPreview.totalColumns} columns
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        session.handleResetImport()
                      }}
                      className="text-xs"
                    >
                      Change File
                    </Button>
                    <Button
                      size="sm"
                      onClick={session.handleUploadToServer}
                      disabled={session.isPreviewLoading}
                      className="gap-1.5 bg-[#0D652D] text-xs text-white hover:bg-[#0A4D22]"
                    >
                      {session.isPreviewLoading ? (
                        <>
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          Upload & Validate
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Local preview table — show first few rows so user knows file is correct */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Preview — first{" "}
                    {Math.min(session.localPreview.rows.length, 10)} of{" "}
                    {session.localPreview.totalRows} rows
                  </h4>
                  <Card className="overflow-hidden border shadow-sm">
                    <div className="max-h-[280px] overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                          <tr>
                            <th className="px-3 py-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                              #
                            </th>
                            {session.localPreview.headers.map((h) => (
                              <th
                                key={h}
                                className="px-3 py-2 text-[11px] font-semibold tracking-wider whitespace-nowrap text-muted-foreground uppercase"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {session.localPreview.rows
                            .slice(0, 10)
                            .map((row, i) => (
                              <tr
                                key={i}
                                className="transition-colors hover:bg-muted/20"
                              >
                                <td className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                                  {i + 1}
                                </td>
                                {session.localPreview!.headers.map((h) => (
                                  <td
                                    key={h}
                                    className="max-w-[200px] truncate px-3 py-1.5 text-xs whitespace-nowrap text-muted-foreground"
                                  >
                                    {row[h] || (
                                      <span className="text-muted-foreground/40">
                                        —
                                      </span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* ── STEP 2: Server Preview (Review & Confirm) ── */}
            {session.step === "preview" && (
              <div className="space-y-5">
                <ImportSummary cards={previewCards} />

                {session.previewUnavailable && (
                  <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/20">
                    <CardContent className="pt-5 text-sm text-amber-800 dark:text-amber-300">
                      Preview rows are unavailable after refresh. You can still
                      confirm the import or reset and re-upload the file.
                    </CardContent>
                  </Card>
                )}

                {session.preview && (
                  <div className="space-y-4">
                    {/* File metadata strip */}
                    <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#0D652D] dark:bg-emerald-950/40 dark:text-emerald-400">
                          <FileSpreadsheet className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {session.preview.file.originalName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(session.preview.file.sizeBytes)} ·{" "}
                            {session.preview.headers.length} columns ·{" "}
                            {session.preview.summary.previewRowCount} rows shown
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={session.handleResetImport}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={session.handleConfirmImport}
                          disabled={
                            session.isConfirming || session.isPreviewLoading
                          }
                          className="gap-1.5 bg-[#0D652D] text-xs text-white hover:bg-[#0A4D22]"
                        >
                          {session.isConfirming ? (
                            <>
                              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                              Starting...
                            </>
                          ) : (
                            "Confirm & Import"
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Preview data table */}
                    <CsvPreviewTable
                      rows={session.preview.previewRows}
                      columns={session.preview.headers}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: Processing ── */}
            {session.step === "processing" && (
              <div className="space-y-5">
                <ProcessingProgress
                  status={session.status}
                  events={session.events}
                  batches={session.batches}
                  isConfirming={session.isConfirming}
                />
              </div>
            )}

            {/* ── STEP 4: Results (completed / failed / cancelled) ── */}
            {(session.step === "completed" ||
              session.step === "failed" ||
              session.step === "cancelled") && (
              <div className="space-y-5">
                {/* Success / Error banner */}
                {session.step === "completed" ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/20">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                        Import completed successfully
                      </h3>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70">
                        {session.result?.summary.totalImported ?? 0} leads
                        imported to your CRM.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50/60 p-4 sm:flex-row sm:items-start sm:justify-between dark:border-rose-800/40 dark:bg-rose-950/20">
                    <div className="flex min-w-0 items-start gap-3">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                          {session.step === "failed"
                            ? "Import failed"
                            : "Import cancelled"}
                        </h3>
                        <p className="text-xs break-words text-rose-700/80 dark:text-rose-400/70">
                          {session.latestError ??
                            "The import did not finish successfully. Review details below."}
                        </p>
                        {session.step === "failed" && failedBatchCount > 0 && (
                          <p className="mt-1 text-[11px] font-medium text-rose-700 dark:text-rose-300">
                            {failedBatchCount}{" "}
                            {failedBatchCount === 1
                              ? "batch needs"
                              : "batches need"}{" "}
                            retry.
                          </p>
                        )}
                      </div>
                    </div>
                    {session.step === "failed" && (
                      <Button
                        size="sm"
                        onClick={session.handleRetryFailed}
                        disabled={session.isRetrying}
                        className="shrink-0 bg-[#0D652D] text-white hover:bg-[#0A4D22]"
                      >
                        {session.isRetrying ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        Retry Batches
                      </Button>
                    )}
                  </div>
                )}

                {session.result && <ImportSummary cards={resultCards} />}

                {session.step === "failed" && session.batches.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Batch Details
                    </h4>
                    <BatchesTable batches={session.batches} />
                  </div>
                )}

                {session.isResultLoading && (
                  <Card>
                    <CardContent className="flex items-center gap-3 py-8 text-muted-foreground">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      <span className="text-sm">
                        Fetching final import results...
                      </span>
                    </CardContent>
                  </Card>
                )}

                {session.result && (
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList variant="line">
                      <TabsTrigger value="records">
                        Imported ({session.records.length})
                      </TabsTrigger>
                      <TabsTrigger value="skipped">
                        Skipped ({session.skippedRecords.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="records" className="space-y-3 pt-3">
                      <ParsedRecordsTable
                        records={session.records}
                        onEditRecord={session.handleUpdateRecord}
                        isUpdatingRecord={session.isUpdatingRecord}
                      />
                    </TabsContent>

                    <TabsContent value="skipped" className="space-y-3 pt-3">
                      <SkippedRecordsTable
                        records={session.skippedRecords}
                        onReimportSkipped={session.handleReimportSkipped}
                        isReimportingSkipped={session.isReimportingSkipped}
                      />
                    </TabsContent>
                  </Tabs>
                )}

                {session.hasMoreResults && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={session.handleLoadMore}
                      disabled={session.isLoadingMore}
                    >
                      {session.isLoadingMore
                        ? "Loading..."
                        : "Load More Results"}
                    </Button>
                  </div>
                )}

                {/* Download & navigation actions */}
                {session.step === "completed" ? (
                  <DownloadActions
                    canDownloadImported={session.records.length > 0}
                    canDownloadSkipped={session.skippedRecords.length > 0}
                    onDownloadImported={session.handleDownloadImported}
                    onDownloadSkipped={session.handleDownloadSkipped}
                    onReset={session.handleResetImport}
                  />
                ) : (
                  <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={session.handleResetImport}
                    >
                      Import Another File
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── DIALOG FOOTER (processing / early-fail only) ── */}
          {session.step === "processing" && (
            <div className="sticky bottom-0 z-20 flex justify-end border-t bg-background px-6 py-3">
              <Button
                variant="destructive"
                size="sm"
                onClick={session.handleCancelImport}
                disabled={session.isCancelling}
              >
                Cancel Import
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ImportPageFallback() {
  return (
    <div className="mx-auto max-w-7xl">
      <Card className="mx-auto mt-12 max-w-2xl">
        <CardContent className="flex items-center gap-3 py-12 text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Preparing import dashboard...
        </CardContent>
      </Card>
    </div>
  )
}

function getAccuracy(imported: number, totalRows: number) {
  if (totalRows === 0) return 0
  return Math.round((imported / totalRows) * 100)
}
