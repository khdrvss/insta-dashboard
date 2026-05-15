# API Reference

The project has two API surfaces: **Next.js API Routes** (for frontend orchestration, auth, DB) and **FastAPI Python** (for AI processing, scraping).

---

## FastAPI Backend

**Base URL:** `http://localhost:8000`  
**Auth:** Internal requests include `X-Internal-Secret` header

### Routes

#### `GET /health`

Health check endpoint.

**Response:** `{ "status": "ok" }`

---

### `GET /auth/status`

Check authentication status.

---

### Profile

#### `GET /profile/{clerk_id}`

Get user profile.

**Mock:** Returns mock profile data  
**Live:** Fetches from Postgres via Prisma

#### `PUT /profile/{clerk_id}`

Update user profile fields.

---

### Competitors

#### `POST /competitors/discover`

Discover competitors for a niche.

**Request Body:**

```json
{
  "niche": "construction Tashkent",
  "location": "Tashkent",
  "hashtags": ["#qurilish", "#ta'mirlash"]
}
```

**Mock:** Returns fixture data from `mock/competitors.json`  
**Live:** Gathers candidates via Apify hashtag scraper + Meta Ad Library, deduplicates, AI-filters via Claude

**Response:**

```json
{
  "candidates": [
    {
      "handle": "stroyka_uz",
      "displayName": "Stroyka Uzbekistan",
      "profilePicUrl": "...",
      "bio": "...",
      "followersEst": 45200,
      "relevanceScore": 88,
      "source": "hashtag_search",
      "aiReasoning": "Matches niche with high relevance"
    }
  ]
}
```

#### `GET /competitors/mock`

Return mock competitor data directly.

---

### Analysis

#### `POST /analyze/start`

Start an async content analysis job.

**Mock:** Returns immediately with `"status": "complete"` and mock analysis data  
**Live:** Generates UUID, runs background worker

**Response (mock):**

```json
{
  "status": "complete",
  "jobId": "mock_job_001",
  "video_analyses": [...],
  "niche_summary": {...}
}
```

**Response (live):**

```json
{
  "status": "queued",
  "jobId": "uuid-string"
}
```

#### `GET /analyze/job/{job_id}`

Poll job status.

**Response:**

```json
{
  "status": "running",
  "progress": 60,
  "step": "Analyzing content..."
}
```

#### `GET /analyze/mock/video-analyses`

Return mock video analysis data.

#### `GET /analyze/mock/niche-summary`

Return mock niche intelligence summary.

---

### Scripts

#### `POST /scripts/generate`

Generate script variations.

**Request Body:**

```json
{
  "goal": "brand_awareness",
  "platform": "reels",
  "tone": "bold",
  "length": 30,
  "niche": "construction",
  "patterns": ["pattern 1", "pattern 2"]
}
```

**Mock:** Returns fixture data from `mock/generated_scripts.json`  
**Live:** Calls `script_generator.py` which uses Claude with RAG patterns

**Response:** Array of 3 script variations

---

## Next.js API Routes

**Base URL:** `http://localhost:3000`  
**Auth:** Clerk session (or mock user in dev mode)

### Analysis

#### `POST /api/analyze/start`

Start analysis.  
**Mock:** Returns mock analysis results immediately  
**Live:** Creates `AnalysisJob` in DB, calls FastAPI `/analyze/start`

#### `GET /api/analyze/results`

Get analysis results.  
**Mock:** Returns `mock/analysis_results.json`  
**Live:** Builds competitor stats, top posts, engagement trends from DB

#### `GET /api/analyze/[jobId]`

Poll analysis job status.

---

### Auth

#### `GET /api/auth/instagram`

Initiate Instagram OAuth flow. Generates CSRF state token, redirects to Facebook OAuth dialog.

#### `GET /api/auth/instagram/callback`

Handle OAuth callback. Full pipeline:

1. Exchange code for short-lived token
2. Exchange for 60-day long-lived token
3. List Facebook Pages
4. Find Instagram Business Account
5. Fetch profile + recent 30 posts
6. Calculate engagement metrics, content mix, top hashtags
7. Store in DB via Prisma transaction

**Error codes:** `access_denied`, `no_pages`, `no_ig_business`, `invalid_state`, `server_error`

---

### Billing

#### `POST /api/billing/create-checkout`

Create Stripe Checkout session.  
**Dev mode:** Returns direct URL without Stripe  
**Live:** Creates subscription with `STRIPE_PRO_MONTHLY_PRICE_ID` or `STRIPE_PRO_ANNUAL_PRICE_ID`

---

### Competitors

#### `GET /api/competitors`

List confirmed competitors for current user, sorted by relevance.

#### `POST /api/competitors/discover`

Run full competitor discovery.  
**Mock:** Returns fixture data after 2s simulated delay  
**Live:** Runs Apify + Ad Library gathering, Claude filtering via `@instagram-dashboard/ai` prompts

#### `POST /api/competitors/confirm`

Confirm selected competitors. Zod-validated. Max 20 competitors.

**Request Body:**

```json
{
  "candidates": [
    {
      "handle": "stroyka_uz",
      "displayName": "Stroyka Uzbekistan",
      "profilePicUrl": "...",
      "bio": "...",
      "followersEst": 45200,
      "relevanceScore": 88,
      "discoverySource": "hashtag_search"
    }
  ]
}
```

#### `DELETE /api/competitors/[id]`

Remove a tracked competitor.

#### `PATCH /api/competitors/[id]`

Update competitor (confirm/unconfirm).

---

### Profile

#### `GET /api/profile`

Get user profile + Instagram account data.

#### `GET /api/profile/posts`

Get user's Instagram posts sorted by engagement rate.

#### `POST /api/profile/posts`

Trigger manual re-sync of Instagram posts (redirects to OAuth if token expired).

---

### Scripts

#### `POST /api/scripts/generate`

Generate 3 script variations.  
**Mock:** Returns fixture data after 1.5s delay  
**Live:** Validates input, checks free tier rate limit (5/month), calls Claude via `@instagram-dashboard/ai` prompts, logs to DB

**Request Body:**

```json
{
  "goal": "brand_awareness",
  "platform": "reels",
  "tone": "bold",
  "length": 30
}
```

---

### User

#### `POST /api/user/onboard`

Save onboarding form data. Zod-validated.

**Request Body:**

```json
{
  "instagramHandle": "stroycorp_demo",
  "niche": "construction Tashkent",
  "location": "Tashkent",
  "targetAudience": "Homeowners looking to renovate",
  "brandVoice": "bold",
  "products": "Renovation services, construction materials"
}
```

---

### Webhooks

#### `POST /api/webhooks/stripe`

Stripe webhook handler. Verifies signature with `STRIPE_WEBHOOK_SECRET`.

**Events handled:**

- `checkout.session.completed` — Sets user plan to `pro`
- `customer.subscription.deleted` — Sets user plan to `free`
