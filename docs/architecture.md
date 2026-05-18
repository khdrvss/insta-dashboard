# Architecture

## Overview

InstaIntel is a **single-backend monorepo** — a Next.js 15 App Router application with all AI, scraping, and data logic inside Next.js API routes. There is no separate Python/FastAPI service.

```
┌──────────────────────────────────────────────────────────────┐
│                       Browser (React)                        │
│  Dashboard UI (Uzbek) · ScriptsContext · i18n (uz/en)       │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP
┌──────────────────────▼───────────────────────────────────────┐
│                   Next.js 15 (Vercel)                        │
│  App Router · API Routes · Server Components                 │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  /api/comp.. │  │ /api/analyze │  │ /api/scripts/..  │  │
│  │  etitors/..  │  │  /results    │  │    /generate     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          │                 │                   │
    ┌─────▼─────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │  Apify    │    │  SQLite DB  │    │  OpenRouter  │
    │ (scraping)│    │  (Prisma)   │    │  (Gemini AI) │
    └───────────┘    └─────────────┘    └─────────────┘
```

## Monorepo Structure (Turborepo)

```
insta-dashboard/
├── apps/
│   └── web/                    # Next.js 15 frontend + all API routes
│       ├── app/
│       │   ├── api/            # All server-side logic lives here
│       │   │   ├── analyze/
│       │   │   ├── competitors/
│       │   │   └── scripts/
│       │   └── dashboard/      # UI pages
│       ├── components/         # React components
│       └── lib/                # Client utilities, contexts, i18n
├── packages/
│   ├── ai/                     # AI prompt templates (TypeScript)
│   └── db/                     # Prisma ORM + SQLite schema
└── turbo.json
```

### Workspace Dependencies

- `@instagram-dashboard/ai` — Prompt builders consumed by Next.js API routes (via OpenRouter)
- `@instagram-dashboard/db` — Prisma client singleton, consumed by all API routes

## AI Provider

All AI calls go through **OpenRouter** (OpenAI-compatible API) using two models:

| Task                  | Model                         | Reason                              |
| --------------------- | ----------------------------- | ----------------------------------- |
| Competitor filtering  | `google/gemini-2.5-flash`     | Complex reasoning, strict JSON      |
| Post analysis         | `google/gemini-2.5-flash`     | Detailed extraction per post        |
| Script generation     | `google/gemini-2.0-flash-001` | Cheaper, faster, great Uzbek output |

Environment variables:
```
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
SCRIPT_MODEL=google/gemini-2.0-flash-001   # optional override
```

## Data Flow (End-to-End)

```
1. Auth
   Browser → /sign-in → passphrase "19801980" → httpOnly cookie session=authenticated

2. Onboarding
   Form → POST /api/user/onboard → Prisma upsert(User)

3. Competitor Discovery
   POST /api/competitors/discover
     └── buildRealEstateTags() → ["uysotuv", "kotedj", ...]
     └── Apify instagram-hashtag-scraper → raw candidates
     └── buildCompetitorFilterPrompt() → OpenRouter (Gemini 2.5)
     └── Parse JSON, score ≥ 70 → save to DB (confirmed=false)

4. Competitor Confirmation
   POST /api/competitors/confirm → DB update (confirmed=true)

5. Content Analysis
   POST /api/analyze/start
     └── For each confirmed competitor:
         Apify instagram-scraper → posts
         buildVideoAnalysisPrompt() → OpenRouter (Gemini 2.5) per post
         Save VideoAnalysis to DB

6. Results / Insights
   GET /api/analyze/results
     └── Read from DB, aggregate computationally
     └── buildNicheSummary() — pure DB math, no AI tokens

7. Script Generation
   POST /api/scripts/generate (via ScriptsContext)
     └── keepalive: true, AbortController
     └── buildScriptGenerationPrompt() → OpenRouter (Gemini 2.0-flash-001)
     └── JSON.parse scripts → DB persist (fire-and-forget)
     └── Return 3 Uzbek script variations

8. Export
   Client-side: downloadScriptAsDocx() → .docx file
```

## Key Design Decisions

| Decision                        | Rationale                                                         |
| ------------------------------- | ----------------------------------------------------------------- |
| **No separate Python backend**  | Next.js API routes handle all AI + scraping — simpler, 1 deploy  |
| **SQLite (Prisma)**             | Zero-config local dev; arrays stored as JSON strings in TEXT cols |
| **ScriptsContext at layout**    | Generation persists across page navigation                        |
| **keepalive: true on fetch**    | HTTP connection stays open even if user navigates away            |
| **7-day competitor cache**      | DB-level cache via `createdAt` check — no Redis needed            |
| **JSON.stringify for arrays**   | Prisma SQLite doesn't support native array columns                |
| **Gemini 2.0-flash for scripts**| Cheaper per-token, excellent Uzbek (Latin script) quality        |
| **Score ≥ 70 for competitors**  | Strict threshold to exclude non-real-estate accounts              |
| **Uzbek-first UI**              | Target users are Uzbek-speaking real estate marketers             |
| **Mock auth (passphrase)**      | No Clerk needed for development — fast iteration                  |

## React State Architecture

```
DashboardLayout
└── DashboardProviders (client)
    └── ScriptsProvider (ScriptsContext)
        ├── Sidebar            ← reads loading state → shows spinner
        ├── Header
        └── {children}
            ├── ScriptsPage    ← reads/writes all generation state
            ├── AnalysisPage
            └── ...other pages
```

`ScriptsContext` holds: `scripts`, `loading`, `error`, `goal`, `platform`, `lengthSecs`, `tone`, `generate()`. This means clicking "Generate" on `/dashboard/scripts`, navigating to `/dashboard`, and coming back still shows the results.

## Database (SQLite via Prisma)

**Important:** SQLite TEXT columns store arrays/objects as JSON strings. All code that reads from DB must `JSON.parse()` the field. All code that writes must `JSON.stringify()`.

```typescript
// Writing
await prisma.post.create({ data: { hashtags: JSON.stringify(tags) } })

// Reading
const tags = JSON.parse(post.hashtags ?? "[]")
```

Key models: `User` · `Competitor` · `Post` · `VideoAnalysis` · `GeneratedScript` · `AiUsageLog`
