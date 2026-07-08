# Reviewer Demo Guide

This guide shows the end-to-end CSV importer flow.

## 1. Start Postgres

```powershell
docker compose up -d postgres
```

## 2. Run Migrations

```powershell
npm.cmd run db:migrate
```

## 3. Start The API

For the full AI confirm flow, set your provider key first:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_real_gemini_key
GEMINI_MODEL=gemini-3.5-flash
```

```powershell
npm.cmd run dev
```

Default URL:

```text
http://localhost:5000
```

## 4. Preview A CSV

```powershell
curl.exe -F "file=@.\tests\fixtures\csv\basic-leads.csv;type=text/csv" http://localhost:5000/api/v1/imports/preview
```

Important things to show:

- `summary.totalRows`
- `summary.candidateRowCount`
- `summary.skippedRowCount`
- `previewRows[].validationStatus`

## 5. Confirm The Import

Use the `importId` from preview:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:5000/api/v1/imports\<importId>\confirm"
```

Important things to show:

- AI batches are created from candidate rows only.
- Batch size is bounded by `AI_BATCH_SIZE`, clamped to 20-50.
- API returns immediately so the client can poll status.

## 6. Poll Status

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:5000/api/v1/imports\<importId>\status"
```

Important things to show:

- `progress.totalBatches`
- `progress.completedBatches`
- `progress.failedBatches`
- `totals.imported`
- `totals.skipped`
- `recentEvents`

## 7. Fetch Results

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:5000/api/v1/imports\<importId>\result?limit=100&includeSkipped=true"
```

Important things to show:

- `summary`
- `batches`
- `skippedReasonCounts`
- `records`
- `skippedRecords`
- `events`

## One-Command Smoke Flow

After Postgres is migrated and the API is already running:

```powershell
npm.cmd run demo:smoke
```

The smoke script:

- uploads a fixture CSV
- prints the import id
- confirms processing
- polls status
- fetches the final result summary

## Quality Gates

Run before submitting:

```powershell
npm.cmd run verify
```

This runs:

- TypeScript typecheck
- Vitest test suite
- production build
