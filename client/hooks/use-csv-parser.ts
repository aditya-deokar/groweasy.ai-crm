"use client";

import { useCallback, useState } from "react";
import Papa from "papaparse";

export interface LocalCsvPreview {
  fileName: string;
  fileSize: number;
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  totalColumns: number;
  file: File;
}

interface UseCsvParserReturn {
  localPreview: LocalCsvPreview | null;
  isLocalParsing: boolean;
  localParseError: string | null;
  parseCsvFile: (file: File) => void;
  clearLocalPreview: () => void;
}

const MAX_PREVIEW_ROWS = 200;

export function useCsvParser(): UseCsvParserReturn {
  const [localPreview, setLocalPreview] = useState<LocalCsvPreview | null>(null);
  const [isLocalParsing, setIsLocalParsing] = useState(false);
  const [localParseError, setLocalParseError] = useState<string | null>(null);

  const parseCsvFile = useCallback((file: File) => {
    setIsLocalParsing(true);
    setLocalParseError(null);
    setLocalPreview(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete(results) {
        if (results.errors.length > 0 && results.data.length === 0) {
          setLocalParseError(
            `CSV parsing failed: ${results.errors[0]?.message ?? "Unknown error"}`
          );
          setIsLocalParsing(false);
          return;
        }

        const headers = results.meta.fields ?? [];

        if (headers.length === 0) {
          setLocalParseError("CSV file has no column headers.");
          setIsLocalParsing(false);
          return;
        }

        if (results.data.length === 0) {
          setLocalParseError("CSV file has no data rows.");
          setIsLocalParsing(false);
          return;
        }

        const previewRows = results.data.slice(0, MAX_PREVIEW_ROWS);

        setLocalPreview({
          fileName: file.name,
          fileSize: file.size,
          headers,
          rows: previewRows,
          totalRows: results.data.length,
          totalColumns: headers.length,
          file,
        });
        setIsLocalParsing(false);
      },
      error(error) {
        setLocalParseError(`CSV parsing failed: ${error.message}`);
        setIsLocalParsing(false);
      },
    });
  }, []);

  const clearLocalPreview = useCallback(() => {
    setLocalPreview(null);
    setLocalParseError(null);
    setIsLocalParsing(false);
  }, []);

  return {
    localPreview,
    isLocalParsing,
    localParseError,
    parseCsvFile,
    clearLocalPreview,
  };
}
