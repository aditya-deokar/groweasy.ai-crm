# GrowEasy Backend

Production-ready TypeScript/Express backend for the GrowEasy AI CSV importer assignment.

The importer supports:

- CSV upload and safe parsing
- pre-AI row validation and dedupe
- bounded AI batch processing with LangChain/LangGraph
- strict Zod validation and row-index reconciliation for AI output
- deterministic phone/date/status/source normalization
- Drizzle/Postgres persistence
- imported + skipped summaries
- retry, cancel, status, and result APIs
- structured errors, request IDs, logs, and import events

## Tech Stack

- Node.js
- TypeScript
- Express
- Zod
- Drizzle ORM
- PostgreSQL
- LangChain
- LangGraph
- Google Gemini
- OpenAI
- csv-parse
- multer
- libphonenumber-js
- p-limit
- Pino
- Vitest
- Supertest

## Architecture

The backend follows a 4-layer module architecture:

```text
presentation -> application -> domain
infrastructure -> domain/application ports
```

Layer responsibilities:

- `presentation`: Express routes, controllers, request validation, response sending.
- `application`: use cases and workflow orchestration.
- `domain`: business entities, constants, validation rules, ports, and errors.
- `infrastructure`: database, CSV, upload, AI, and technical adapters.

## Local Setup

Install dependencies:

```powershell
npm.cmd install
```

Create an environment file:

```powershell
Copy-Item .env.example .env
```

Start PostgreSQL:

```powershell
docker compose up -d postgres
```

Run migrations:

```powershell
npm.cmd run db:migrate
```

Start the development server:

```powershell
npm.cmd run dev
```

Default server URL:

```text
http://localhost:5000
```

## Important Docs

- [API contract](./docs/API_CONTRACT.md)
- [Environment configuration](./docs/ENVIRONMENT.md)
- [Reviewer demo guide](./docs/DEMO_GUIDE.md)
- [Backend quality plan](./BACKEND_ENGINEERING_QUALITY_IMPLEMENTATION_PLAN.md)

## Environment Variables

Use `.env.example` as the source of truth.

Important importer defaults:

```env
UPLOAD_MAX_FILE_SIZE_BYTES=5242880
IMPORT_MAX_ROWS=5000
CSV_PREVIEW_ROW_LIMIT=20
CSV_MAX_RECORD_SIZE_BYTES=1048576
DEFAULT_PHONE_REGION=IN
AI_PROVIDER=gemini
OPENAI_API_KEY=
AI_MODEL=gpt-4.1-mini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
AI_TEMPERATURE=0
AI_BATCH_SIZE=25
AI_BATCH_CONCURRENCY=2
AI_MAX_RETRIES=2
AI_RETRY_BASE_DELAY_MS=1000
AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
AI_CIRCUIT_BREAKER_COOLDOWN_MS=30000
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
```

Rules:

- All environment reads go through `src/config/env.ts`.
- Invalid environment values fail at startup.
- `AI_BATCH_SIZE` is clamped to 20-50.
- `AI_MAX_RETRIES` is clamped to 0-2.
- Preview does not require an AI key.
- Confirming an import requires `GEMINI_API_KEY` when `AI_PROVIDER=gemini`.
- OpenAI remains available with `AI_PROVIDER=openai` and `OPENAI_API_KEY`.

## Scripts

```text
npm run dev              Start local dev server with tsx
npm run build            Compile TypeScript to dist
npm start                Run compiled server
npm run typecheck        Run TypeScript without emitting files
npm run verify           Run typecheck, tests, and build
npm run lint             Run ESLint
npm run format           Format files with Prettier
npm run format:check     Check formatting
npm test                 Run Vitest tests
npm run test:watch       Run Vitest in watch mode
npm run test:coverage    Run tests with coverage
npm run db:generate      Generate Drizzle migrations
npm run db:migrate       Run Drizzle migrations
npm run db:push          Push schema directly during local development
npm run db:studio        Open Drizzle Studio
npm run demo:smoke       Run local CSV import smoke flow
```

## API Endpoints

```text
GET /
GET /api/v1
GET /health
GET /health/live
GET /health/ready
GET /api/v1/health
GET /api/v1/health/live
GET /api/v1/health/ready
POST /api/v1/imports/preview
POST /api/v1/imports/:importId/confirm
GET /api/v1/imports/:importId/status
GET /api/v1/imports/:importId/result
POST /api/v1/imports/:importId/retry-failed
POST /api/v1/imports/:importId/cancel
```

All responses use the standard envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "meta": {
    "requestId": "..."
  },
  "timestamp": "2026-07-08T00:00:00.000Z"
}
```

## Import Flow

Preview:

```powershell
curl.exe -F "file=@.\tests\fixtures\csv\basic-leads.csv;type=text/csv" http://localhost:5000/api/v1/imports/preview
```

Confirm:

```powershell
curl.exe -X POST http://localhost:5000/api/v1/imports/<importId>/confirm
```

Status:

```powershell
curl.exe http://localhost:5000/api/v1/imports/<importId>/status
```

Result:

```powershell
curl.exe "http://localhost:5000/api/v1/imports/<importId>/result?limit=100&includeSkipped=true"
```

One-command smoke flow after the server is running:

```powershell
npm.cmd run demo:smoke
```

## Testing

Run all verification checks:

```powershell
npm.cmd run verify
```

Current coverage includes:

- health endpoint integration tests
- request validation middleware
- error handler middleware
- response sender
- retry policy
- circuit breaker
- CSV upload validator
- CSV parser edge cases and real fixtures
- pre-AI row validation
- 5,000-row batch planning
- import preview use case
- confirm import use case
- AI structured output schema
- AI output reconciliation validator
- CRM record normalizer
- LangGraph import workflow with fake AI and retry behavior

CSV fixtures live in `tests/fixtures/csv`.

## Reviewer Notes

This backend intentionally demonstrates senior engineering signals:

- no 5,000-row AI requests
- rows are pre-validated before AI
- AI output is not trusted until validated and reconciled
- normalization happens in backend code
- invalid leads are skipped with reasons
- every import returns imported + skipped summaries
- failed batches are visible and retryable
- logs and durable events expose the import lifecycle without storing secrets in logs
