"use client";

import { Suspense, useState } from "react";
import {
  AlertTriangle,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
} from "lucide-react";
import { BatchesTable } from "@/components/import/batches-table";
import { CsvPreviewTable } from "@/components/import/csv-preview-table";
import { DownloadActions } from "@/components/import/download-actions";
import { ImportActivity } from "@/components/import/import-activity";
import {
  ImportSummary,
  type ImportSummaryCard,
} from "@/components/import/import-summary";
import { LocalCsvPreviewTable } from "@/components/import/local-csv-preview-table";
import { ParsedRecordsTable } from "@/components/import/parsed-records-table";
import { ProcessingProgress } from "@/components/import/processing-progress";
import { SkippedRecordsTable } from "@/components/import/skipped-records-table";
import { UploadZone } from "@/components/import/upload-zone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImportSession } from "@/hooks/use-import-session";

export default function ImportPage() {
  return (
    <Suspense fallback={<ImportPageFallback />}>
      <ImportPageContent />
    </Suspense>
  );
}

function ImportPageContent() {
  const [activeTab, setActiveTab] = useState("records");
  const session = useImportSession();

  const localPreviewCards: ImportSummaryCard[] = session.localPreview
    ? [
        { id: "file", label: "File Name", value: session.localPreview.fileName },
        { id: "total", label: "Total Rows", value: session.localPreview.totalRows },
        {
          id: "columns",
          label: "Total Columns",
          value: session.localPreview.totalColumns,
        },
        {
          id: "ready",
          label: "Ready to Import",
          value: "✓",
          tone: "success",
        },
      ]
    : [];

  const previewCards: ImportSummaryCard[] = session.preview
    ? [
        { id: "total", label: "Total Rows", value: session.preview.summary.totalRows },
        {
          id: "candidate",
          label: "Ready for AI",
          value: session.preview.summary.candidateRowCount,
          tone: "success",
        },
        {
          id: "skipped",
          label: "Skipped in Preview",
          value: session.preview.summary.skippedRowCount,
          tone: "danger",
        },
        {
          id: "warnings",
          label: "Warnings",
          value: session.preview.summary.warningCount,
          tone: "warning",
        },
      ]
    : [];

  const progressCards: ImportSummaryCard[] = session.status
    ? [
        { id: "total", label: "Total Rows", value: session.status.progress.totalRows },
        {
          id: "processed",
          label: "Processed Rows",
          value: session.status.progress.processedRows,
          tone: "warning",
        },
        {
          id: "completed",
          label: "Completed Batches",
          value: session.status.progress.completedBatches,
          tone: "success",
        },
        {
          id: "failed",
          label: "Failed Batches",
          value: session.status.progress.failedBatches,
          tone: session.status.progress.failedBatches > 0 ? "danger" : "neutral",
        },
      ]
    : [];

  const resultCards: ImportSummaryCard[] = session.result
    ? [
        { id: "total", label: "Total Rows", value: session.result.summary.totalRows },
        {
          id: "imported",
          label: "Imported Records",
          value: session.result.summary.totalImported,
          tone: "success",
        },
        {
          id: "skipped",
          label: "Skipped Records",
          value: session.result.summary.totalSkipped,
          tone: "danger",
        },
        {
          id: "accuracy",
          label: "Import Accuracy",
          value: `${getAccuracy(
            session.result.summary.totalImported,
            session.result.summary.totalRows
          )}%`,
          tone: "warning",
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#E6F4EA] text-[#0D652D] hover:bg-[#E6F4EA]">
              AI Powered
            </Badge>
            {session.importId ? (
              <Badge variant="outline">Import {session.importId.slice(0, 8)}</Badge>
            ) : null}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              AI CSV Importer for GrowEasy CRM
            </h2>
            <p className="text-sm text-muted-foreground">
              Preview server-validated rows, confirm AI batching, and review real CRM
              output with live status updates.
            </p>
          </div>
        </div>

        {session.step !== "idle" ? (
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={session.handleResetImport}>
              Reset Session
            </Button>
            {session.step === "local-preview" ? (
              <Button
                onClick={session.handleUploadToServer}
                disabled={session.isPreviewLoading || session.isLocalParsing}
                className="bg-[#0D652D] text-white hover:bg-[#0A4D22]"
              >
                {session.isPreviewLoading ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload &amp; Validate
                  </>
                )}
              </Button>
            ) : null}
            {session.step === "preview" ? (
              <Button
                onClick={session.handleConfirmImport}
                disabled={session.isConfirming || session.isPreviewLoading}
                className="bg-[#0D652D] text-white hover:bg-[#0A4D22]"
              >
                {session.isConfirming ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Confirming
                  </>
                ) : (
                  "Confirm Import"
                )}
              </Button>
            ) : null}
            {session.step === "processing" ? (
              <Button
                variant="destructive"
                onClick={session.handleCancelImport}
                disabled={session.isCancelling}
              >
                Cancel Import
              </Button>
            ) : null}
            {session.step === "failed" ? (
              <Button
                onClick={session.handleRetryFailed}
                disabled={session.isRetrying}
                className="bg-[#0D652D] text-white hover:bg-[#0A4D22]"
              >
                Retry Failed Batches
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ── IDLE: Upload Zone ── */}
      {session.step === "idle" ? (
        <Card className="mx-auto mt-12 max-w-2xl">
          <CardContent className="pt-6">
            <UploadZone
              onUpload={session.handleFileUpload}
              onDownloadSample={session.handleDownloadSample}
              activeFileName={session.activeFileName}
              activeFileSize={session.activeFileSize}
              isUploading={session.isLocalParsing}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* ── LOCAL PREVIEW: Client-side CSV parsed data ── */}
      {session.step === "local-preview" && session.localPreview ? (
        <div className="space-y-6">
          <ImportSummary cards={localPreviewCards} />

          {session.localParseError ? (
            <Card className="border-red-200 bg-red-50/80">
              <CardContent className="pt-6 text-sm text-red-900">
                {session.localParseError}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#0D652D]" />
                Local CSV preview for {session.localPreview.fileName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                This is a client-side preview of your raw CSV data. Click{" "}
                <strong>Upload &amp; Validate</strong> to send it to the server for
                AI-powered processing.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="text-xs uppercase tracking-wide">File Size</div>
                  <div className="mt-2 font-medium text-foreground">
                    {formatBytes(session.localPreview.fileSize)}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="text-xs uppercase tracking-wide">Preview Rows</div>
                  <div className="mt-2 font-medium text-foreground">
                    {Math.min(session.localPreview.rows.length, 200)} of{" "}
                    {session.localPreview.totalRows}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="text-xs uppercase tracking-wide">Columns</div>
                  <div className="mt-2 font-medium text-foreground">
                    {session.localPreview.totalColumns}
                  </div>
                </div>
              </div>

              <LocalCsvPreviewTable
                rows={session.localPreview.rows}
                headers={session.localPreview.headers}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* ── SERVER PREVIEW: Backend-validated preview ── */}
      {session.step === "preview" ? (
        <div className="space-y-6">
          <ImportSummary cards={previewCards} />

          {session.previewUnavailable ? (
            <Card className="border-amber-200 bg-amber-50/80">
              <CardContent className="pt-6 text-sm text-amber-900">
                Preview rows are unavailable after refresh because the backend does
                not expose a preview read endpoint yet. You can still confirm the
                import or reset and upload the file again to inspect the preview
                grid.
              </CardContent>
            </Card>
          ) : null}

          {session.preview ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-[#0D652D]" />
                  Server preview for {session.preview.file.originalName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="text-xs uppercase tracking-wide">File Size</div>
                    <div className="mt-2 font-medium text-foreground">
                      {formatBytes(session.preview.file.sizeBytes)}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="text-xs uppercase tracking-wide">Preview Rows</div>
                    <div className="mt-2 font-medium text-foreground">
                      {session.preview.summary.previewRowCount}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="text-xs uppercase tracking-wide">Headers</div>
                    <div className="mt-2 font-medium text-foreground">
                      {session.preview.headers.length}
                    </div>
                  </div>
                </div>

                <CsvPreviewTable
                  rows={session.preview.previewRows}
                  columns={session.preview.headers}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* ── PROCESSING: Live import progress ── */}
      {session.step === "processing" ? (
        <div className="space-y-6">
          <ImportSummary cards={progressCards} />
          <ProcessingProgress
            status={session.status}
            events={session.events}
            isConfirming={session.isConfirming}
          />
          <ImportActivity events={session.events} />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Batch progress</h3>
            <BatchesTable batches={session.batches} />
          </div>
        </div>
      ) : null}

      {/* ── COMPLETED / FAILED / CANCELLED: Results ── */}
      {session.step === "completed" ||
      session.step === "failed" ||
      session.step === "cancelled" ? (
        <div className="space-y-8">
          {session.step !== "completed" ? (
            <Card className="border-red-200 bg-red-50/80 dark:border-red-900/50 dark:bg-red-950/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-300">
                      {session.step === "failed" ? "Import failed" : "Import cancelled"}
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300/80">
                      {session.latestError ??
                        "The import did not finish successfully. Review the activity and batch details below."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {session.result ? <ImportSummary cards={resultCards} /> : null}

          {session.isResultLoading ? (
            <Card>
              <CardContent className="flex items-center gap-3 py-10 text-muted-foreground">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Fetching final import results from the backend.
              </CardContent>
            </Card>
          ) : null}

          {session.result ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList variant="line">
                <TabsTrigger value="records">Imported Records</TabsTrigger>
                <TabsTrigger value="skipped">Skipped Records</TabsTrigger>
              </TabsList>

              <TabsContent value="records" className="space-y-4">
                <ParsedRecordsTable 
                  records={session.records} 
                  onEditRecord={session.handleUpdateRecord}
                  isUpdatingRecord={session.isUpdatingRecord}
                />
              </TabsContent>

              <TabsContent value="skipped" className="space-y-4">
                <SkippedRecordsTable 
                  records={session.skippedRecords} 
                  onReimportSkipped={session.handleReimportSkipped}
                  isReimportingSkipped={session.isReimportingSkipped}
                />
              </TabsContent>
            </Tabs>
          ) : null}

          {session.hasMoreResults ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={session.handleLoadMore}
                disabled={session.isLoadingMore}
              >
                {session.isLoadingMore ? "Loading more..." : "Load More Results"}
              </Button>
            </div>
          ) : null}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Import activity</h3>
            <ImportActivity events={session.events} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Batch summary</h3>
            <BatchesTable batches={session.batches} />
          </div>

          {session.step === "completed" ? (
            <DownloadActions
              canDownloadImported={session.records.length > 0}
              canDownloadSkipped={session.skippedRecords.length > 0}
              onDownloadImported={session.handleDownloadImported}
              onDownloadSkipped={session.handleDownloadSkipped}
              onReset={session.handleResetImport}
            />
          ) : (
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="outline" onClick={session.handleResetImport}>
                Import Another File
              </Button>
              {session.step === "failed" ? (
                <Button
                  onClick={session.handleRetryFailed}
                  disabled={session.isRetrying}
                  className="bg-[#0D652D] text-white hover:bg-[#0A4D22]"
                >
                  Retry Failed Batches
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ImportPageFallback() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Card className="mx-auto mt-12 max-w-2xl">
        <CardContent className="flex items-center gap-3 py-12 text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Preparing import dashboard...
        </CardContent>
      </Card>
    </div>
  );
}

function getAccuracy(imported: number, totalRows: number) {
  if (totalRows === 0) {
    return 0;
  }

  return Math.round((imported / totalRows) * 100);
}

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
