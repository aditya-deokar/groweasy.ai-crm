# AI Safety Operating Guide

This guide describes the shared AI safety layer for GrowEasy AI features. It is defense in depth, not a claim of complete security. Prompt injection cannot be made impossible, so production behavior must combine narrow prompts, input/output guardrails, schema validation, redacted telemetry, evals, budget limits, and conservative permissions.

## Scope

Current protected feature:

- CSV CRM import AI extraction

Shared components:

- Prompt registry and prompt builder
- Input guardrails
- Output guardrails
- Redaction and hashing helpers
- Provider run metadata
- AI model run and guardrail event tables
- Local deterministic eval runner

## Threat Model

Protected assets:

- System and developer prompts
- Provider API keys and tokens
- Raw CSV row data
- CRM records before persistence
- Import job and batch state
- Database write paths

Trust boundaries:

- Uploaded CSV files and edited skipped rows are untrusted user data.
- Model output is untrusted until schema validation, row reconciliation, normalizers, and output guardrails pass.
- Telemetry must be redacted by default and must not contain raw prompts, raw provider output, or full raw CSV rows.

Primary attack paths:

- Prompt injection embedded in names, notes, descriptions, or headers
- Attempts to reveal prompts, policies, or hidden instructions
- Obfuscated attacks using base64, hidden Unicode, markdown, or URLs
- Spreadsheet formula payloads in CSV input or model output
- Secret-like values accidentally uploaded in CSV files
- Provider malformed output, duplicated row IDs, missing rows, or extra rows

## Runtime Rules

- Build prompts through the versioned registry only.
- Prompt text must explicitly label user-provided data as untrusted.
- Run input guardrails before any provider call.
- Skip blocked rows with `AI_INPUT_GUARDRAIL_BLOCKED`.
- Audit warned rows but continue processing them.
- Run output guardrails after schema validation and row reconciliation.
- Never use model output for authorization, file paths, commands, dynamic database operations, or tool execution.
- Do not log raw prompts, raw provider output, full raw CSV rows, API keys, tokens, or provider response bodies.
- Store hashes, redacted previews, metrics, and rule IDs instead.
- `AI_DEBUG_STORE_RAW_PROMPTS` is forced off in production.

## Evals

Run local AI safety evals before merging AI changes:

```bash
npm run eval:ai:local
```

Write the latest report:

```bash
npm run eval:ai:report
```

Report path:

```text
evals/reports/latest.json
```

Required local gates:

- CRM prompt checksum matches the pinned prompt version.
- Prompt builder includes the untrusted-data boundary.
- High-risk injection fixtures are blocked.
- Benign fixtures are not blocked.
- Secret-like values are redacted from events and previews.
- Malformed or unsafe provider output fails closed.
- Row reconciliation rejects missing, duplicate, and unknown row IDs.

Live provider evals are optional release-candidate checks and must be explicitly enabled:

```bash
AI_EVAL_LIVE=true npm run eval:ai:live
```

## Adding A New AI Feature

1. Create a prompt version with a unique `promptId`, semantic date version, feature name, active flag, and checksum.
2. Add a prompt snapshot eval before wiring the provider.
3. Run input guardrails on every untrusted field before calling a provider.
4. Keep provider capabilities narrow; no file, command, database, browser, or network actions unless explicitly designed and authorized.
5. Validate model output with a strict schema and feature-specific reconciliation rules.
6. Run output guardrails before persistence or user-visible output.
7. Record `ai_model_runs` and `ai_guardrail_events` with redacted metadata only.
8. Add JSONL eval fixtures for golden, benign messy, injection, obfuscated, privacy, malformed output, and provider failure cases.
9. Add focused unit tests around the feature-specific validator and any persistence side effects.
10. Document rollback behavior and incident handling.

## Incident Checklist

When an AI safety issue is suspected:

1. Pause the affected AI feature or provider key if needed.
2. Preserve redacted `ai_model_runs` and `ai_guardrail_events`.
3. Do not copy raw prompts, raw provider bodies, or secrets into tickets.
4. Identify affected import IDs, batch IDs, prompt version, model, and rule IDs.
5. Add or update an eval fixture that reproduces the issue.
6. Patch the prompt, guardrail, validator, or workflow.
7. Run `npm run eval:ai:local`, relevant unit tests, and typecheck.
8. Rotate any exposed credentials if raw secrets may have reached a provider or log.
