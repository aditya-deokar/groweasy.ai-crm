"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, LoaderCircle, UploadCloud, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils/format";

interface UploadZoneProps {
  onUpload: (file: File) => void;
  onDownloadSample: () => void;
  activeFileName?: string | null;
  activeFileSize?: number | null;
  isUploading?: boolean;
  disabled?: boolean;
}

export function UploadZone({
  onUpload,
  onDownloadSample,
  activeFileName,
  activeFileSize,
  isUploading = false,
  disabled = false,
}: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0 && !disabled) {
        onUpload(acceptedFiles[0]);
      }
    },
    [disabled, onUpload]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const input = document.getElementById("file-upload-input");
        if (input) {
          input.click();
        }
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    disabled,
  });

  return (
    <div className="flex flex-col items-center space-y-5 py-2">
      <div
        {...getRootProps()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload CSV file by dropping or clicking"
        onKeyDown={onKeyDown}
        className={`w-full rounded-3xl border-2 border-dashed p-10 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D652D] focus-visible:ring-offset-2 ${
          disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
        } ${
          isDragActive
            ? "border-[#0D652D] bg-emerald-500/[0.08] scale-[1.01] dark:bg-emerald-500/[0.12]"
            : "border-border/70 dark:border-white/[0.15] bg-foreground/[0.02] dark:bg-white/[0.03] hover:border-emerald-500/60 hover:bg-emerald-500/[0.03]"
        }`}
      >
        <input {...getInputProps()} id="file-upload-input" />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-3xl transition-all duration-300 shadow-md ${
              isDragActive
                ? "bg-[#0D652D] text-white scale-110"
                : "bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isUploading ? (
              <LoaderCircle className="h-8 w-8 animate-spin" />
            ) : activeFileName ? (
              <FileText className="h-8 w-8" />
            ) : (
              <UploadCloud className="h-8 w-8" />
            )}
          </div>

          <div className="text-center space-y-1.5">
            {isUploading ? (
              <>
                <p className="text-base font-semibold text-foreground">
                  Parsing your CSV...
                </p>
                <p className="text-xs text-muted-foreground">{activeFileName ?? "Please wait"}</p>
              </>
            ) : activeFileName ? (
              <>
                <p className="text-base font-semibold text-foreground">{activeFileName}</p>
                {activeFileSize != null && activeFileSize > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(activeFileSize)} — ready for review
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-foreground">
                  Drop your CSV file here
                </p>
                <p className="text-xs text-muted-foreground">
                  or <span className="text-[#0D652D] font-semibold dark:text-emerald-400">browse from your computer</span>
                </p>
              </>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-foreground/[0.04] dark:bg-white/[0.05] px-3.5 py-1 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            <span>.csv files only · max 5 MB</span>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onDownloadSample}
        className="text-[#0D652D] hover:text-[#0A4D22] hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 gap-1.5 rounded-xl h-9 px-4 text-xs font-medium cursor-pointer"
      >
        <FileText className="h-3.5 w-3.5" />
        Download sample CSV template
      </Button>
    </div>
  );
}
