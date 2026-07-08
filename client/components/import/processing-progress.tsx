"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, LoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BatchesTable } from "./batches-table";
import { ImportActivity } from "./import-activity";
import type { ImportEvent, ImportStatus, ImportBatch } from "@/lib/imports/contracts";

interface ProcessingProgressProps {
  status: ImportStatus | null;
  events: ImportEvent[];
  batches?: ImportBatch[];
  isConfirming: boolean;
}

export function ProcessingProgress({
  status,
  events,
  batches = [],
  isConfirming,
}: ProcessingProgressProps) {
  const [showDetails, setShowDetails] = useState(false);
  const percent = status?.progress.percent ?? (isConfirming ? 5 : 0);
  const processedRows = status?.progress.processedRows ?? 0;
  const totalRows = status?.progress.totalRows ?? 0;

  const headline = getHumanHeadline(percent, processedRows, totalRows);

  return (
    <div className="space-y-4">
      <Card className="border-[#0D652D]/20 bg-emerald-50/30 dark:bg-emerald-950/10 dark:border-emerald-800/30">
        <CardContent className="pt-6 space-y-5">
          {/* Status header */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0D652D] text-white">
              <LoaderCircle className="h-5 w-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{headline}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalRows > 0
                  ? `${processedRows} of ${totalRows} leads processed`
                  : "Preparing your import..."}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={percent} className="h-2.5 bg-emerald-100 dark:bg-emerald-900/30 [&>[data-slot=progress-indicator]]:bg-[#0D652D]" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(percent)}% complete</span>
              <span>
                {status?.progress.completedBatches ?? 0} / {status?.progress.totalBatches ?? 0} batches
              </span>
            </div>
          </div>

          {/* Compact metrics */}
          <div className="grid grid-cols-3 gap-3">
            <MetricPill label="Processed" value={processedRows} />
            <MetricPill label="Completed" value={status?.progress.completedBatches ?? 0} />
            <MetricPill
              label="Failed"
              value={status?.progress.failedBatches ?? 0}
              danger={(status?.progress.failedBatches ?? 0) > 0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Collapsible technical details */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDetails(!showDetails)}
        className="w-full text-muted-foreground hover:text-foreground gap-1.5"
      >
        {showDetails ? (
          <>
            <ChevronUp className="h-3.5 w-3.5" />
            Hide details
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5" />
            Show batch details & activity log
          </>
        )}
      </Button>

      {showDetails && (
        <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
          {batches.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Batch Progress</h4>
              <BatchesTable batches={batches} />
            </div>
          )}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Activity Log</h4>
            <ImportActivity events={events} />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricPill({ label, value, danger = false }: { label: string; value: number | string; danger?: boolean }) {
  return (
    <div className="rounded-lg border bg-background/60 px-3 py-2 text-center">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`text-lg font-bold ${danger ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function getHumanHeadline(percent: number, processed: number, total: number): string {
  if (percent < 10) return "Starting your import...";
  if (percent < 30) return "Processing your leads...";
  if (percent < 60) return "Making great progress...";
  if (percent < 85) return "Almost there...";
  if (percent < 100) return "Finishing up...";
  if (processed === total && total > 0) return "Import complete!";
  return "Processing your leads...";
}
