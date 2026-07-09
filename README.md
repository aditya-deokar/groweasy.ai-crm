<div align="center">

# 🚀 GrowEasy AI CRM Importer

**AI-powered CSV lead importer that intelligently maps any CSV format into structured CRM records**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://groweasy-ai-crm.vercel.app/import)
[![GitHub](https://img.shields.io/badge/Source_Code-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/aditya-deokar/groweasy.ai-crm)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-70_Passed-brightgreen?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![AI Evals](https://img.shields.io/badge/AI_Evals-13/13_Passed-brightgreen?style=for-the-badge)](./server/evals)

---

Upload messy CSVs from **any source** — Facebook Leads, Google Ads, Excel sheets, real estate CRMs, sales reports — and let AI extract structured CRM leads with validation, guardrails, and full audit trails.

</div>

---

## 🏅 Beyond the Assignment — Extra Work I Did

> This project goes **significantly beyond** the assignment requirements. The table below shows what was asked, what bonus items I completed, and the production-grade features I added on my own.

### ✅ Assignment Requirements (All Completed)

| Requirement | What I Built |
|-------------|-------------|
| Upload a CSV file | Drag & drop + file picker with MIME/size/extension validation |
| Preview uploaded rows in a table | Local browser-side preview (PapaParse) + server-side validated preview — both with responsive tables, sticky headers, horizontal scroll |
| Confirm button before AI processing | Multi-step stepper UI with explicit confirm action |
| AI extraction into CRM format | LangGraph state machine with bounded batching, Zod schema validation, row reconciliation, and CRM field normalization |
| Display parsed results (imported/skipped) | Tabbed results view with imported records table, skipped records table, counts, and download actions |
| Backend API to accept and parse CSV | Full REST API with 12 endpoints, standard response envelope, request IDs, and Zod request validation |

### 🏆 Bonus Features (All Implemented)

| Bonus Feature (from Assignment) | Status |
|--------------------------------|--------|
| Drag & Drop upload | ✅ `react-dropzone` with file validation |
| Progress indicators during AI processing | ✅ Real-time polling every 2s with progress bar + batch status |
| Retry mechanism for failed AI batches | ✅ RetryPolicy with jittered delays + user-facing retry button |
| Dark mode | ✅ Full theme toggle via `next-themes` |
| Unit tests | ✅ **70 tests** across 24 test files |
| Docker setup | ✅ `docker-compose.yml` for PostgreSQL |
| Deployment (Vercel/Railway/Render) | ✅ Both frontend + backend deployed on **Vercel** |
| Well-written README | ✅ This document |

### 🚀 Extra Production Features (Not Required — Added by Me)

These features were **not asked** in the assignment. I added them to demonstrate production-grade engineering:

#### Frontend — Extra Features
| Feature | Why I Added It |
|---------|---------------|
| **Cancel mid-import** | Real users need to abort long-running imports |
| **Edit imported records** | AI extraction isn't perfect — users need to correct fields |
| **Correct & reimport skipped rows** | Skipped rows shouldn't be dead ends — let users fix and retry |
| **CSV download (imported + skipped)** | Users need to export data for their own records |
| **Import history page** | Production apps need audit trails, not one-shot uploads |
| **Leads management dashboard** | Full CRM view with search, status/source filters, pagination, edit, delete |
| **Import source cards** | UI ready for Google Ads, Facebook, LinkedIn (CSV active) |
| **Failed batch visibility** | Show exactly which AI batches failed and why |
| **Typed API client** | Zod-validated response parsing — not blind `fetch().json()` |

#### Backend — Extra Architecture & Reliability
| Feature | Why I Added It |
|---------|---------------|
| **Four-layer clean architecture** | Separates business logic from frameworks — testable and maintainable |
| **Dependency injection container** | Modular wiring — swap providers without touching use cases |
| **LangGraph state machine** | Orchestrates complex multi-batch workflows with state transitions |
| **Multi-provider AI (Gemini + OpenAI)** | Provider-agnostic via adapters — switch with one env var |
| **Circuit breaker** | Prevents cascading failures when AI provider is down |
| **Concurrent import limiter** | Queues overflow imports instead of crashing the server |
| **Pre-AI row validation + dedup** | Saves AI tokens by filtering invalid/duplicate rows before calling AI |
| **Row index reconciliation** | Verifies AI output maps exactly to input rows — rejects mismatches |
| **CRM field normalization** | Server-side email, phone, date, status, source, notes cleaning |
| **Health/liveness/readiness endpoints** | Production-ready for container orchestration (K8s, ECS) |
| **Graceful shutdown** | Clean teardown on SIGTERM/SIGINT |
| **Structured logging (Pino)** | JSON logs with request IDs for observability |
| **Zod environment validation** | Fail-fast on bad config at startup |
| **Standard API response envelope** | Consistent `{ success, data, error, meta.requestId, timestamp }` |

#### AI Safety — Extra Guardrails (Not Required)
| Feature | Why I Added It |
|---------|---------------|
| **Input guardrails** | Block prompt injection, jailbreaks, formula payloads, hidden chars, base64 obfuscation before AI calls |
| **Output guardrails** | Reject prompt leakage, tool injection, formula output from AI responses |
| **Token/cell/row budgets** | Prevent oversized inputs from reaching AI — cost and safety control |
| **Versioned prompt with checksum** | Prompt changes are tracked; checksum tested in CI |
| **Redacted telemetry** | Raw prompts/outputs never exposed via public APIs |
| **Guardrail audit log** | All safety decisions persisted in `ai_guardrail_events` table |
| **Fail-closed behavior** | Unsafe AI output is rejected, not silently passed through |

#### Database — Extra Persistence (Assignment Said Optional)
| Feature | Why I Added It |
|---------|---------------|
| **9-table PostgreSQL schema** | Full data model — not just CRM records but import jobs, batches, events, AI runs, guardrail events |
| **Drizzle ORM + migrations** | Type-safe schema with version-controlled migrations |
| **AI model run tracking** | Model name, tokens used, latency, outcome per AI call |

#### Testing — Extra Verification
| Feature | Why I Added It |
|---------|---------------|
| **13 AI guardrail evals** | Deterministic eval fixtures testing input/output safety |
| **Integration tests** | Provider failure → retry → success flow tested end-to-end |
| **4 documentation files** | API Contract, Environment, AI Safety, Demo Guide |

---

## 📑 Table of Contents

- [Features](#-features)
- [Beyond the Assignment](#-beyond-the-assignment--extra-work-i-did)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [AI Design & Safety](#-ai-design--safety)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [License](#-license)

---

## ✨ Features

### Frontend
- **Drag & Drop Upload** — Intuitive file upload with validation via `react-dropzone`
- **Local CSV Preview** — Browser-side parsing with PapaParse before server upload
- **Multi-Step Import Workflow** — Upload → Review → Processing → Results stepper UI
- **Real-Time Progress** — Live polling of backend processing status every 2 seconds
- **Retry Failed Batches** — See which AI batches failed and retry them individually
- **Cancel Mid-Import** — Stop processing at any point
- **Edit Imported Records** — Correct AI-extracted fields through an edit modal
- **Correct & Reimport Skipped Rows** — Fix validation issues and reimport
- **CSV Download** — Export imported and skipped records
- **Import History** — View all past imports with infinite scroll pagination
- **Leads Management** — Full CRM dashboard with search, status/source filters, edit, and delete
- **Dark Mode** — Complete theme support via `next-themes`
- **Responsive Design** — Mobile-first with sticky headers and horizontal scrolling tables

### Backend
- **Clean Four-Layer Architecture** — Presentation → Application → Domain → Infrastructure
- **Bounded AI Batching** — CSV rows split into 20–50 row batches, never full file
- **LangGraph State Machine** — Orchestrates AI batch processing workflow
- **Multi-Provider AI** — Gemini (JSON schema) + OpenAI (LangChain structured output)
- **Strict Schema Validation** — Every AI output validated with Zod schemas
- **Row Index Reconciliation** — AI output mapped back to exact original CSV row
- **CRM Field Normalization** — Email, phone, dates, status, source, notes cleaned server-side
- **Retry Policy** — Jittered exponential backoff for transient AI failures
- **Circuit Breaker** — Prevents cascading provider failures
- **Concurrent Import Limiter** — Queues overflow when max concurrent imports reached
- **Versioned Prompt Registry** — Prompt ID + SHA-256 checksum pinned and tested
- **Health Endpoints** — `/health`, `/health/live`, `/health/ready`
- **Security Hardened** — Helmet, CORS, rate limiting, request IDs

### AI Security & Guardrails
- **Input Guardrails** — Block prompt injection, jailbreaks, formula payloads, hidden characters, obfuscated base64, suspicious URLs
- **Output Guardrails** — Reject prompt leakage, tool/command injection, formula output, secret-like values
- **Token Budgets** — Max cell size, row size, and batch token limits enforced before AI calls
- **Redacted Telemetry** — Raw prompts and AI outputs never exposed via public APIs
- **Guardrail Audit Log** — All safety decisions persisted with hashes and redacted previews
- **Fail-Closed** — Unsafe AI output is rejected, not silently passed through

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Next.js 16 Client                        │
│  Upload → Local Preview → Server Validation → AI Processing     │
│  → Results → Edit/Retry/Download → History → Lead Management    │
└──────────────────────┬───────────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼───────────────────────────────────────────┐
│                     Express 5 Backend                            │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Presentation│→ │ Application  │→ │  Domain  │← │ Infra    │ │
│  │ Routes      │  │ Use Cases    │  │ Entities │  │ DB, AI,  │ │
│  │ Controllers │  │ Orchestration│  │ Ports    │  │ CSV,     │ │
│  │ Validation  │  │ Processor    │  │ Rules    │  │ Upload   │ │
│  └─────────────┘  └──────────────┘  └──────────┘  └──────────┘ │
│                                                                  │
│  ┌───────────────┐  ┌────────────────┐  ┌──────────────────┐    │
│  │ LangGraph     │  │ Input/Output   │  │ Retry + Circuit  │    │
│  │ AI Workflow   │  │ Guardrails     │  │ Breaker          │    │
│  └───────┬───────┘  └────────────────┘  └──────────────────┘    │
│          │                                                       │
│  ┌───────▼───────┐  ┌────────────────┐                          │
│  │ Gemini/OpenAI │  │ PostgreSQL     │                          │
│  │ Providers     │  │ (Drizzle ORM)  │                          │
│  └───────────────┘  └────────────────┘                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, shadcn/ui, React Query, TanStack Table, PapaParse, react-dropzone, Sonner, Lucide Icons |
| **Backend** | Node.js, Express 5, TypeScript 6, Zod 4, Pino, Helmet, CORS, multer, csv-parse, dayjs, nanoid, p-limit |
| **AI** | LangChain, LangGraph, Google Gemini, OpenAI, libphonenumber-js |
| **Database** | PostgreSQL, Drizzle ORM, drizzle-kit (migrations) |
| **Testing** | Vitest, Supertest, custom AI eval framework |
| **DevOps** | Docker Compose, Vercel, ESLint, Prettier |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** 15+ (or Docker)
- **AI API Key** — Google Gemini or OpenAI

### 1. Clone the repository

```bash
git clone https://github.com/aditya-deokar/groweasy.ai-crm.git
cd groweasy.ai-crm
```

### 2. Start the database

```bash
cd server
docker compose up -d
```

### 3. Set up the backend

```bash
cd server
cp .env.example .env
# Edit .env with your database URL and AI API key
npm install
npm run db:push        # Apply schema to database
npm run dev            # Start dev server on http://localhost:3001
```

### 4. Set up the frontend

```bash
cd client
cp .env.example .env.local
# Edit .env.local with your backend URL
pnpm install
pnpm dev               # Start dev server on http://localhost:3000
```

### 5. Verify the setup

```bash
# Backend health check
curl http://localhost:3001/health

# Run backend tests
cd server && npm test

# Run AI evals
cd server && npm run eval:ai:local
```

---

## 🔐 Environment Variables

### Backend (`server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:3000` |
| `AI_PROVIDER` | AI provider (`gemini` or `openai`) | `gemini` |
| `GOOGLE_API_KEY` | Google Gemini API key | — |
| `OPENAI_API_KEY` | OpenAI API key | — |
| `AI_MODEL_NAME` | Model name | `gemini-2.0-flash` |
| `AI_BATCH_SIZE` | Rows per AI batch (20–50) | `25` |
| `AI_MAX_RETRIES` | Max retries per batch | `3` |
| `AI_MAX_CONCURRENT_IMPORTS` | Concurrent import limit | `3` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

### Frontend (`client/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` |

> See [`server/docs/ENVIRONMENT.md`](./server/docs/ENVIRONMENT.md) for the complete reference.

---

## 📡 API Reference

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | System health check |
| `GET` | `/health/live` | Liveness probe |
| `GET` | `/health/ready` | Readiness probe |

### Imports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/imports/preview` | Upload CSV, validate, return preview |
| `POST` | `/api/v1/imports/:id/confirm` | Start AI processing |
| `GET` | `/api/v1/imports/:id/status` | Poll processing progress |
| `GET` | `/api/v1/imports/:id/result` | Get imported + skipped records |
| `POST` | `/api/v1/imports/:id/retry-failed` | Retry failed AI batches |
| `POST` | `/api/v1/imports/:id/cancel` | Cancel active import |
| `PATCH` | `/api/v1/imports/:id/records/:rowIndex` | Edit an imported record |
| `POST` | `/api/v1/imports/:id/skipped/:rowIndex/reimport` | Reimport a skipped row |
| `GET` | `/api/v1/imports/history` | List import history |

### Leads

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/leads` | List leads with search, filter, pagination |
| `PATCH` | `/api/v1/leads/:id` | Update a lead |
| `DELETE` | `/api/v1/leads/:id` | Delete a lead |

**Response Envelope:**

```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... },
  "meta": { "requestId": "abc-123" },
  "timestamp": "2026-07-09T12:00:00Z"
}
```

> See [`server/docs/API_CONTRACT.md`](./server/docs/API_CONTRACT.md) for request/response schemas.

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `import_jobs` | Import metadata, status, file info, row counts |
| `import_rows` | Raw CSV row data with text hashes for dedup |
| `import_batches` | AI batch state, retry count, token usage |
| `crm_import_records` | Normalized CRM lead records |
| `crm_skipped_records` | Skipped rows with reasons and raw data |
| `import_events` | User-facing and internal lifecycle events |
| `ai_prompt_versions` | Prompt version history with checksums |
| `ai_model_runs` | Per-call model, tokens, latency, outcome |
| `ai_guardrail_events` | Safety decision audit trail |

---

## 🛡️ AI Design & Safety

### Extraction Pipeline

```
CSV Rows → Input Guardrails → Token Budget Check → AI Provider
→ Zod Schema Validation → Row Index Reconciliation → Output Guardrails
→ CRM Normalization → Persist Records
```

### Security Layers

| Layer | What It Catches |
|-------|----------------|
| **Input Guardrails** | Prompt injection, jailbreaks, formula payloads (`=CMD()`), hidden unicode, obfuscated base64, suspicious URLs, secret-like values |
| **Token Budgets** | Oversized cells, rows, and batches rejected before AI call |
| **Schema Validation** | AI output must match strict Zod schemas — no extra fields, no missing fields |
| **Row Reconciliation** | Output row indexes must exactly match input — duplicates and unknowns rejected |
| **Output Guardrails** | Prompt leakage, tool/command injection, formula output, secret-like values |
| **Telemetry Security** | Raw prompts and AI outputs never returned through public APIs |

> See [`server/docs/AI_SAFETY.md`](./server/docs/AI_SAFETY.md) for the complete AI security design.

---

## 🧪 Testing

### Run all tests

```bash
cd server

# Unit + Integration tests
npm test                    # 70 tests across 24 files

# AI guardrail evals
npm run eval:ai:local       # 13/13 deterministic evals

# Type checking
npm run typecheck           # Backend
cd ../client && pnpm typecheck  # Frontend

# Linting
cd ../server && npm run lint
cd ../client && pnpm lint
```

### Test Coverage

| Category | Tests | Areas Covered |
|----------|-------|---------------|
| **Unit** | 70 | Domain validation, CRM normalization, CSV parsing, batch planning, retry policy, circuit breaker, AI adapters, guardrails, reconciliation, request validation, error handling |
| **Integration** | 2 files | Health endpoints, import resilience (provider failure → retry → success) |
| **AI Evals** | 13 | Prompt checksum, benign input/output, prompt injection blocked, jailbreak blocked, formula blocked, hidden chars warned, secret detection, base64 injection blocked |

---

## 🚢 Deployment

### Vercel (Current)

Both frontend and backend are deployed on Vercel:

- **Frontend:** Automatic Next.js deployment
- **Backend:** Serverless Express via `vercel.json`
- **Database:** Neon PostgreSQL (serverless Postgres)

### Docker (Local/Self-hosted)

```bash
# Start PostgreSQL
cd server
docker compose up -d

# Build and run backend
npm run build
npm start

# Build and run frontend
cd ../client
pnpm build
pnpm start
```

---

## 📁 Project Structure

```
groweasy.ai-crm/
├── client/                          # Next.js 16 Frontend
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── import/page.tsx      # CSV import workbench
│   │   │   ├── import/history/      # Import history page
│   │   │   └── leads/page.tsx       # Lead management dashboard
│   │   ├── layout.tsx               # Root layout with providers
│   │   └── globals.css              # Design tokens + Tailwind
│   ├── components/
│   │   ├── import/                  # 13 import-specific components
│   │   ├── layout/                  # Sidebar, topbar, dashboard shell
│   │   ├── ui/                      # Reusable shadcn/Radix primitives
│   │   └── providers/               # React Query, theme providers
│   ├── hooks/
│   │   ├── use-csv-parser.ts        # Browser-side CSV parsing
│   │   └── use-import-session.ts    # Import state machine + API orchestration
│   └── lib/
│       ├── api-client.ts            # Typed API envelope parser
│       ├── imports/                  # Import API client + contracts
│       └── leads/                   # Lead API client
│
├── server/                          # Express 5 Backend
│   ├── src/
│   │   ├── app.ts                   # Express app composition
│   │   ├── routes.ts                # API router
│   │   ├── container.ts             # Dependency injection
│   │   ├── config/                  # Env, CORS, rate limit, logger, security
│   │   ├── db/
│   │   │   └── schema.ts           # Drizzle/Postgres schema (9 tables)
│   │   ├── modules/
│   │   │   ├── health/             # Health/liveness/readiness
│   │   │   ├── imports/            # Core import module
│   │   │   │   ├── presentation/   # Routes, controller, request schemas
│   │   │   │   ├── application/    # Use cases, import processor
│   │   │   │   ├── domain/         # Entities, ports, validation, normalizer
│   │   │   │   └── infrastructure/ # DB repo, CSV, upload, AI, LangGraph
│   │   │   └── leads/             # Lead CRUD module
│   │   └── shared/
│   │       ├── presentation/       # Response envelope, middleware
│   │       ├── infrastructure/     # AI safety, resilience, logging
│   │       └── domain/             # App errors, validation errors
│   ├── tests/
│   │   ├── unit/                   # 24 test files
│   │   ├── integration/            # Health + resilience tests
│   │   └── fixtures/               # Realistic CSV test data
│   ├── evals/
│   │   ├── fixtures/               # AI guardrail eval JSONL
│   │   ├── scripts/                # Local + live eval runners
│   │   └── reports/                # Latest eval results
│   ├── docs/                       # API, env, demo, AI safety docs
│   ├── drizzle/migrations/         # Database migrations
│   └── docker-compose.yml          # PostgreSQL container
│
└── README.md                       # This file
```

---

## 🔮 Future Improvements

- Authentication and tenant-level authorization
- Queue-backed worker system (BullMQ) for import processing
- Object storage for uploaded CSV files
- OpenTelemetry distributed tracing
- Playwright end-to-end tests
- CSV column mapping UI for enterprise users
- Role-based access control
- Human review queue for low-confidence AI imports

---

## 📄 License

This project was built as a technical assignment for [GrowEasy](https://groweasy.ai).

---

<div align="center">

**Built with ❤️ by [Aditya Deokar](https://github.com/aditya-deokar)**

</div>
