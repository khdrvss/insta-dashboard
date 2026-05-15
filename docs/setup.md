# Setup & Installation

## Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- **Python** >= 3.11 (for FastAPI backend)
- **Docker** (optional, for Postgres + Redis)

## Quick Start (Mock Mode — No API Keys Required)

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env.local

# 3. (Optional) Set up Python backend for AI features
cd apps/api
pip install -r requirements.txt
cd ../..

# 4. Start development
npm run dev
```

The app starts in **mock mode** by default (`USE_MOCK_DATA=true`). All external services (Claude, Whisper, Apify, Stripe, etc.) are bypassed. Visit `http://localhost:3000`.

## Environment Variables

### Core Configuration

| Variable              | Default                 | Description                  |
| --------------------- | ----------------------- | ---------------------------- |
| `USE_MOCK_DATA`       | `true`                  | Bypass all external APIs     |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | App base URL                 |
| `API_BASE_URL`        | `http://localhost:8000` | FastAPI URL                  |
| `INTERNAL_API_SECRET` | `dev-internal-secret`   | Web-to-API auth              |
| `DATABASE_URL`        | `file:./dev.db`         | SQLite (dev) or Postgres URL |

### Required for Live Mode

| Service                | Variables Needed                                        | Getting Started                                    |
| ---------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| **Auth**               | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | [Clerk Dashboard](https://dashboard.clerk.com)     |
| **AI Analysis**        | `ANTHROPIC_API_KEY`                                     | [Anthropic Console](https://console.anthropic.com) |
| **Transcription**      | `OPENAI_API_KEY`                                        | [OpenAI Platform](https://platform.openai.com)     |
| **Instagram Scraping** | `APIFY_API_TOKEN`                                       | [Apify Console](https://console.apify.com)         |
| **Meta OAuth**         | `META_APP_ID`, `META_APP_SECRET`                        | [Meta Developers](https://developers.facebook.com) |
| **Vector Search**      | `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`               | [Pinecone Console](https://www.pinecone.io)        |
| **Payments**           | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`            | [Stripe Dashboard](https://dashboard.stripe.com)   |
| **Caching**            | `REDIS_URL` or `UPSTASH_REDIS_REST_URL`                 | [Upstash](https://upstash.com) or local Docker     |
| **Error Tracking**     | `NEXT_PUBLIC_SENTRY_DSN`                                | [Sentry](https://sentry.io)                        |

See [`ENV_KEYS_NEEDED.txt`](../ENV_KEYS_NEEDED.txt) for detailed step-by-step instructions on obtaining each key.

## Docker Setup (Postgres + Redis + API)

```bash
docker-compose up -d
```

This starts:

- **Postgres 16** on port 5432 (`postgres/postgres`, database `instagram_dashboard`)
- **Redis 7** on port 6379 (password: `redis_password`)
- **FastAPI** on port 8000 (hot-reload enabled)

## Installing Dependencies

### All at once

```bash
npm install                          # Root + workspaces
cd apps/api && pip install -r requirements.txt
```

### Individual workspaces

```bash
npm install --workspace=@instagram-dashboard/web
npm install --workspace=@instagram-dashboard/ai
npm install --workspace=@instagram-dashboard/db
```

## Database Setup

### Dev (SQLite — zero config)

The SQLite database at `packages/db/dev.db` works immediately. Schema is auto-applied on first use.

```bash
npm run db:push     # Push schema to DB
npm run db:studio   # Open Prisma Studio GUI
```

### Production (Postgres)

```bash
npm run db:migrate  # Create + apply migrations
npm run db:generate # Regenerate Prisma client
```

## Available Scripts

| Command                                                | Description                             |
| ------------------------------------------------------ | --------------------------------------- |
| `npm run dev`                                          | Start all services (Turborepo parallel) |
| `npm run build`                                        | Build all packages                      |
| `npm run lint`                                         | Lint all packages                       |
| `npm run type-check`                                   | TypeScript check all packages           |
| `npm run db:generate`                                  | Generate Prisma client                  |
| `npm run db:push`                                      | Push schema to DB (dev)                 |
| `npm run db:migrate`                                   | Create and apply migration              |
| `npm run db:studio`                                    | Open Prisma Studio                      |
| `cd apps/api && uvicorn main:app --reload --port 8000` | Start FastAPI dev server                |
