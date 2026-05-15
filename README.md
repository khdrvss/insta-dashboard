# InstaIntel — Instagram Marketing Intelligence Dashboard

> "Tell me your niche — I'll find who's winning, why they're winning, and write better content for you."

AI-powered SaaS that discovers competitors, deep-analyzes their top-performing content, and generates original, high-converting Reels scripts and Meta Ads using Claude AI.

---

## Quick Start (Mock Data Mode — No API Keys Required)

```bash
# 1. Clone and install dependencies
cd instagram-dashboard
npm install

# 2. Set up environment
cp .env.example .env.local
# In .env.local, ensure: USE_MOCK_DATA=true

# 3. Start local database + Redis
docker-compose up -d postgres redis

# 4. Generate Prisma client and push schema
npm run db:generate
npm run db:push

# 5. Start all services
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

With `USE_MOCK_DATA=true`, all AI calls, scraping, and external APIs are bypassed. The full UI and database flow work using fixture data in `apps/api/mock/`.

---

## Full Setup (Production / Live APIs)

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker Desktop
- npm 10+

### Step 1: Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your keys (see `.env.example` for documentation on each):

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [clerk.com](https://clerk.com) → Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Same as above |
| `DATABASE_URL` | [supabase.com](https://supabase.com) → Settings → Database |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) |
| `GOOGLE_API_KEY` | [aistudio.google.com](https://aistudio.google.com) |
| `PINECONE_API_KEY` | [app.pinecone.io](https://app.pinecone.io) |
| `APIFY_API_TOKEN` | [apify.com](https://apify.com) |
| `META_APP_ID` + `META_APP_SECRET` | [developers.facebook.com](https://developers.facebook.com) |
| `STRIPE_SECRET_KEY` | [dashboard.stripe.com](https://dashboard.stripe.com) |

### Step 2: Database Setup

```bash
# Start local Postgres + Redis
docker-compose up -d postgres redis

# Generate Prisma client
cd packages/db
npm install
npx prisma generate
npx prisma migrate dev --name init

# Or push schema without migrations (faster for dev)
npx prisma db push
```

### Step 3: Python API Setup

```bash
cd apps/api

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start API server
uvicorn main:app --reload --port 8000
```

### Step 4: Next.js Frontend

```bash
cd apps/web
npm install
npm run dev
```

### Step 5: Or run everything with Turborepo

```bash
# From root
npm run dev
```

---

## Docker Compose (Full Local Stack)

```bash
# Start Postgres + Redis + FastAPI
docker-compose up

# In separate terminal: start Next.js
cd apps/web && npm run dev
```

Services:
- **PostgreSQL**: `localhost:5432` (user: postgres, password: postgres, db: instagram_dashboard)
- **Redis**: `localhost:6379` (password: redis_password)
- **FastAPI**: `http://localhost:8000`
- **Next.js**: `http://localhost:3000`

---

## Project Structure

```
instagram-dashboard/
├── apps/
│   ├── web/                    # Next.js 15 (App Router)
│   │   ├── app/
│   │   │   ├── (auth)/         # Sign in / Sign up (Clerk)
│   │   │   ├── dashboard/      # 5-tab dashboard
│   │   │   │   ├── page.tsx    # Tab 1: Your Profile
│   │   │   │   ├── competitors/ # Tab 2: Competitors
│   │   │   │   ├── analysis/    # Tab 3: Analysis
│   │   │   │   ├── insights/    # Tab 4: Content Insights
│   │   │   │   └── scripts/     # Tab 5: Script Generator
│   │   │   ├── onboarding/     # 3-step onboarding
│   │   │   └── api/            # Next.js API routes
│   │   ├── components/
│   │   │   └── dashboard/      # Sidebar, Header, StatCard, etc.
│   │   ├── lib/                # utils, api-client
│   │   └── mock/               # Mock JSON for generated scripts
│   │
│   └── api/                    # FastAPI Python backend
│       ├── routes/             # /auth /profile /competitors /analyze /scripts
│       ├── services/           # ai.py, scraper.py, script_generator.py, vector_search.py
│       ├── utils/              # cache.py (Redis), rate_limit.py
│       └── mock/               # competitors.json, video_analyses.json, ad_library.json
│
├── packages/
│   ├── db/                     # Prisma schema + client
│   │   └── prisma/schema.prisma
│   └── ai/                     # Shared prompt templates (versioned)
│       └── prompts/
│           ├── competitor-filter.ts
│           ├── video-analysis.ts
│           └── script-generation.ts
│
├── docker-compose.yml
├── .env.example
└── turbo.json
```

---

## Application Flow (End-to-End)

1. **Sign up** via Clerk → redirected to 3-step onboarding
2. **Onboarding**: enter niche, location, target audience, brand voice, products/services
3. **Dashboard Tab 1**: Connect Instagram Business account (Meta OAuth) or skip for mock
4. **Dashboard Tab 2**: Run AI competitor discovery → review + confirm list
5. **Dashboard Tab 3**: Trigger async content analysis → Whisper + Gemini + Claude extract patterns
6. **Dashboard Tab 4**: Browse extracted hooks, power phrases, trending audio
7. **Dashboard Tab 5**: Select goal/platform/length → Generate 3 script variations → Copy or export

---

## Mock Data Mode

Set `USE_MOCK_DATA=true` in `.env.local` to bypass all external APIs:

| Mock File | Contents |
|---|---|
| `apps/api/mock/competitors.json` | 10 realistic construction/renovation competitors in Tashkent with relevance scores |
| `apps/api/mock/video_analyses.json` | 5 analyzed Reels with full hooks, transcripts, engagement scores, niche summary |
| `apps/api/mock/ad_library.json` | 5 Meta Ad Library results with copy and page names |
| `apps/web/mock/generated_scripts.json` | 3 complete Reels scripts in construction niche |

---

## Compliance & Ethics

- **No ToS violations**: Never scrapes private Instagram endpoints directly
- **Official APIs first**: Meta Graph API for user data, Meta Ad Library for competitor ads
- **Apify only**: Third-party scraping uses Apify public Instagram actors — public profiles only, rate-limited
- **AI-estimated metrics**: Every competitor metric in the UI is labeled "AI-estimated based on public signals"
- **Original content only**: Scripts are structurally inspired by winning patterns, never verbatim copies
- **No long-term media storage**: Audio/video files are processed and discarded; only transcripts and metadata stored
- **7-day cache**: Analyzed competitor content cached for 7 days to minimize redundant API calls
- **Rate limiting**: 10 req/min free tier, 60 req/min pro tier on all AI endpoints

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| Backend | FastAPI (Python 3.11) |
| Database | Supabase (PostgreSQL) + Prisma ORM |
| Cache | Upstash Redis (7-day TTL for analyses) |
| Auth | Clerk |
| AI | Claude (claude-sonnet-4-20250514), Whisper, Gemini 1.5 Flash |
| Vector DB | Pinecone (niche content embeddings) |
| Scraping | Apify (ethical, public data only) |
| Payments | Stripe |
| Deployment | Vercel (web) + Render (API) + Supabase (DB) |

---

## Phase Implementation Status

- [x] **Phase 1**: Monorepo, Prisma schema, Clerk auth, Next.js layout + 5 dashboard tabs
- [x] **Phase 2**: Meta Graph API OAuth, post fetching, profile overview
- [x] **Phase 3**: Competitor discovery engine (hashtag search + Ad Library + Claude filter + confirm UI)
- [x] **Phase 4**: Content analysis engine (Apify + Whisper + Gemini + Pinecone + async workers)
- [x] **Phase 5**: RAG-powered insights (niche intelligence, power phrases, hook patterns)
- [x] **Phase 6**: Recharts dashboards (engagement trend, content format pie, competitor table)
- [x] **Phase 7**: Stripe billing, upgrade page, Vercel + Render deployment configs

---

## Deployment

### Frontend → Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# From project root
cd C:\Users\USER\instagram-dashboard
vercel --cwd apps/web

# Set environment variables in Vercel Dashboard
# (copy from .env.example — all NEXT_PUBLIC_ vars + server vars)
```

Or connect your GitHub repo in the Vercel dashboard and set root directory to `apps/web`.

**Required Vercel env vars:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL` (Supabase pooler URL)
- `DIRECT_URL` (Supabase direct URL)
- `ANTHROPIC_API_KEY`
- `API_BASE_URL` (your Render API URL, e.g. `https://instaintel-api.onrender.com`)
- `NEXT_PUBLIC_APP_URL` (your Vercel URL)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `INTERNAL_API_SECRET`

### Backend → Render

1. Push to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect repo → set root directory to `apps/api`
4. Render auto-detects `render.yaml`
5. Fill in env vars from `.env.example`
6. Deploy

### Database → Supabase

```bash
# Point DATABASE_URL to your Supabase project
# Then run migrations
cd packages/db
npx prisma migrate deploy
```

### Stripe Webhook

After deploying to Vercel, register the webhook in Stripe Dashboard:
- Endpoint: `https://your-vercel-url.vercel.app/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.deleted`

---

## API Reference (FastAPI)

Base URL: `http://localhost:8000`

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check + mock mode status |
| `/competitors/discover` | POST | Run competitor discovery |
| `/competitors/mock` | GET | Return mock competitor data |
| `/analyze/start` | POST | Start async content analysis job |
| `/analyze/job/{id}` | GET | Poll job status |
| `/analyze/mock/video-analyses` | GET | Mock video analysis data |
| `/analyze/mock/niche-summary` | GET | Mock niche intelligence summary |
| `/scripts/generate` | POST | Generate 3 script variations |

---

## Scripts Reference

```bash
npm run dev          # Start all services (Turborepo)
npm run build        # Build all packages
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to DB (no migration)
npm run db:migrate   # Create and apply migration
npm run db:studio    # Open Prisma Studio
npm run type-check   # TypeScript check all packages
```

---

*All competitor metrics are AI-estimated based on publicly available signals. Not affiliated with Meta, Instagram, or any third-party platforms mentioned.*
