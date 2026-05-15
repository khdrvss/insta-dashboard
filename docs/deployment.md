# Deployment

## Deployment Targets

| App              | Platform             | Region               |
| ---------------- | -------------------- | -------------------- |
| Next.js Frontend | Vercel               | iad1 (Washington DC) |
| FastAPI Backend  | Render               | Oregon               |
| PostgreSQL       | Supabase / Render    | Same as backend      |
| Redis            | Upstash (serverless) | Auto                 |

---

## Frontend (Vercel)

### Configuration (`vercel.json`)

```json
{
  "buildCommand": "cd ../.. && npm run build --filter=@instagram-dashboard/web",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs",
  "region": "iad1"
}
```

### Deployment Steps

1. Push to GitHub (or linked Git provider)
2. Vercel auto-detects the project
3. Set environment variables in Vercel Dashboard (`@` references Vercel secrets):
   - `NEXT_PUBLIC_APP_URL` → `@next_public_app_url`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → `@next_public_clerk_publishable_key`
   - `CLERK_SECRET_KEY` → `@clerk_secret_key`
   - All other env vars from `.env.example`
4. Deploy: Vercel runs `npm run build` (via Turborepo, filtering to web)

**Important:** In production, `USE_MOCK_DATA` must be `false` and all API keys must be configured.

### Build Process

```
npm run build --filter=@instagram-dashboard/web
  ├── ^build (packages/db → packages/ai)
  └── apps/web build (Next.js)
```

---

## Backend (Render)

### Configuration (`apps/api/render.yaml`)

- **Service name:** `instaintel-api`
- **Plan:** Starter
- **Region:** Oregon

### Environment Variables (12 vars, sync disabled)

Must be set manually in Render Dashboard:

- `DATABASE_URL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `PINECONE_API_KEY`, `REDIS_URL`, `APIFY_API_TOKEN`, `META_APP_ID`, `META_APP_SECRET`, `STRIPE_SECRET_KEY`, `SENTRY_DSN`, etc.

### Startup

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## Docker (Local Infrastructure)

`docker-compose.yml` starts three services:

```bash
docker-compose up -d
```

| Service  | Image                   | Port | Credentials                                |
| -------- | ----------------------- | ---- | ------------------------------------------ |
| postgres | postgres:16-alpine      | 5432 | postgres/postgres, db: instagram_dashboard |
| redis    | redis:7-alpine          | 6379 | password: redis_password                   |
| api      | `./apps/api/Dockerfile` | 8000 | Hot-reload enabled                         |

### Dockerfile (`apps/api/Dockerfile`)

```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y ffmpeg  # For Whisper audio processing
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Database (Production)

### Supabase (Recommended)

1. Create Supabase project
2. Set `DATABASE_URL` to Supabase connection string
3. Set `DIRECT_URL` for Prisma migrations
4. Run `npm run db:migrate` to apply schema

### Migrations Workflow

```bash
# Create migration (after schema changes)
npm run db:migrate

# Apply to production
# Set DATABASE_URL to production Postgres URL
npm run db:migrate -- --deploy

# Or in CI/CD
npx prisma migrate deploy
```

---

## CI/CD Recommendations

### GitHub Actions (Example)

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  deploy-web:
    needs: lint
    uses: ./.github/workflows/vercel.yml # Vercel GitHub integration

  deploy-api:
    needs: lint
    uses: ./.github/workflows/render.yml # Render GitHub integration
```

---

## Environment Variable Checklist (Production)

| Group      | Variables                                                                    | Status                          |
| ---------- | ---------------------------------------------------------------------------- | ------------------------------- |
| App Config | `NEXT_PUBLIC_APP_URL`, `API_BASE_URL`, `INTERNAL_API_SECRET`                 | Required                        |
| Database   | `DATABASE_URL`, `DIRECT_URL`                                                 | Required                        |
| Auth       | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`                      | Required                        |
| AI         | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default: `claude-sonnet-4-20250514`) | Required                        |
| AI         | `OPENAI_API_KEY`                                                             | Required for transcription      |
| AI         | `GOOGLE_API_KEY`                                                             | Optional fallback               |
| Vector     | `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `PINECONE_ENVIRONMENT`            | Optional (graceful degradation) |
| Cache      | `REDIS_URL` or `UPSTASH_REDIS_REST_URL` + token                              | Optional (graceful degradation) |
| Scraping   | `APIFY_API_TOKEN`, `APIFY_INSTAGRAM_ACTOR_ID`                                | Required for live mode          |
| Meta       | `META_APP_ID`, `META_APP_SECRET`, `META_OAUTH_REDIRECT_URI`                  | Required                        |
| Payments   | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs                      | Required                        |
| Monitoring | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`                                | Optional                        |
