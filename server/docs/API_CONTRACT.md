# GrowEasy Import API Contract

Base URL:

```text
http://localhost:5000/api/v1
```

All API responses use the standard envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "meta": {
    "requestId": "request-id"
  },
  "timestamp": "2026-07-08T00:00:00.000Z"
}
```

Errors use the same envelope shape:

```json
{
  "success": false,
  "message": "Validation failed.",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  },
  "meta": {
    "requestId": "request-id"
  },
  "timestamp": "2026-07-08T00:00:00.000Z"
}
```

## POST /imports/preview

Uploads and parses a CSV without calling AI.

Request:

```http
POST /api/v1/imports/preview
Content-Type: multipart/form-data
```

Form fields:

```text
file: CSV file
```

Behavior:

- validates file size, extension, MIME type, and empty files
- parses CSV with headers
- pre-validates rows before AI
- stores raw rows and pre-AI skipped rows
- returns preview rows and summary counts

Response data:

```ts
{
  importId: string;
  status: "PARSED";
  file: {
    originalName: string;
    sizeBytes: number;
    sha256: string;
  };
  headers: string[];
  previewRows: Array<{
    rowIndex: number;
    values: Record<string, string>;
    validationStatus: "CANDIDATE" | "SKIPPED";
    skipReason?: "EMPTY_ROW" | "NO_CONTACT" | "DUPLICATE_ROW";
  }>;
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
```

## POST /imports/:importId/confirm

Creates AI batches and starts processing.

Request:

```http
POST /api/v1/imports/{importId}/confirm
```

Behavior:

- creates durable batch records from candidate rows only
- clamps AI batch size to 20-50
- starts in-process LangGraph workflow
- returns current import status immediately
- completes immediately if every row was skipped before AI

Response data:

```ts
ImportStatusResult
```

## GET /imports/:importId/status

Returns import progress.

Request:

```http
GET /api/v1/imports/{importId}/status
```

Response data:

```ts
{
  importId: string;
  status: "UPLOADED" | "PARSED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  progress: {
    totalRows: number;
    processedRows: number;
    totalBatches: number;
    completedBatches: number;
    failedBatches: number;
    percent: number;
  };
  totals: {
    imported: number;
    skipped: number;
  };
  error: string | null;
  recentEvents: Array<{
    eventType: string;
    message: string;
    metadata: Record<string, unknown> | null;
    visibleToUser: boolean;
    createdAt: string;
  }>;
}
```

## GET /imports/:importId/result

Returns imported CRM records, skipped rows, batch summaries, and final counts.

Request:

```http
GET /api/v1/imports/{importId}/result?limit=100&includeSkipped=true
```

Query parameters:

```text
limit: number, 1-500, default 100
cursor: optional rowIndex cursor
includeSkipped: boolean, default true
```

Response data:

```ts
{
  importId: string;
  status: string;
  summary: {
    totalRows: number;
    totalImported: number;
    totalSkipped: number;
    totalBatches: number;
    completedBatches: number;
    failedBatches: number;
    pendingBatches: number;
    processingBatches: number;
    processedRows: number;
    unprocessedRows: number;
  };
  batches: Array<{
    id: string;
    batchIndex: number;
    status: string;
    rowStartIndex: number;
    rowEndIndex: number;
    rowCount: number;
    retryCount: number;
    errorMessage: string | null;
  }>;
  skippedReasonCounts: Record<string, number>;
  events: Array<{
    eventType: string;
    message: string;
    metadata: Record<string, unknown> | null;
    visibleToUser: boolean;
    createdAt: string;
  }>;
  records: Array<{
    rowIndex: number;
    record: GrowEasyCrmRecord;
  }>;
  skippedRecords: Array<{
    rowIndex: number;
    reason: string;
    rawData: Record<string, string>;
  }>;
  pageInfo: {
    nextCursor: number | null;
    hasMore: boolean;
  };
}
```

## POST /imports/:importId/retry-failed

Retries failed AI batches for an import.

Request:

```http
POST /api/v1/imports/{importId}/retry-failed
```

Response data:

```ts
ImportStatusResult
```

## POST /imports/:importId/cancel

Cancels a pending or processing import.

Request:

```http
POST /api/v1/imports/{importId}/cancel
```

Response data:

```ts
ImportStatusResult
```

## Error Codes

Common import errors:

```text
CSV_FILE_REQUIRED
CSV_FILE_EMPTY
CSV_FILE_TOO_LARGE
CSV_UNSUPPORTED_FILE_TYPE
CSV_UPLOAD_REJECTED
CSV_PARSE_FAILED
CSV_TOO_MANY_ROWS
IMPORT_NOT_FOUND
IMPORT_INVALID_STATE
AI_PROVIDER_UNAVAILABLE
AI_INVALID_STRUCTURED_OUTPUT
AI_BATCH_FAILED
VALIDATION_ERROR
INTERNAL_SERVER_ERROR
```

## Batching Contract

The backend never sends the full CSV to AI in one request.

Rules:

- Pre-AI skipped rows are never batched.
- `AI_BATCH_SIZE` is clamped to 20-50.
- Default batch size is 25.
- A 5,000-row candidate import becomes 200 AI batches at batch size 25.
- Failed batches can be retried with `/imports/:importId/retry-failed`.

