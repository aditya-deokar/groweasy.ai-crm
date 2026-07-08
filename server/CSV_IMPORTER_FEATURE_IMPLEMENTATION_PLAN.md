# GrowEasy AI CSV Importer Feature Implementation Plan

Status: Draft for approval

Scope: backend feature implementation plan for the assignment after the backend foundation. This plan does not implement code yet. It defines the feature architecture, package choices, database design, API contracts, AI workflow, tests, Docker/Postgres setup, and implementation order.

## 1. Assignment Summary

Build an AI-powered CSV importer that accepts CSV files from many sources and maps messy lead data into GrowEasy CRM fields.

The core challenge is not basic CSV parsing. The core challenge is reliable extraction from unknown column names, inconsistent layouts, multiple phone/email values, ambiguous status/source values, and messy rows.

Required behavior:

- Accept any valid CSV file.
- Do not assume fixed column names.
- Parse CSV rows.
- Show preview before AI processing.
- Run AI extraction only after user confirms import.
- Send rows to the AI model in batches.
- Return structured CRM records.
- Skip rows that contain neither email nor mobile number.
- Report imported and skipped totals.

## 2. Selected Feature Tech Stack

### Runtime Libraries

```text
drizzle-orm
pg
@langchain/core
@langchain/langgraph
@langchain/openai
langchain
csv-parse
multer
p-limit
dayjs
libphonenumber-js
```

### Development Libraries

```text
drizzle-kit
@types/pg
@types/multer
```

### Why These Choices

- `drizzle-orm` plus `pg`: typed PostgreSQL access with SQL-first schema and migrations.
- `drizzle-kit`: migration generation and migration execution.
- `@langchain/langgraph`: explicit workflow orchestration for multi-step extraction.
- `langchain` and `@langchain/core`: prompt/model abstractions and structured output support.
- `@langchain/openai`: first provider adapter. Keep the AI port provider-agnostic so Gemini/Claude can be added later.
- `csv-parse`: streaming parser with support for quotes, delimiters, record delimiters, large datasets, and relaxed CSV options.
- `multer`: Express multipart upload middleware with file-size limits.
- `p-limit`: simple controlled concurrency for AI batch execution.
- `dayjs`: deterministic date normalization and validation helpers.
- `libphonenumber-js`: deterministic phone/country-code cleanup after AI extraction.

## 3. Official References Checked

- LangChain structured output docs: https://docs.langchain.com/oss/javascript/langchain/structured-output
- LangGraph JavaScript overview: https://docs.langchain.com/oss/javascript/langgraph/overview
- LangChain OpenAI integration: https://docs.langchain.com/oss/javascript/integrations/chat/openai
- Drizzle PostgreSQL get started: https://orm.drizzle.team/docs/get-started/postgresql-new
- CSV Parse docs: https://csv.js.org/parse/

## 4. High-Level Product Flow

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant API as Express API
  participant DB as PostgreSQL
  participant AI as LangGraph/LangChain

  UI->>API: POST /api/v1/imports/preview CSV file
  API->>API: Validate file and stream-parse CSV
  API->>DB: Create import job and raw rows
  API-->>UI: importId, headers, previewRows, row counts

  UI->>API: POST /api/v1/imports/:id/confirm
  API->>DB: Mark job PROCESSING and create batches
  API-->>UI: importId, status endpoint

  API->>AI: Process rows in batches with LangGraph
  AI-->>API: Structured CRM records and skipped records
  API->>DB: Persist successful records, skipped records, batch status

  UI->>API: GET /api/v1/imports/:id/status
  API-->>UI: progress counts

  UI->>API: GET /api/v1/imports/:id/result
  API-->>UI: imported records, skipped rows, totals
```

## 5. Target API Design

All routes live under `/api/v1`.

### 5.1 Upload and Preview CSV

```text
POST /api/v1/imports/preview
Content-Type: multipart/form-data
field: file
```

Purpose:

- Accept CSV upload.
- Validate file size and basic extension/MIME.
- Stream-parse CSV.
- Persist the import job and raw parsed rows.
- Return preview rows.
- Do not call AI.

Success response:

```json
{
  "success": true,
  "message": "CSV parsed successfully.",
  "data": {
    "importId": "uuid",
    "status": "PARSED",
    "file": {
      "originalName": "facebook-leads.csv",
      "sizeBytes": 15000,
      "sha256": "..."
    },
    "headers": ["Full Name", "Phone", "Email Address"],
    "previewRows": [
      {
        "rowIndex": 1,
        "values": {
          "Full Name": "John Doe",
          "Phone": "+91 9876543210",
          "Email Address": "john@example.com"
        }
      }
    ],
    "summary": {
      "totalRows": 250,
      "previewRowCount": 20,
      "emptyRowCount": 3,
      "warningCount": 0
    }
  },
  "meta": {
    "requestId": "..."
  },
  "timestamp": "..."
}
```

Validation failures:

- Missing file: `400 FILE_REQUIRED`
- Unsupported file: `415 UNSUPPORTED_FILE_TYPE`
- File too large: `413 FILE_TOO_LARGE`
- Invalid CSV: `400 INVALID_CSV`
- Too many rows: `422 IMPORT_ROW_LIMIT_EXCEEDED`

### 5.2 Confirm Import

```text
POST /api/v1/imports/:importId/confirm
```

Purpose:

- Start AI extraction only after the user confirms.
- Create batch records.
- Run background in-process processing for the assignment.
- Return quickly with status metadata.

Success response:

```json
{
  "success": true,
  "message": "Import processing started.",
  "data": {
    "importId": "uuid",
    "status": "PROCESSING",
    "totalRows": 250,
    "totalBatches": 10,
    "statusUrl": "/api/v1/imports/uuid/status",
    "resultUrl": "/api/v1/imports/uuid/result"
  }
}
```

Rules:

- Only `PARSED`, `FAILED`, or partially retryable jobs can be confirmed.
- Duplicate confirm requests should be idempotent.
- If a job is already `PROCESSING`, return current processing state.

### 5.3 Import Status

```text
GET /api/v1/imports/:importId/status
```

Purpose:

- Support frontend progress indicators.
- Avoid requiring websockets/SSE in the first feature implementation.

Success response:

```json
{
  "success": true,
  "message": "Import status fetched.",
  "data": {
    "importId": "uuid",
    "status": "PROCESSING",
    "progress": {
      "totalRows": 250,
      "processedRows": 100,
      "totalBatches": 10,
      "completedBatches": 4,
      "failedBatches": 0,
      "percent": 40
    },
    "totals": {
      "imported": 92,
      "skipped": 8
    },
    "error": null
  }
}
```

### 5.4 Import Result

```text
GET /api/v1/imports/:importId/result
```

Query params:

```text
limit=100
cursor=...
includeSkipped=true
```

Purpose:

- Return extracted CRM records and skipped rows.
- Keep response paginated for large imports.

Success response:

```json
{
  "success": true,
  "message": "Import result fetched.",
  "data": {
    "importId": "uuid",
    "status": "COMPLETED",
    "summary": {
      "totalRows": 250,
      "totalImported": 232,
      "totalSkipped": 18
    },
    "records": [
      {
        "rowIndex": 1,
        "created_at": "2026-05-13T14:20:48.000Z",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "country_code": "+91",
        "mobile_without_country_code": "9876543210",
        "company": "GrowEasy",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "lead_owner": "test@gmail.com",
        "crm_status": "GOOD_LEAD_FOLLOW_UP",
        "crm_note": "Client is asking to reschedule demo",
        "data_source": "",
        "possession_time": "",
        "description": ""
      }
    ],
    "skippedRecords": [
      {
        "rowIndex": 7,
        "reason": "Missing email and mobile number",
        "rawData": {
          "Name": "No Contact"
        }
      }
    ],
    "pageInfo": {
      "nextCursor": null,
      "hasMore": false
    }
  }
}
```

### 5.5 Retry Failed Batches

```text
POST /api/v1/imports/:importId/retry-failed
```

Purpose:

- Bonus reliability.
- Retry only failed AI batches.
- Do not reprocess completed batches.

### 5.6 Cancel Import

```text
POST /api/v1/imports/:importId/cancel
```

Purpose:

- Mark a queued or processing import as `CANCELLED`.
- Processor checks status between batches.

## 6. Database Design with Drizzle and PostgreSQL

### 6.1 Tables

#### `import_jobs`

Tracks the lifecycle of each uploaded CSV.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid primary key | default generated |
| `original_file_name` | text | upload filename |
| `file_size_bytes` | integer | upload size |
| `file_sha256` | text | duplicate/debug support |
| `status` | enum | `UPLOADED`, `PARSED`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED` |
| `headers` | jsonb | parsed CSV headers |
| `total_rows` | integer | data rows, excluding header |
| `empty_row_count` | integer | parser summary |
| `total_batches` | integer | AI batches |
| `processed_rows` | integer | progress |
| `imported_count` | integer | success count |
| `skipped_count` | integer | skipped count |
| `error_message` | text nullable | job-level failure |
| `created_at` | timestamp | default now |
| `updated_at` | timestamp | default now |
| `confirmed_at` | timestamp nullable | user confirmed |
| `completed_at` | timestamp nullable | finished |

Indexes:

- `status`
- `created_at`
- `file_sha256`

#### `import_rows`

Stores raw parsed CSV rows.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid primary key |
| `import_job_id` | uuid foreign key |
| `row_index` | integer | 1-based CSV row index |
| `raw_data` | jsonb | original header/value map |
| `raw_text_hash` | text | dedupe/debug |
| `parse_warnings` | jsonb nullable | row-level CSV warnings |
| `created_at` | timestamp | default now |

Indexes:

- `(import_job_id, row_index)` unique

#### `import_batches`

Tracks AI batch execution.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid primary key |
| `import_job_id` | uuid foreign key |
| `batch_index` | integer | zero-based |
| `status` | enum | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED` |
| `row_start_index` | integer | first row index |
| `row_end_index` | integer | last row index |
| `row_count` | integer | batch size |
| `retry_count` | integer | attempts |
| `model_name` | text nullable | provider model used |
| `input_tokens` | integer nullable | if provider returns usage |
| `output_tokens` | integer nullable | if provider returns usage |
| `error_message` | text nullable | batch failure |
| `started_at` | timestamp nullable |
| `completed_at` | timestamp nullable |
| `created_at` | timestamp |
| `updated_at` | timestamp |

Indexes:

- `(import_job_id, batch_index)` unique
- `status`

#### `crm_import_records`

Stores successful CRM records.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid primary key |
| `import_job_id` | uuid foreign key |
| `import_row_id` | uuid foreign key |
| `row_index` | integer |
| `created_at_value` | text | must be convertible by `new Date` |
| `name` | text nullable |
| `email` | text nullable |
| `country_code` | text nullable |
| `mobile_without_country_code` | text nullable |
| `company` | text nullable |
| `city` | text nullable |
| `state` | text nullable |
| `country` | text nullable |
| `lead_owner` | text nullable |
| `crm_status` | enum nullable | allowed assignment statuses |
| `crm_note` | text nullable |
| `data_source` | enum nullable | allowed assignment sources |
| `possession_time` | text nullable |
| `description` | text nullable |
| `confidence` | jsonb nullable | model confidence by field |
| `created_at` | timestamp | record creation timestamp |

Indexes:

- `import_job_id`
- `email`
- `mobile_without_country_code`

#### `crm_skipped_records`

Stores skipped rows and reasons.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid primary key |
| `import_job_id` | uuid foreign key |
| `import_row_id` | uuid foreign key |
| `row_index` | integer |
| `reason` | text | user-facing reason |
| `raw_data` | jsonb | original row |
| `created_at` | timestamp |

Indexes:

- `import_job_id`
- `(import_job_id, row_index)` unique

#### `import_events`

Append-only audit trail for job progress.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid primary key |
| `import_job_id` | uuid foreign key |
| `event_type` | text | `CSV_PARSED`, `BATCH_STARTED`, etc. |
| `message` | text |
| `metadata` | jsonb nullable |
| `created_at` | timestamp |

### 6.2 Drizzle Files

```text
server/
  drizzle/
    migrations/
  drizzle.config.ts
  src/
    db/
      index.ts
      schema.ts
      migrate.ts
      types.ts
```

### 6.3 Database Scripts

Add scripts:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

### 6.4 Environment Variables

Add:

```text
DATABASE_URL=postgres://groweasy:groweasy@localhost:5432/groweasy
DB_SSL=false
```

## 7. Docker Plan

Add PostgreSQL with Docker Compose.

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: groweasy
      POSTGRES_USER: groweasy
      POSTGRES_PASSWORD: groweasy
    ports:
      - "5432:5432"
    volumes:
      - groweasy_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U groweasy -d groweasy"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  groweasy_postgres_data:
```

Optional local tools:

- Add `pgadmin` only if needed.
- Keep Redis/BullMQ out of the first feature implementation unless multi-worker background processing becomes required.

## 8. Target Folder Structure

```text
src/
  db/
    index.ts
    schema.ts
    migrate.ts
    types.ts

  modules/
    imports/
      imports.container.ts

      domain/
        constants/
          crm-status.ts
          data-source.ts
          import-status.ts
        entities/
          crm-record.ts
          import-job.ts
          import-row.ts
        errors/
          import-errors.ts
        ports/
          ai-extractor.port.ts
          csv-parser.port.ts
          import-repository.port.ts
        services/
          crm-record-normalizer.ts
          row-contact-validator.ts

      application/
        dto/
          confirm-import.dto.ts
          import-result.dto.ts
          import-status.dto.ts
          preview-import.dto.ts
        use-cases/
          create-import-preview.use-case.ts
          confirm-import.use-case.ts
          get-import-status.use-case.ts
          get-import-result.use-case.ts
          retry-failed-batches.use-case.ts
          cancel-import.use-case.ts
        services/
          import-batch-planner.ts
          import-processor.ts

      infrastructure/
        ai/
          langchain-crm-extractor.ts
          langgraph-import-workflow.ts
          prompts/
            crm-extraction.prompt.ts
          schemas/
            crm-extraction.schema.ts
        csv/
          csv-parse-adapter.ts
          csv-file-validator.ts
        database/
          drizzle-import-repository.ts
        upload/
          multer-upload.middleware.ts

      presentation/
        imports.controller.ts
        imports.routes.ts
        imports.schemas.ts
```

## 9. Domain Rules

### 9.1 CRM Fields

Target CRM fields:

```text
created_at
name
email
country_code
mobile_without_country_code
company
city
state
country
lead_owner
crm_status
crm_note
data_source
possession_time
description
```

### 9.2 Allowed CRM Status Values

```text
GOOD_LEAD_FOLLOW_UP
DID_NOT_CONNECT
BAD_LEAD
SALE_DONE
```

Rules:

- AI must only return one of these values.
- If ambiguous, return blank/null and add context to `crm_note`.
- Post-processing must reject any unknown value.

### 9.3 Allowed Data Source Values

```text
leads_on_demand
meridian_tower
eden_park
varah_swamy
sarjapur_plots
```

Rules:

- If no confident match, keep blank/null.
- Never invent a new source.

### 9.4 Contact Rules

- If no email and no mobile exists, skip the row.
- If multiple emails exist:
  - first email goes to `email`
  - remaining emails are appended to `crm_note`
- If multiple mobile numbers exist:
  - first mobile goes to `mobile_without_country_code`
  - remaining numbers are appended to `crm_note`
- Use `country_code` separately when detectable.
- Validate email format deterministically after AI.
- Normalize phone numbers deterministically after AI.

### 9.5 Date Rules

- `created_at` must be convertible by JavaScript `new Date(created_at)`.
- Prefer ISO timestamp output.
- If date is missing or invalid, leave blank/null rather than inventing.
- Preserve suspicious date context in `crm_note`.

### 9.6 CSV Compatibility Rules

- Do not produce multiline CRM field values.
- Replace line breaks inside AI output with `\n` or spaces during normalization.
- Trim all string fields.
- Keep records valid if later exported to CSV.

## 10. CSV Parsing Design

### 10.1 Upload Validation

Rules:

- Accept `.csv`.
- Accept common CSV MIME values:
  - `text/csv`
  - `application/csv`
  - `application/vnd.ms-excel`
  - `text/plain` only if extension is `.csv`
- Enforce `UPLOAD_MAX_FILE_SIZE_BYTES`.
- Enforce `IMPORT_MAX_ROWS`.
- Enforce `CSV_MAX_RECORD_SIZE_BYTES`.

### 10.2 Parsing Options

Use `csv-parse` with:

```text
bom: true
columns: true
skip_empty_lines: true
trim: true
relax_column_count: true
relax_quotes: true
max_record_size: env.CSV_MAX_RECORD_SIZE_BYTES
```

Reason:

- Real exports often contain BOM, trailing spaces, inconsistent columns, empty lines, or relaxed quoting.
- We should capture warnings where possible, not fail the entire import for recoverable row-level issues.

### 10.3 Preview Behavior

- Persist all rows.
- Return only `CSV_PREVIEW_ROW_LIMIT` rows.
- Include headers and summary.
- Do not run AI.
- Do not normalize to CRM fields yet.

## 11. AI Extraction Design

### 11.1 Architecture

Use `LangGraph` to orchestrate the import workflow and `LangChain` model integrations for structured extraction.

Workflow graph:

```mermaid
flowchart TD
  A["load import job and rows"] --> B["plan batches"]
  B --> C["process next batch"]
  C --> D["AI structured extraction"]
  D --> E["deterministic normalize and validate"]
  E --> F["persist records and skipped rows"]
  F --> G{"more batches?"}
  G -->|yes| C
  G -->|no| H["aggregate totals and complete job"]
  C --> I{"batch failed?"}
  I -->|retryable| C
  I -->|not retryable| J["mark batch failed"]
```

### 11.2 LangGraph State

```ts
interface ImportGraphState {
  importId: string;
  jobStatus: ImportStatus;
  headers: string[];
  totalRows: number;
  batchSize: number;
  currentBatchIndex: number;
  completedBatches: number;
  failedBatches: number;
  importedCount: number;
  skippedCount: number;
  errors: string[];
}
```

### 11.3 AI Provider Port

Domain/application port:

```ts
interface AiCrmExtractor {
  extractBatch(input: AiCrmExtractionInput): Promise<AiCrmExtractionBatchResult>;
}
```

Infrastructure implementation:

```text
LangChainCrmExtractor
```

This keeps the app provider-agnostic. Initial implementation uses `ChatOpenAI` through `@langchain/openai`, but the application layer should not know about OpenAI.

### 11.4 Structured Output Schema

Use Zod schema as the single source of truth:

```ts
const extractedRecordSchema = z.object({
  rowIndex: z.number().int().positive(),
  action: z.enum(['IMPORT', 'SKIP']),
  skipReason: z.string().optional(),
  record: z
    .object({
      created_at: z.string().nullable(),
      name: z.string().nullable(),
      email: z.string().nullable(),
      country_code: z.string().nullable(),
      mobile_without_country_code: z.string().nullable(),
      company: z.string().nullable(),
      city: z.string().nullable(),
      state: z.string().nullable(),
      country: z.string().nullable(),
      lead_owner: z.string().nullable(),
      crm_status: z
        .enum(['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'])
        .nullable(),
      crm_note: z.string().nullable(),
      data_source: z
        .enum(['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'])
        .nullable(),
      possession_time: z.string().nullable(),
      description: z.string().nullable(),
    })
    .nullable(),
});
```

Use LangChain structured output so model output is parsed and validated as typed data.

### 11.5 Prompt Strategy

System prompt responsibilities:

- Explain GrowEasy CRM schema.
- Explain allowed enum values.
- Explain skip rule.
- Explain multiple email/mobile handling.
- Explain date conversion rule.
- Explain data-source confidence rule.
- Explain notes field behavior.
- Require one output item per input row.
- Require no extra fields.

User prompt content per batch:

- Source headers.
- A compact profile of column names.
- Batch rows as JSON objects with `rowIndex` and `rawData`.
- Reminder that raw column names may be misleading or inconsistent.

Important prompt instruction:

```text
If a value cannot be confidently mapped, return null rather than hallucinating.
```

### 11.6 Deterministic Post-Processing

After AI returns structured data:

- Trim strings.
- Convert empty strings to null.
- Replace line breaks in text fields.
- Validate `crm_status`.
- Validate `data_source`.
- Validate `created_at` with `new Date(value)`.
- Validate and normalize email.
- Validate and split phone/country code using `libphonenumber-js`.
- Apply skip rule again even if AI forgot.
- Append extra emails/phones to `crm_note`.

This prevents the LLM from being the only correctness boundary.

### 11.7 Batch Strategy

Initial env defaults:

```text
AI_BATCH_SIZE=25
AI_BATCH_CONCURRENCY=2
AI_MAX_RETRIES=3
AI_RETRY_BASE_DELAY_MS=1000
AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
AI_CIRCUIT_BREAKER_COOLDOWN_MS=30000
```

Rules:

- Batch size should be configurable.
- Persist batch status before and after processing.
- Retry transient provider failures.
- If a batch repeatedly fails due to output schema/size, split it into smaller batches.
- Circuit breaker protects the app from repeated AI provider failures.

## 12. Processing Mode

Recommended first implementation:

- In-process async job runner.
- Durable job/batch state stored in PostgreSQL.
- Status polling through `/status`.

Why:

- Good enough for assignment scale.
- Avoids adding Redis/BullMQ before it is necessary.
- Still gives progress indicators and retryable batches.

Future upgrade:

- Add BullMQ and Redis if we need multi-process workers, scheduled retries, or horizontal scaling.

## 13. Module Implementation Plan

### Phase A: Database and Docker

1. Install `drizzle-orm`, `pg`, `drizzle-kit`, `@types/pg`.
2. Add `DATABASE_URL` to env validation.
3. Add PostgreSQL service to `docker-compose.yml`.
4. Add `src/db/index.ts`.
5. Add `src/db/schema.ts` with import tables and enums.
6. Add `drizzle.config.ts`.
7. Generate initial migration.
8. Run migration against local Docker Postgres.
9. Add database readiness check to health module.

Acceptance:

- `docker compose up postgres` works.
- `npm run db:migrate` works.
- `/health/ready` includes database status.

### Phase B: Import Domain

1. Add CRM status constants.
2. Add data source constants.
3. Add import status constants.
4. Add CRM record entity/type.
5. Add import job and row types.
6. Add domain errors.
7. Add repository and parser ports.
8. Add contact validator and record normalizer domain services.

Acceptance:

- Unit tests cover enum validation, contact skip rule, date validation, and note normalization.

### Phase C: CSV Preview

1. Install `multer`, `csv-parse`, `@types/multer`.
2. Add upload middleware with file-size limit.
3. Add CSV file validator.
4. Add `CsvParseAdapter`.
5. Add `CreateImportPreviewUseCase`.
6. Add Drizzle repository methods:
   - create import job
   - insert rows
   - update parsed summary
7. Add route:
   - `POST /api/v1/imports/preview`
8. Add integration tests with CSV fixtures.

Acceptance:

- Upload valid CSV and receive preview.
- No AI call happens during preview.
- Invalid CSV returns clean error envelope.
- Large files and too many rows are rejected.

### Phase D: AI Extraction Contract

1. Install LangChain/LangGraph packages.
2. Add AI env variables.
3. Add Zod structured output schemas.
4. Add prompt module.
5. Add `AiCrmExtractor` port.
6. Add `LangChainCrmExtractor`.
7. Add unit tests with a fake extractor.
8. Add contract tests for schema parsing.

Acceptance:

- AI adapter can process a small batch.
- Output schema rejects invalid enum values.
- Fake extractor enables deterministic tests.

### Phase E: LangGraph Import Workflow

1. Add `LangGraphImportWorkflow`.
2. Add batch planner.
3. Add `ImportProcessor`.
4. Add retry and circuit breaker integration.
5. Add batch status persistence.
6. Add partial failure handling.
7. Add idempotency guards.

Acceptance:

- Confirming an import creates batches.
- Batches move through statuses.
- Failed transient batches retry.
- Job completes with imported/skipped totals.

### Phase F: Confirm, Status, Result APIs

1. Add `ConfirmImportUseCase`.
2. Add `GetImportStatusUseCase`.
3. Add `GetImportResultUseCase`.
4. Add `RetryFailedBatchesUseCase`.
5. Add `CancelImportUseCase`.
6. Add routes:
   - `POST /api/v1/imports/:id/confirm`
   - `GET /api/v1/imports/:id/status`
   - `GET /api/v1/imports/:id/result`
   - `POST /api/v1/imports/:id/retry-failed`
   - `POST /api/v1/imports/:id/cancel`

Acceptance:

- Frontend can show progress.
- Completed jobs return records and skipped rows.
- Result endpoint is paginated.

### Phase G: Tests and Fixtures

Add fixture CSV files:

```text
tests/fixtures/csv/facebook-leads.csv
tests/fixtures/csv/google-ads.csv
tests/fixtures/csv/real-estate-crm.csv
tests/fixtures/csv/manual-messy.csv
tests/fixtures/csv/multiple-contacts.csv
tests/fixtures/csv/invalid-no-contact.csv
```

Test categories:

- CSV parser unit tests.
- CRM normalizer unit tests.
- Import repository integration tests.
- Preview API integration tests.
- Confirm/status/result integration tests with fake AI.
- AI prompt/schema contract tests.
- Failure tests for invalid upload, AI retry, failed batch, and skipped records.

### Phase H: Documentation

Update README with:

- Docker Postgres setup.
- Drizzle commands.
- AI env variables.
- Import API docs.
- Example curl commands.
- Known limits.
- Full-time position note for submission.

## 14. Environment Variables To Add

```text
DATABASE_URL=postgres://groweasy:groweasy@localhost:5432/groweasy
DB_SSL=false

UPLOAD_MAX_FILE_SIZE_BYTES=5242880
IMPORT_MAX_ROWS=5000
CSV_PREVIEW_ROW_LIMIT=20
CSV_MAX_RECORD_SIZE_BYTES=1048576

AI_PROVIDER=openai
OPENAI_API_KEY=
AI_MODEL=gpt-4.1-mini
AI_TEMPERATURE=0
AI_BATCH_SIZE=25
AI_BATCH_CONCURRENCY=2
AI_MAX_RETRIES=3
AI_RETRY_BASE_DELAY_MS=1000
AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
AI_CIRCUIT_BREAKER_COOLDOWN_MS=30000

LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
```

Model note:

- Keep `AI_MODEL` configurable.
- Use temperature `0` for deterministic extraction.
- If model choice changes later, only AI config and adapter should change.

## 15. Error Handling Plan

Use existing `AppError` and error middleware.

Feature error codes:

```text
FILE_REQUIRED
FILE_TOO_LARGE
UNSUPPORTED_FILE_TYPE
INVALID_CSV
IMPORT_NOT_FOUND
IMPORT_NOT_READY
IMPORT_ALREADY_PROCESSING
IMPORT_ALREADY_COMPLETED
IMPORT_CANCELLED
IMPORT_ROW_LIMIT_EXCEEDED
AI_PROVIDER_UNAVAILABLE
AI_BATCH_FAILED
AI_INVALID_STRUCTURED_OUTPUT
DATABASE_OPERATION_FAILED
```

Rules:

- Controllers do not format raw errors.
- Application layer throws domain/application errors.
- Infrastructure layer wraps provider/parser/database failures with meaningful errors.
- Unknown errors remain generic 500s.

## 16. Performance and Scaling Plan

Immediate assignment scope:

- Stream CSV parsing.
- Insert rows in chunks.
- Batch AI calls.
- Limit AI concurrency.
- Poll progress from database.
- Paginate result endpoint.

Future scale improvements:

- Redis/BullMQ worker queue.
- S3/R2 object storage for original CSV files.
- Server-sent events for live progress.
- Read replicas for result views.
- Import retention cleanup job.

## 17. Security and Privacy Plan

- Do not log uploaded CSV row values.
- Do not log full AI prompts in production.
- Log job IDs, batch IDs, counts, and error codes.
- Redact API keys from config/logs.
- Enforce upload size and row limits.
- Validate CSV extension/MIME before parsing.
- Escape or normalize multiline output.
- Avoid formula injection if records are later exported to CSV.
- Keep CORS allowlist from env.

## 18. Frontend Contract Notes

The frontend should:

- Upload CSV to preview endpoint.
- Render returned `headers` and `previewRows`.
- Call confirm endpoint only after user clicks Confirm.
- Poll status endpoint while processing.
- Fetch result endpoint after status is `COMPLETED`.
- Render `records`, `skippedRecords`, `totalImported`, and `totalSkipped`.

No AI should be triggered from preview.

## 19. Recommended Implementation Order

1. Database/Docker/Drizzle setup.
2. Import domain constants, entities, ports, and errors.
3. CSV upload and preview endpoint.
4. Drizzle repository implementation.
5. CRM normalization and skip-rule logic.
6. LangChain structured output schema and prompt.
7. LangGraph import workflow.
8. Confirm/status/result routes.
9. Retry/cancel endpoints.
10. Tests with fake AI and CSV fixtures.
11. README updates and curl examples.

## 20. Definition of Done

Feature is complete when:

- CSV upload preview works with messy headers.
- Preview performs no AI call.
- Confirm starts AI processing.
- AI processes rows in configurable batches.
- Records match the CRM schema.
- Invalid rows are skipped with reasons.
- Multiple emails/phones are handled as required.
- Status and result endpoints work.
- Postgres stores jobs, rows, batches, records, and skipped records.
- Drizzle migrations are committed.
- Docker Postgres setup works.
- Unit and integration tests pass.
- README documents the full setup.

