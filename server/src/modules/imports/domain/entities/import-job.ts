import type { ImportStatus } from '../constants/import-status.js';
import type { ImportPreviewRow } from './import-row.js';

export interface ImportFileMetadata {
  originalName: string;
  sizeBytes: number;
  sha256: string;
}

export interface ImportJob {
  id: string;
  status: ImportStatus;
  file: ImportFileMetadata;
  headers: string[];
  totalRows: number;
  emptyRowCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportPreview {
  importId: string;
  status: ImportStatus;
  file: ImportFileMetadata;
  headers: string[];
  previewRows: ImportPreviewRow[];
  summary: {
    totalRows: number;
    previewRowCount: number;
    candidateRowCount: number;
    skippedRowCount: number;
    emptyRowCount: number;
    duplicateRowCount: number;
    noContactRowCount: number;
    warningCount: number;
  };
}
