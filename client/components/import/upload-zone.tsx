"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, LoaderCircle, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onUpload: (file: File) => void;
  onDownloadSample: () => void;
  activeFileName?: string | null;
  isUploading?: boolean;
  disabled?: boolean;
}

export function UploadZone({
  onUpload,
  onDownloadSample,
  activeFileName,
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    disabled,
  });

  return (
    <div className="flex flex-col items-center space-y-6 p-8">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-foreground">Import Leads via CSV</h2>
        <p className="text-sm text-muted-foreground">
          Upload a CSV file to preview, validate, and import live CRM-ready leads.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`w-full max-w-xl rounded-xl border-2 border-dashed p-10 transition-colors ${
          disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
        } ${
          isDragActive
            ? "border-green-600 bg-green-50 dark:bg-green-900/10"
            : "border-border hover:border-green-600 hover:bg-muted/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-card shadow-sm">
            {isUploading ? (
              <LoaderCircle className="h-8 w-8 animate-spin text-green-600 dark:text-green-500" />
            ) : activeFileName ? (
              <FileText className="h-8 w-8 text-green-600 dark:text-green-500" />
            ) : (
              <UploadCloud className="h-8 w-8 text-green-600 dark:text-green-500" />
            )}
          </div>

          <div className="text-center">
            {isUploading ? (
              <>
                <p className="text-lg font-bold text-foreground">
                  Uploading and validating your CSV
                </p>
                <p className="text-muted-foreground">{activeFileName ?? "Please wait..."}</p>
              </>
            ) : activeFileName ? (
              <>
                <p className="font-semibold text-foreground">{activeFileName}</p>
                <p className="text-muted-foreground">Preview fetched from the backend.</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-foreground">Drop your CSV file here</p>
                <p className="text-muted-foreground">or click to browse files</p>
              </>
            )}
          </div>

          <div className="inline-flex items-center space-x-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span>i</span>
            <span>Supported file: .csv (max 5MB)</span>
          </div>
        </div>
      </div>

      <div className="max-w-xl text-center text-xs text-muted-foreground/70">
        Required headers: created_at, name, email, country_code,
        mobile_without_country_code, company, city, state, country, lead_owner,
        crm_status, crm_note. The backend will validate, batch, and normalize the
        records after you confirm the import.
      </div>

      <Button
        variant="outline"
        onClick={onDownloadSample}
        className="border-green-700 text-green-700 hover:bg-green-50 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-950"
      >
        <FileText className="mr-2 h-4 w-4" />
        Download Sample CSV Template
      </Button>
    </div>
  );
}
