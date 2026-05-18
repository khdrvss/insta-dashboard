# Setup & Installation

## Prerequisites

- **Node.js** >= 20
- **npm** >= 10

> No Python. No Docker. No Redis. No Clerk. The entire app runs as a single Next.js process.

---

## Quick Start (2 minutes, zero API keys)

```bash
# 1. Clone and install
git clone https://github.com/khdrvss/insta-dashboard.git
cd insta-dashboard
npm install

# 2. Copy env template
cp .env.example .env.local

# 3. Run database migrations
npm run db:push

# 4. Start dev server
npm run dev
```

Open `http://localhost:3000`. Log in with the passphrase **`19801980`**.

Everything works with `USE_MOCK_DATA=true` — no API keys required.

---

## Environment Variables

### Minimum (mock mode — works immediately)

```env
USE_MOCK_DATA=true
DATABASE_URL="file:../../../packages/db/dev.db"
PASSPHRASE=19801980
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### To enable live competitor discovery (Apify)

```env
USE_MOCK_DATA=false
APIFY_API_TOKEN=apify_api_...
```

### To enable live AI (script generation + competitor filtering)

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.0-flash-001   # cheap, great Uzbek output
# or: google/gemini-2.5-flash  (better reasoning, costs more)
```

### To enable Instagram OAuth (connect your own account)

```env
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback
```

### To enable payments (Stripe)

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...
```

### Full variable reference

| Variable                    | Required for         | Description                                       |
| --------------------------- | -------------------- | ------------------------------------------------- |
| `USE_MOCK_DATA`             | Always               | `"true"` = no external calls, fixture data only   |
| `DATABASE_URL`              | Always               | SQLite file path (dev) or PostgreSQL URL (prod)   |
| `PASSPHRASE`                | Always               | Dev login passphrase (default `19801980`)         |
| `NEXT_PUBLIC_APP_URL`       | Always               | App origin, used in OAuth redirects               |
| `OPENROUTER_API_KEY`        | AI features          | All AI calls route through OpenRouter             |
| `OPENROUTER_MODEL`          | AI features          | Default `google/gemini-2.0-flash-001`             |
| `APIFY_API_TOKEN`           | Competitor discovery | Instagram hashtag + profile scraping              |
| `APIFY_INSTAGRAM_ACTOR_ID`  | Content analysis     | Default `apify/instagram-scraper`                 |
| `META_APP_ID`               | Instagram OAuth      | Meta Developer App ID                             |
| `META_APP_SECRET`           | Instagram OAuth      | Meta Developer App Secret                         |
| `META_OAUTH_REDIRECT_URI`   | Instagram OAuth      | Must match Meta App Dashboard setting             |
| `STRIPE_SECRET_KEY`         | Payments             | Stripe secret key                                 |
| `STRIPE_WEBHOOK_SECRET`     | Payments             | Stripe webhook signing secret                     |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Payments           | Stripe price ID for monthly plan                  |
| `STRIPE_PRO_ANNUAL_PRICE_ID`  | Payments           | Stripe price ID for annual plan                   |

---

## Database Setup

### Dev — SQLite (default, zero config)

```bash
npm run db:push      # Apply schema to dev.db
npm run db:studio    # Open Prisma Studio GUI at localhost:5555
```

The database file lives at `packages/db/dev.db`. It's gitignored.

### Seeding test data (optional)

```bash
npx ts-node scripts/seed.ts
```

### Production — PostgreSQL / Supabase

Change `DATABASE_URL` to your Postgres connection string, then:

```bash
npm run db:migrate   # Create and apply migrations
npm run db:generate  # Regenerate Prisma client
```

---

## Available Scripts

| Command                   | Description                              |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Start dev server (Next.js, port 3000)    |
| `npm run build`           | Production build                         |
| `npm run lint`            | ESLint all packages                      |
| `npm run type-check`      | TypeScript strict check                  |
| `npm run db:push`         | Push schema to DB (dev — no migration)   |
| `npm run db:migrate`      | Create migration + apply (production)    |
| `npm run db:generate`     | Regenerate Prisma client                 |
| `npm run db:studio`       | Open Prisma Studio GUI                   |

---

## Where to Get API Keys

| Service    | URL                                          | Notes                                      |
| ---------- | -------------------------------------------- | ------------------------------------------ |
| OpenRouter | https://openrouter.ai/keys                   | One key covers all models (Gemini, Claude) |
| Apify      | https://console.apify.com/account/integrations | Free tier: 5 USD credit/month            |
| Meta       | https://developers.facebook.com/apps/        | Create Business app → add Instagram Basic  |
| Stripe     | https://dashboard.stripe.com/test/apikeys    | Use test keys for development              |

See [`ENV_KEYS_NEEDED.txt`](../ENV_KEYS_NEEDED.txt) for detailed step-by-step instructions.
