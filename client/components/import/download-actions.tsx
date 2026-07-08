"use client";

import { Download, FileWarning, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadActionsProps {
  canDownloadImported: boolean;
  canDownloadSkipped: boolean;
  onDownloadImported: () => void;
  onDownloadSkipped: () => void;
  onReset: () => void;
}

export function DownloadActions({
  canDownloadImported,
  canDownloadSkipped,
  onDownloadImported,
  onDownloadSkipped,
  onReset,
}: DownloadActionsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
      <Button variant="outline" onClick={onReset}>
        <RefreshCcw className="mr-2 h-4 w-4" />
        Import Another File
      </Button>
      <Button
        variant="outline"
        onClick={onDownloadSkipped}
        disabled={!canDownloadSkipped}
      >
        <FileWarning className="mr-2 h-4 w-4" />
        Download Skipped CSV
      </Button>
      <Button onClick={onDownloadImported} disabled={!canDownloadImported}>
        <Download className="mr-2 h-4 w-4" />
        Download CRM CSV
      </Button>
    </div>
  );
}
