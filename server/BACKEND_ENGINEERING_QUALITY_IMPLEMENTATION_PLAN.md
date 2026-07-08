# Backend Engineering Quality Implementation Plan

## Goal

Build the CSV import backend like a production-grade senior engineer would: predictable pipeline, bounded AI usage, strong validation, deterministic normalization, resilient batch processing, and clean error reporting.

This plan focuses only on backend quality for the importer flow:

```text
Upload CSV
  -> Parse CSV
  -> Validate rows
  -> Batch valid rows for AI
  -> Validate AI response
  -> Normalize phone/date/status/source
  -> Persist structured results
  -> Return imported + skipped summary
```

The core rule: never send thousands of rows to AI in one request. Every AI call must be batched, validated, retryable, and observable.

## Current Backend Direction

The existing backend already has the right foundation:

- TypeScript + Express layered architecture.
- Drizzle ORM with Postgres.
- CSV parsing module.
- Import preview, confirm, status, result, retry, and cancel routes.
- LangChain/LangGraph-based AI extraction.
- Zod schemas for API and AI validation.
- Domain services for row/contact validation and CRM normalization.
- Structured errors, request IDs, logging, and test setup.

This plan hardens the importer so the assignment clearly demonstrates production readiness.

## Target Pipeline Design

```text
Client
  POST /api/v1/imports/preview
    - multipart CSV upload
    - file validation
    - CSV parse
    - row-level pre-validation
    - create import session
    - return preview + validation summary

Client
  POST /api/v1/imports/:importId/confirm
    - load parsed rows
    - create deterministic batches
    - process batches with AI
    - validate AI output with Zod
    - normalize each CRM record
    - persist imported and skipped rows
    - update import progress

Client
  GET /api/v1/imports/:importId/status
    - return progress, batch counts, current state

Client
  GET /api/v1/imports/:importId/result
    - return imported records, skipped rows, and summary
```

## Phase 1: Upload CSV Hardening

### Objective

Accept only safe, bounded CSV uploads and reject bad files before parsing.

### Implementation Items

- Use `multer` memory storage or temporary disk storage with strict limits.
- Enforce file size limit using env config:

```env
UPLOAD_MAX_FILE_SIZE_BYTES=5242880
```

- Accept only `.csv` files.
- Validate common CSV MIME types:
  - `text/csv`
  - `application/vnd.ms-excel`
  - `text/plain` only if extension is `.csv`
- Reject empty files.
- Reject files above configured size with `413 Payload Too Large`.
- Generate file metadata:
  - original filename
  - byte size
  - sha256 hash
  - uploadedAt
- Never log full CSV content or raw lead PII.

### Acceptance Criteria

- Invalid extension returns clear `400` or `415`.
- Oversized file returns `413`.
- Empty file returns `400`.
- Logs contain import id and file metadata, not raw rows.

## Phase 2: Parse CSV Safely

### Objective

Parse messy real-world CSV files without crashing and preserve enough row context for validation and debugging.

### Implementation Items

- Use `csv-parse` with explicit options:
  - `bom: true`
  - `columns: true`
  - `skip_empty_lines: true`
  - `trim: true`
  - `relax_column_count: true`
  - `max_record_size` from env

```env
CSV_MAX_RECORD_SIZE_BYTES=1048576
CSV_PREVIEW_ROW_LIMIT=20
IMPORT_MAX_ROWS=5000
```

- Add row metadata to every parsed row:
  - `rowIndex`
  - `raw`
  - `normalizedHeaders`
  - `rowHash`
- Stop parsing or reject if row count exceeds `IMPORT_MAX_ROWS`.
- Normalize headers before AI:
  - trim spaces
  - lower-case
  - replace repeated whitespace
  - preserve original header map for traceability
- Collect parser warnings instead of failing on every minor issue.

### Acceptance Criteria

- CSVs with BOM parse correctly.
- Empty lines are skipped.
- Large rows are rejected safely.
- Each parsed row keeps a stable `rowIndex`.
- Import preview returns total rows, valid candidate rows, skipped rows, and warnings.

## Phase 3: Pre-AI Row Validation

### Objective

Do deterministic validation before spending AI tokens.

### Implementation Items

- Validate each row before AI using Zod/domain service.
- Skip rows that are fully empty.
- Skip rows with no usable contact signal:
  - no email
  - no mobile/phone
  - no name plus no other identifying field
- Detect likely contact fields using known header aliases:
  - `email`, `email address`, `mail`
  - `phone`, `mobile`, `contact`, `whatsapp`
  - `name`, `full name`, `customer name`, `lead name`
- Keep skipped row reasons:
  - `EMPTY_ROW`
  - `NO_CONTACT`
  - `DUPLICATE_ROW`
  - `INVALID_FORMAT`
- Create stable row hashes to avoid importing duplicate identical rows.
- Do not send skipped rows to AI.

### Acceptance Criteria

- Invalid rows are skipped before AI.
- The skipped summary includes row number and reason.
- AI receives only candidate rows.
- Duplicate raw rows are not imported twice.

## Phase 4: Batch Planning

### Objective

Guarantee bounded AI calls and visible progress.

### Implementation Items

- Add/import config:

```env
AI_BATCH_SIZE=25
AI_BATCH_CONCURRENCY=2
AI_MAX_RETRIES=4
AI_RETRY_BASE_DELAY_MS=1000
```

- Clamp `AI_BATCH_SIZE` to a safe range:
  - minimum: `20`
  - maximum: `50`
  - default: `25`
- Create import batch records before processing:
  - `batchId`
  - `importId`
  - `batchNumber`
  - `status`
  - `attemptCount`
  - `rowStartIndex`
  - `rowEndIndex`
  - `totalRows`
- Batch only rows that passed pre-AI validation.
- Store batch lifecycle:
  - `pending`
  - `processing`
  - `completed`
  - `failed`
  - `cancelled`
- Track import-level progress:
  - total rows
  - candidate rows
  - imported rows
  - skipped rows
  - failed batches
  - completed batches

### Acceptance Criteria

- 5,000 rows become many small batches, never one AI request.
- Status endpoint can show progress during processing.
- Failed batches are visible and retryable.
- Batch size is configurable but bounded.

## Phase 5: AI Batch Processing

### Objective

Use AI as an extraction assistant, not as the source of truth.

### Implementation Items

- Use LangGraph workflow for batch execution:
  - prepare batch prompt
  - call LangChain model
  - parse structured output
  - validate output
  - normalize records
  - persist records
  - mark batch complete or failed
- Use `p-limit` for concurrency.
- Default concurrency: `2`.
- Retry transient failures only:
  - provider timeout
  - network error
  - rate limit
  - invalid JSON once if repair is possible
- Do not retry deterministic validation failures forever.
- Use exponential backoff:

```text
attempt 1: immediate
attempt 2: wait AI_RETRY_BASE_DELAY_MS
attempt 3 optional: wait AI_RETRY_BASE_DELAY_MS * 2
```

- Recommended assignment setting: `AI_MAX_RETRIES=4`.
- Keep current system extensible if we choose `5` for production.
- Add circuit breaker config:

```env
AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
AI_CIRCUIT_BREAKER_COOLDOWN_MS=30000
```

### Acceptance Criteria

- AI failure in one batch does not destroy the whole import.
- Transient failures retry 1-2 times.
- Permanent failures produce skipped/failed batch records.
- Import result clearly shows failed batches.

## Phase 6: AI Prompt Contract

### Objective

Make the AI response deterministic, auditable, and easy to validate.

### Prompt Requirements

The AI must return structured JSON only.

Each output item must include:

```ts
{
  rowIndex: number;
  action: "import" | "skip";
  skipReason?: string;
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  status?: string | null;
  source?: string | null;
  followUpDate?: string | null;
  notes?: string | null;
}
```

### Implementation Items

- Include input rows with stable `rowIndex`.
- Tell AI not to invent missing email/mobile/name.
- Tell AI to place uncertain extra information in notes.
- Tell AI to use `skip` when a row is not a lead.
- Tell AI to return one output per input row.
- Include allowed enum hints:
  - status values
  - source values
- Include compact examples in the prompt.

### Acceptance Criteria

- AI returns JSON only.
- Every AI output references an input `rowIndex`.
- The backend rejects outputs with missing or unknown row indexes.
- The backend does not trust invented required data.

## Phase 7: Validate AI Response With Zod

### Objective

Never persist unvalidated AI output.

### Implementation Items

- Create strict Zod schemas for:
  - batch response envelope
  - each extracted row
  - CRM enum values
  - skip reasons
- Use `safeParse`.
- Validate:
  - output is valid JSON/object
  - output count is equal to or less than input count
  - every output rowIndex exists in batch input
  - no duplicate rowIndex in AI output
  - imported rows have enough usable contact data
- Convert invalid AI rows into skipped rows when possible.
- Fail the batch only when the whole AI response is unusable.
- Store invalid AI row details as safe metadata, not raw provider payload.

### Acceptance Criteria

- Invalid AI response never reaches database as imported CRM data.
- Bad individual rows are skipped with reason `AI_OUTPUT_INVALID`.
- Bad full response marks batch failed and eligible for retry.
- Tests cover malformed JSON, missing rowIndex, duplicate rowIndex, and invalid enum.

## Phase 8: Deterministic Normalization

### Objective

Clean data using backend code after AI extraction.

### Phone Normalization

- Use `libphonenumber-js`.
- Default region can be configured:

```env
DEFAULT_PHONE_REGION=IN
```

- Normalize valid mobile numbers to E.164 where possible.
- Keep original phone in notes if parsing is uncertain.
- Skip imported record if no valid email and no valid phone remains.

### Date Normalization

- Use `dayjs` or a strict date parser.
- Normalize dates to ISO date format:

```text
YYYY-MM-DD
```

- Accept common formats:
  - `2026-07-08`
  - `08/07/2026`
  - `Jul 8 2026`
  - `tomorrow` only if explicitly supported and tested
- Invalid follow-up dates become `null`, with warning metadata.

### Status Normalization

- Map messy statuses into allowed CRM statuses:
  - `new`
  - `contacted`
  - `qualified`
  - `converted`
  - `lost`
  - `follow_up`

Examples:

```text
"hot" -> "qualified"
"callback" -> "follow_up"
"won" -> "converted"
"dead" -> "lost"
```

### Source Normalization

- Map source strings into allowed values:
  - `facebook`
  - `google`
  - `website`
  - `referral`
  - `whatsapp`
  - `manual`
  - `other`

Examples:

```text
"fb lead ad" -> "facebook"
"gads" -> "google"
"site form" -> "website"
```

### Notes Normalization

- Preserve useful unmapped fields in `crm_note`.
- Escape or replace raw newlines with safe formatting.
- Trim very long notes to configured limit.
- Avoid storing secrets or unsafe internal metadata in notes.

### Acceptance Criteria

- Normalization is tested independently from AI.
- AI can be wrong, but final stored CRM records still follow backend rules.
- Invalid phone/date/status/source values are normalized or skipped safely.

## Phase 9: Persistence And Result Summary

### Objective

Persist the complete import story, not only the successful rows.

### Implementation Items

- Store import session:
  - id
  - status
  - filename
  - file hash
  - totals
  - timestamps
- Store import batches:
  - batch status
  - attempt count
  - processing timestamps
  - failure reason
- Store imported records:
  - rowIndex
  - normalized CRM fields
  - source import id
  - batch id
- Store skipped rows:
  - rowIndex
  - reason
  - stage
  - safe details
- Result endpoint should return:

```ts
{
  importId: string;
  status: "completed" | "completed_with_errors" | "failed" | "cancelled";
  summary: {
    totalRows: number;
    candidateRows: number;
    importedRows: number;
    skippedRows: number;
    failedBatches: number;
  };
  imported: CrmRecord[];
  skipped: SkippedRow[];
  batches: BatchSummary[];
}
```

### Acceptance Criteria

- User can see exactly what happened to every row.
- Imported + skipped count matches parsed row count.
- Failed batches can be retried.
- Result endpoint supports pagination if result size is large.

## Phase 10: Error Handling

### Objective

Return clear API errors without exposing internals.

### Implementation Items

- Use centralized `AppError`.
- Use stable error codes:
  - `CSV_FILE_REQUIRED`
  - `CSV_FILE_TOO_LARGE`
  - `CSV_PARSE_FAILED`
  - `CSV_TOO_MANY_ROWS`
  - `IMPORT_NOT_FOUND`
  - `IMPORT_ALREADY_CONFIRMED`
  - `AI_PROVIDER_UNAVAILABLE`
  - `AI_BATCH_FAILED`
  - `VALIDATION_FAILED`
- Map status codes:
  - `400` invalid request
  - `404` import not found
  - `409` invalid import state
  - `413` file too large
  - `415` unsupported media/file type
  - `422` validation failed
  - `502` invalid AI/provider response
  - `503` AI unavailable/circuit open
- Always include request id in error response.
- Never expose:
  - OpenAI key
  - raw stack trace in production
  - full raw CSV rows in error logs

### Acceptance Criteria

- Error format is consistent across endpoints.
- Client can display useful messages.
- Production errors are safe.

## Phase 11: Observability

### Objective

Make the import pipeline easy to debug during demo and review.

### Implementation Items

- Structured logs with:
  - `requestId`
  - `importId`
  - `batchId`
  - `batchNumber`
  - `attempt`
  - `durationMs`
  - `status`
- Log lifecycle events:
  - upload accepted
  - parse completed
  - preview created
  - batch started
  - batch retry scheduled
  - batch completed
  - batch failed
  - import completed
- Add optional LangSmith tracing:

```env
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
```

- Track basic metrics in logs:
  - rows per second
  - AI duration per batch
  - validation failure count
  - skipped reason distribution

### Acceptance Criteria

- Demo logs clearly show batching.
- Failures can be traced by import id.
- Logs are useful but do not leak PII-heavy CSV content.

## Phase 12: Testing Plan

### Objective

Prove the importer works without relying on live AI for every test.

### Unit Tests

- CSV file validator:
  - valid csv
  - invalid extension
  - empty file
  - oversized file
- CSV parser:
  - BOM support
  - empty rows
  - messy headers
  - row index preservation
  - row limit rejection
- Row validator:
  - valid lead
  - no contact
  - duplicate row
  - empty row
- Batch planner:
  - 0 rows
  - 1 row
  - 25 rows
  - 50 rows
  - 5,000 rows
- AI output validator:
  - valid output
  - invalid JSON
  - missing rowIndex
  - duplicate rowIndex
  - unknown enum
  - hallucinated required field
- Normalizer:
  - Indian phone numbers
  - international phone numbers
  - invalid phone
  - valid and invalid dates
  - status aliases
  - source aliases

### Integration Tests

- Preview endpoint with fixture CSV.
- Confirm endpoint with fake AI provider.
- Status endpoint during and after processing.
- Result endpoint returns imported + skipped summary.
- Failed batch retry flow.
- Cancel import flow.

### Fixture CSVs

Keep fixtures that represent real assignment risk:

- clean leads
- Facebook lead ads
- Google Ads leads
- real estate CRM export
- manual messy spreadsheet
- multiple contact fields
- invalid/no-contact rows
- large generated 5,000-row CSV

### Acceptance Criteria

- Tests run without live OpenAI key.
- At least one smoke path can run with real AI when env key exists.
- Batching behavior is explicitly tested.

## Phase 13: API Contract

### Preview

```http
POST /api/v1/imports/preview
Content-Type: multipart/form-data
```

Response:

```ts
{
  importId: string;
  summary: {
    totalRows: number;
    candidateRows: number;
    skippedRows: number;
    warnings: string[];
  };
  previewRows: Array<{
    rowIndex: number;
    raw: Record<string, unknown>;
    validationStatus: "candidate" | "skipped";
    skipReason?: string;
  }>;
}
```

### Confirm

```http
POST /api/v1/imports/:importId/confirm
```

Response:

```ts
{
  importId: string;
  status: "processing" | "completed" | "completed_with_errors";
  totalBatches: number;
  batchSize: number;
}
```

### Status

```http
GET /api/v1/imports/:importId/status
```

Response:

```ts
{
  importId: string;
  status: string;
  progress: {
    totalBatches: number;
    completedBatches: number;
    failedBatches: number;
    importedRows: number;
    skippedRows: number;
  };
}
```

### Result

```http
GET /api/v1/imports/:importId/result
```

Response:

```ts
{
  importId: string;
  summary: {
    totalRows: number;
    importedRows: number;
    skippedRows: number;
    failedBatches: number;
  };
  imported: unknown[];
  skipped: unknown[];
}
```

## Phase 14: Environment Variables

Recommended backend env values for this quality target:

```env
# Upload and CSV limits
UPLOAD_MAX_FILE_SIZE_BYTES=5242880
CSV_MAX_RECORD_SIZE_BYTES=1048576
CSV_PREVIEW_ROW_LIMIT=20
IMPORT_MAX_ROWS=5000
DEFAULT_PHONE_REGION=IN

# AI provider
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-4.1-mini
AI_TEMPERATURE=0

# AI batching and resilience
AI_BATCH_SIZE=25
AI_BATCH_CONCURRENCY=2
AI_MAX_RETRIES=4
AI_RETRY_BASE_DELAY_MS=1000
AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
AI_CIRCUIT_BREAKER_COOLDOWN_MS=30000

# Optional tracing
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
```

## Phase 15: Demo Readiness

### Commands

```bash
npm run typecheck
npm run build
npm test
npm run db:generate
npm run db:migrate
npm run dev
```

### Demo Flow

1. Start Postgres with Docker.
2. Run migrations.
3. Start backend.
4. Upload fixture CSV to preview endpoint.
5. Show preview response with valid and skipped rows.
6. Confirm import.
7. Show logs proving AI batching.
8. Poll status endpoint.
9. Show final result endpoint with imported + skipped summary.
10. Retry failed batch if one is intentionally simulated.

## Final Acceptance Checklist

- CSV upload is bounded and validated.
- CSV parser handles messy files.
- Rows are pre-validated before AI.
- AI receives rows in batches of 20-50.
- AI failures retry 1-2 times.
- AI output is validated with Zod.
- Phone, date, status, and source are normalized in backend code.
- Invalid leads are skipped, not crashed.
- Result includes imported + skipped summary.
- Error responses are consistent.
- Logs show import and batch lifecycle.
- Tests prove batching, validation, retries, and normalization.

## Suggested Next Implementation Step

Implement the remaining hardening items in this order:

1. Enforce AI batch size min/max and `AI_MAX_RETRIES=4`.
2. Add strict AI output row-index reconciliation.
3. Strengthen phone/date/status/source normalization tests.
4. Add a fake-AI integration test for preview -> confirm -> status -> result.
5. Add a generated 5,000-row fixture test proving batching.
6. Add README demo commands and curl examples for the reviewer.
