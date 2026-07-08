"use client";

import { LoaderCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ImportEvent, ImportStatus } from "@/lib/imports/contracts";
import { getProcessingHeadline } from "@/lib/imports/format";

interface ProcessingProgressProps {
  status: ImportStatus | null;
  events: ImportEvent[];
  isConfirming: boolean;
}

export function ProcessingProgress({
  status,
  events,
  isConfirming,
}: ProcessingProgressProps) {
  const percent = status?.progress.percent ?? (isConfirming ? 10 : 0);
  const headline = getProcessingHeadline(status?.status ?? null, events);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LoaderCircle className="h-5 w-5 animate-spin text-[#0D652D]" />
          Live import progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{headline}</h3>
          <p className="text-sm text-muted-foreground">
            The dashboard is polling the backend for batch progress and visible
            import events.
          </p>
        </div>

        <Progress value={percent} className="h-2" />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusMetric label="Progress" value={`${Math.round(percent)}%`} />
          <StatusMetric
            label="Processed Rows"
            value={`${status?.progress.processedRows ?? 0} / ${status?.progress.totalRows ?? 0}`}
          />
          <StatusMetric
            label="Completed Batches"
            value={`${status?.progress.completedBatches ?? 0} / ${status?.progress.totalBatches ?? 0}`}
          />
          <StatusMetric
            label="Failed Batches"
            value={status?.progress.failedBatches ?? 0}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
