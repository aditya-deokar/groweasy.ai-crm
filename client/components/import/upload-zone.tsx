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
        className={`w-full rounded-xl border-2 border-dashed p-8 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D652D] focus-visible:ring-offset-2 ${
          disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
        } ${
          isDragActive
            ? "border-[#0D652D] bg-emerald-50/60 scale-[1.01] dark:bg-emerald-900/10"
            : "border-border hover:border-[#0D652D]/50 hover:bg-muted/30"
        }`}
      >
        <input {...getInputProps()} id="file-upload-input" />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-200 ${
              isDragActive
                ? "bg-[#0D652D] text-white shadow-lg scale-110"
                : "bg-emerald-50 text-[#0D652D] dark:bg-emerald-950/40 dark:text-emerald-400"
            }`}
          >
            {isUploading ? (
              <LoaderCircle className="h-7 w-7 animate-spin" />
            ) : activeFileName ? (
              <FileText className="h-7 w-7" />
            ) : (
              <UploadCloud className="h-7 w-7" />
            )}
          </div>

          <div className="text-center space-y-1">
            {isUploading ? (
              <>
                <p className="text-base font-semibold text-foreground">
                  Parsing your CSV...
                </p>
                <p className="text-sm text-muted-foreground">{activeFileName ?? "Please wait"}</p>
              </>
            ) : activeFileName ? (
              <>
                <p className="text-base font-semibold text-foreground">{activeFileName}</p>
                {activeFileSize != null && activeFileSize > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(activeFileSize)} — ready for review
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-foreground">
                  Drop your CSV file here
                </p>
                <p className="text-sm text-muted-foreground">
                  or <span className="text-[#0D652D] font-medium dark:text-emerald-400">click to browse</span>
                </p>
              </>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>.csv files only · max 5 MB</span>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onDownloadSample}
        className="text-[#0D652D] hover:text-[#0A4D22] hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 gap-1.5"
      >
        <FileText className="h-3.5 w-3.5" />
        Download sample template
      </Button>
    </div>
  );
}
