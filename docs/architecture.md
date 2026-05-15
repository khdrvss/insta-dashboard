# Architecture

## Overview

InstaIntel uses a **monorepo** with a **two-backend architecture**: a Next.js 15 frontend (App Router) on Vercel handles UI + lightweight orchestration, while a FastAPI Python backend on Render handles heavy AI processing.

```
┌──────────────────────────────────────────────────┐
│                  Monorepo                         │
│  ┌─────────────┐  ┌────────────┐  ┌───────────┐ │
│  │   apps/web  │  │  apps/api  │  │ packages/ │ │
│  │  (Next.js)  │  │ (FastAPI)  │  │  ai, db   │ │
│  └──────┬──────┘  └─────┬──────┘  └───────────┘ │
└─────────┼───────────────┼────────────────────────┘
          │               │
          │    HTTP       │
          ├──────────────►│  AI Analysis
          │               │  Scraping
          │               │  Transcription
          │               │  Vector Search
     ┌────┴────┐     ┌───┴───┐
     │ Vercel  │     │ Render│
     └─────────┘     └───────┘
```

## Monorepo Structure (Turborepo)

```
instagram-dashboard/
├── apps/
│   ├── api/            # FastAPI Python backend
│   └── web/            # Next.js 15 frontend
├── packages/
│   ├── ai/             # Shared AI prompt templates
│   └── db/             # Prisma ORM + schema
├── turbo.json          # Turborepo pipeline
├── vercel.json         # Vercel deployment config
└── docker-compose.yml  # Local infra (Postgres, Redis, API)
```

### Workspace Dependencies

- `@instagram-dashboard/ai` — Prompt templates consumed by `apps/web` (via Anthropic SDK)
- `@instagram-dashboard/db` — Prisma client consumed by `apps/web`

## Two-Backend Communication

Next.js API routes call the FastAPI backend via HTTP:

```
Next.js Route Handler ──HTTP──► FastAPI
  Header: X-Internal-Secret     Header: X-Internal-Secret
```

- `API_BASE_URL` — FastAPI address (e.g. `http://localhost:8000`)
- `INTERNAL_API_SECRET` — Shared secret for inter-service auth
- FastAPI validates the secret on every internal request

## Data Flow (End-to-End)

```
1. Onboarding ──► DB (save niche, location, brand voice)
                        │
2. Meta OAuth  ──► Meta Graph API ──► DB (profile, posts)
                        │
3. Competitor Discovery ──► Apify + Ad Library ──► Claude AI filter ──► DB
                        │
4. Content Analysis ───► Fetch posts ──► Whisper transcribe ──► Claude analyze ──► Pinecone upsert
                        │
5. Insights     ────────► Display from DB + Pinecone
                        │
6. Script Generation ──► Claude (RAG with Pinecone patterns) ──► 3 variations
```

## Key Design Decisions

| Decision                      | Rationale                                                |
| ----------------------------- | -------------------------------------------------------- |
| **SQLite dev, Postgres prod** | Zero-config local dev via Prisma                         |
| **Mock mode toggle**          | Full frontend development without any API keys           |
| **No media storage**          | Audio/video processed then discarded (compliance + cost) |
| **7-day Redis cache**         | Avoid re-analyzing competitors too frequently            |
| **AI-estimated metrics**      | All competitor metrics are estimates (labeled as such)   |
| **Rate limiting**             | 10 req/min free, 60 req/min pro                          |
| **Async analysis**            | Heavy work offloaded to background worker                |
