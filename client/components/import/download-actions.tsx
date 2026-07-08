"use client";

import { Download, FileWarning, RefreshCcw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between border-t pt-4">
      <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground gap-1.5">
        <RefreshCcw className="h-3.5 w-3.5" />
        Import Another File
      </Button>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadSkipped}
          disabled={!canDownloadSkipped}
          className="gap-1.5"
        >
          <FileWarning className="h-3.5 w-3.5" />
          Download Skipped
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadImported}
          disabled={!canDownloadImported}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Download CRM CSV
        </Button>
        <Link href="/leads">
          <Button size="sm" className="bg-[#0D652D] text-white hover:bg-[#0A4D22] gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            View in CRM
          </Button>
        </Link>
      </div>
    </div>
  );
}
