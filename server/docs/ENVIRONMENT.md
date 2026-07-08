# Environment Configuration

All environment variables are parsed and validated in:

```text
src/config/env.ts
```

Invalid values fail fast at startup.

## Required For Local API

```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
DATABASE_URL=postgres://groweasy:groweasy@localhost:5432/groweasy
DB_SSL=false
```

## CSV Upload And Parsing

```env
UPLOAD_MAX_FILE_SIZE_BYTES=5242880
IMPORT_MAX_ROWS=5000
CSV_PREVIEW_ROW_LIMIT=20
CSV_MAX_RECORD_SIZE_BYTES=1048576
DEFAULT_PHONE_REGION=IN
```

Purpose:

- `UPLOAD_MAX_FILE_SIZE_BYTES`: rejects oversized CSV uploads.
- `IMPORT_MAX_ROWS`: prevents unbounded imports.
- `CSV_PREVIEW_ROW_LIMIT`: limits preview payload size.
- `CSV_MAX_RECORD_SIZE_BYTES`: prevents very large individual CSV records.
- `DEFAULT_PHONE_REGION`: used by backend phone normalization.

## AI Provider

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_real_gemini_key
GEMINI_MODEL=gemini-3.5-flash
OPENAI_API_KEY=
AI_MODEL=gpt-4.1-mini
AI_TEMPERATURE=0
```

Notes:

- Preview does not require an AI provider key.
- Confirming an import requires the key for the configured provider.
- Use `AI_PROVIDER=gemini` with `GEMINI_API_KEY` for Gemini.
- Use `AI_PROVIDER=openai` with `OPENAI_API_KEY` for OpenAI.
- Temperature is `0` for deterministic extraction.

## AI Batching And Resilience

```env
AI_BATCH_SIZE=25
AI_BATCH_CONCURRENCY=2
AI_MAX_RETRIES=2
AI_RETRY_BASE_DELAY_MS=1000
AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
AI_CIRCUIT_BREAKER_COOLDOWN_MS=30000
```

Runtime rules:

- `AI_BATCH_SIZE` is clamped to 20-50.
- `AI_MAX_RETRIES` is clamped to 0-2.
- Transient AI failures retry with backoff.
- Invalid structured output is retried at most once.
- Circuit breaker protects the service from repeated provider failures.

## Optional Tracing

```env
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
```

Enable only when you want LangSmith traces for AI workflow debugging.

## Recommended Reviewer Demo Values

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgres://groweasy:groweasy@localhost:5432/groweasy
UPLOAD_MAX_FILE_SIZE_BYTES=5242880
IMPORT_MAX_ROWS=5000
CSV_PREVIEW_ROW_LIMIT=20
CSV_MAX_RECORD_SIZE_BYTES=1048576
DEFAULT_PHONE_REGION=IN
AI_PROVIDER=gemini
GEMINI_API_KEY=your_real_gemini_key
GEMINI_MODEL=gemini-3.5-flash
OPENAI_API_KEY=
AI_MODEL=gpt-4.1-mini
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
