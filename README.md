# InstaIntel — Instagram Marketing Intelligence Dashboard

> Raqobatchilaringizni toping. Ularning sirlari ustida ustunlik qiling. Uzbekistonda g'olib content yarating.

AI-powered Instagram intelligence platform for **Uzbek real estate** businesses. Discovers competitors, deep-analyzes their top-performing content, and generates ready-to-publish **Uzbek-language** video scripts for Reels and Meta Ads.

Built for [buston.village](https://buston.village) — a premium cottage village project near Tashkent.

---

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add OPENROUTER_API_KEY and APIFY_API_TOKEN in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with passphrase `19801980`.

No Docker. No Redis. No Python. No Clerk needed in development.

---

## Tech Stack

| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| Frontend     | Next.js 15 (App Router), TypeScript, Tailwind   |
| Backend      | Next.js API Routes (no separate service)        |
| Database     | SQLite + Prisma ORM                             |
| AI           | OpenRouter → Gemini 2.5 Flash / 2.0-flash-001  |
| Scraping     | Apify (instagram-hashtag-scraper, instagram-scraper) |
| Auth (dev)   | Passphrase cookie (`19801980`)                  |
| Auth (prod)  | Clerk                                           |
| Export       | `docx` npm package (client-side .docx)         |
| Payments     | Stripe                                          |
| Deployment   | Vercel                                          |

**NOT used:** FastAPI · Redis · Pinecone · Whisper · Anthropic/Claude · Postgres (dev)

---

## Project Structure

```
insta-dashboard/
├── apps/
│   └── web/                        # Next.js 15 — all logic lives here
│       ├── app/
│       │   ├── api/                # All API routes
│       │   │   ├── analyze/        # start + results + [jobId]
│       │   │   ├── competitors/    # discover + confirm + [id]
│       │   │   ├── scripts/        # generate
│       │   │   ├── profile/        # user + posts
│       │   │   └── auth/instagram/ # Meta OAuth callback
│       │   └── dashboard/
│       │       ├── layout.tsx      # DashboardProviders wraps everything
│       │       ├── DashboardProviders.tsx  # ScriptsProvider client boundary
│       │       ├── page.tsx        # Tab 1: Profilingiz
│       │       ├── competitors/    # Tab 2: Raqobatchilar
│       │       ├── analysis/       # Tab 3: Tahlil (Uzbek analysis)
│       │       ├── insights/       # Tab 4: Tushunchalar
│       │       └── scripts/        # Tab 5: Skript generator
│       ├── components/dashboard/   # Sidebar · Header · cards · charts
│       └── lib/
│           ├── scripts-context.tsx # ScriptsContext — navigation-persistent generation
│           ├── mock-auth.ts        # Passphrase auth helper
│           ├── export-script-docx.ts
│           └── i18n/               # uz/en translations
│
├── packages/
│   ├── ai/prompts/                 # Prompt builders (competitor-filter, video-analysis, script-generation)
│   └── db/prisma/                  # Prisma schema + singleton client
│
└── turbo.json
```

---

## Application Flow

1. **Sign in** with passphrase → cookie set
2. **Onboarding**: niche, location, brand voice, target audience
3. **Raqobatchilar**: Run discovery → Apify scrapes Uzbek real estate hashtags → Gemini filters (score ≥ 70) → confirm list
4. **Tahlil**: Run analysis → Apify scrapes competitor posts → Gemini analyzes each → Uzbek dashboard
5. **Tushunchalar**: Auto-computed niche summary from DB data (no extra AI tokens)
6. **Skriptlar**: Set goal/platform/length/tone → Generate → 3 Uzbek scripts → copy or download .docx

---

## Environment Variables

```env
# Required for live features
OPENROUTER_API_KEY=sk-or-...
APIFY_API_TOKEN=apify_api_...

# Optional overrides
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
SCRIPT_MODEL=google/gemini-2.0-flash-001
PASSPHRASE=19801980
USE_MOCK_DATA=false

# Production only (Clerk auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Stripe (optional)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
```

---

## Documentation

Full documentation in [`docs/`](docs/):

| Doc                                  | Description                                              |
| ------------------------------------ | -------------------------------------------------------- |
| [Architecture](docs/architecture.md) | System design, data flow, design decisions               |
| [Flows & Diagrams](docs/flows.md)    | Mermaid diagrams for all key pipelines                   |
| [Logic Reference](docs/logic.md)     | Every API route, component, and utility explained        |
| [API Reference](docs/api.md)         | All API routes with request/response shapes              |
| [Database Schema](docs/database.md)  | Prisma models and relationships                          |

---

## Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to SQLite
npm run db:studio    # Open Prisma Studio
npm run type-check   # TypeScript check
```

---

*All competitor metrics are AI-estimated from publicly available signals. Not affiliated with Meta, Instagram, or any third parties mentioned.*
