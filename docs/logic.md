# Logic Reference — All Functions & Components

Complete reference of every function, handler, and component across the entire project, with detailed logic descriptions.

---

## Table of Contents

- [Next.js API Routes](#nextjs-api-routes)
- [FastAPI Python Backend](#fastapi-python-backend)
- [Frontend Components](#frontend-components)
- [Library Utilities](#library-utilities)
- [Shared Packages](#shared-packages)
- [Configuration & Middleware](#configuration--middleware)

---

## Next.js API Routes

All routes are in `apps/web/app/api/`. They run on Vercel serverless.

---

### `POST /api/analyze/start` (`analyze/start/route.ts`)

**Purpose:** Start content analysis job.

**Logic:**

1. Auth check — returns 401 if no userId
2. **Mock mode** (`USE_MOCK_DATA=true`): Returns `{ job_id: "mock-job-001", status: "done", progress: 100, mock: true }` immediately
3. Fetches user from DB with confirmed competitors
4. Returns 404 if user not found, 400 if no confirmed competitors
5. Creates `AnalysisJob` record in DB with status `"pending"`
6. Fire-and-forget POST to FastAPI at `API_BASE_URL/analyze/start` with job_id, user_id, niche, competitor handles
7. Returns `{ job_id, status: "pending", progress: 0 }`

---

### `GET /api/analyze/results` (`analyze/results/route.ts`)

**Purpose:** Return analysis results with competitor stats, top posts, trends.

**Logic:**

1. Auth check
2. **Mock mode:** Returns fixture from `mock/analysis_results.json`
3. Fetches user with confirmed competitors + posts (top 50 by engagement) + videoAnalysis
4. **`mostFrequent(arr)`** — helper that finds most common string in array via frequency map
5. **`getWeekLabel(date)`** — helper that returns week start date as "15 May" format
6. Builds competitor stats: avg engagement rate, top format, top hook type per competitor
7. Flattens all posts across competitors, sorts by engagement score, takes top 10
8. Aggregates engagement by week (last 8 weeks max) for trend data
9. Returns `{ competitors, top_posts, engagement_trend, niche_summary: null }`

---

### `GET /api/analyze/[jobId]` (`analyze/[jobId]/route.ts`)

**Purpose:** Poll analysis job status.

**Logic:**

1. Auth check
2. If `jobId === "mock-job-001"`, returns `{ status: "done", progress: 100 }`
3. Looks up `AnalysisJob` in DB by ID
4. Returns 404 if not found
5. Returns `{ job_id, status, progress, error, started_at, completed_at }`

---

### `GET /api/auth/instagram` (`auth/instagram/route.ts`)

**Purpose:** Initiate Instagram OAuth flow.

**Logic:**

1. Auth check
2. Generates CSRF state token: `"${userId}.${randomBytes(16).hex}"`
3. Calls `buildOAuthUrl(state)` from `lib/meta-graph` to construct Meta OAuth URL
4. Redirects user to Facebook OAuth dialog

---

### `GET /api/auth/instagram/callback` (`auth/instagram/callback/route.ts`)

**Purpose:** Handle Instagram OAuth callback — full token exchange + profile sync.

**Logic:**

1. Auth check; if no userId, redirects to sign-in
2. Reads `code`, `error`, `state` from query params
3. If user denied access (`error` present), redirects with `ig_error=access_denied`
4. Verifies state token starts with user's ID — mismatch redirects with `ig_error=invalid_state`
5. **OAuth pipeline** (wrapped in try/catch):
   - `exchangeCodeForToken(code)` → short-lived access token
   - `getLongLivedToken(shortToken)` → 60-day token
   - `getFacebookPages(longToken)` → list managed Facebook Pages
   - If no pages → `ig_error=no_pages`
   - `getIGBusinessAccount(pageId, pageToken)` → find Instagram Business Account
   - If no IG account → `ig_error=no_ig_business`
   - `getIGProfile(igUserId, pageToken)` + `getIGMedia(igUserId, pageToken, 30)` in parallel
   - `calculateEngagementMetrics(media, followers)` → compute engagement stats
   - `extractHashtags(caption)` → extract #tags from all post captions
   - Prisma `$transaction`: update user token, upsert InstagramAccount, delete old UserPosts
   - `userPost.createMany` with all media posts (normalize media_type to carousel/reel/image)
   - Success redirect: `/dashboard?ig_connected=1`
6. On any exception → `ig_error=server_error`

---

### `POST /api/billing/create-checkout` (`billing/create-checkout/route.ts`)

**Purpose:** Create Stripe Checkout session for subscription.

**Logic:**

1. Auth check
2. Reads optional `priceId` and `interval` from body
3. Resolves price: `interval === "annual"` → `STRIPE_PRO_ANNUAL_PRICE_ID`, else → `STRIPE_PRO_MONTHLY_PRICE_ID`
4. **Dev/mock mode:** If no price ID or no Stripe key → returns `{ url: "/dashboard?upgrade=demo" }`
5. Fetches user email from Clerk + DB user ID
6. Creates Stripe Checkout Session: mode `"subscription"`, card payments, metadata with clerk_id and user_id
7. Returns `{ url: session.url }`

---

### `GET /api/competitors` (`competitors/route.ts`)

**Purpose:** List all competitors for current user.

**Logic:**

1. Auth check
2. **Mock mode:** Filters `competitors_discovery.json` candidates by `confirmed: true`, maps to competitor object with `_count: { posts: 0 }`
3. Finds user by clerkId; returns `{ competitors: [] }` if not found
4. Queries `competitor` table ordered by confirmed desc, relevanceScore desc, includes post count
5. Returns `{ competitors }`

---

### `POST /api/competitors/discover` (`competitors/discover/route.ts`)

**Purpose:** Run full competitor discovery pipeline.

**Logic:**

1. Auth check
2. **Mock mode:** 2s simulated delay, returns fixture from `competitors_discovery.json`
3. Fetches user by clerkId; 404 if not found
4. Validates user has `niche` and `location`; 400 if missing
5. **Live discovery:**
   - Calls `gatherCandidates(niche, location)` to build raw pool from Apify + Ad Library
   - If no candidates, returns 404
   - Builds AI prompt via `buildCompetitorFilterPrompt` from `@instagram-dashboard/ai`
   - Sends prompt to Claude, parses JSON response with regex
   - Enriches results with source info from raw candidates
   - Logs AI usage to `aiUsageLog` table
6. Returns `{ candidates, total_scanned, mock: false }`

### `gatherCandidates(niche, location)` — private helper

**Logic:**

1. **Apify hashtag scraper** (if `APIFY_API_TOKEN` set): derives hashtag slugs from niche+location, dynamically imports `apify-client`, calls `apify/instagram-hashtag-scraper` actor, iterates dataset items for candidates
2. **Meta Ad Library** (if `META_APP_ID` + `META_APP_SECRET` set): queries `graph.facebook.com/v19.0/ads_archive` with app access token, searches for niche ads, extracts page names
3. Deduplicates by handle (first occurrence wins)
4. Errors from either source are caught and logged (non-fatal)

---

### `POST /api/competitors/confirm` (`competitors/confirm/route.ts`)

**Purpose:** Confirm selected competitors.

**Logic:**

1. Auth check
2. Zod validation: array of 1-20 competitors with handle, displayName?, relevanceScore (0-100), followersEst?, discoverySource
3. **Mock mode:** Returns mocked success with confirmed count
4. Finds user by clerkId; 404 if not found
5. `Promise.all` — upserts each competitor by `userId_handle` unique key (creates or updates with confirmed=true)
6. Returns `{ confirmed: count, competitors: results }`

---

### `DELETE /api/competitors/[id]` (`competitors/[id]/route.ts`)

**Purpose:** Remove a tracked competitor.

**Logic:**

1. Auth check
2. Finds user by clerkId; 404 if not found
3. Finds competitor by id + userId (ownership check); 404 if not found
4. Deletes competitor record
5. Returns `{ deleted: true }`

### `PATCH /api/competitors/[id]`

**Purpose:** Update competitor confirmation status.

**Logic:**

1. Auth check, find user, extract id from params
2. Reads `confirmed` boolean from body (defaults to true)
3. `prisma.competitor.updateMany` with id + userId ownership
4. Returns `{ updated: count }`

---

### `GET /api/profile` (`profile/route.ts`)

**Purpose:** Get user profile + Instagram account.

**Logic:**

1. Auth check
2. **Mock mode:** Returns fixture from `mock/user_profile.json` with `mock: true`
3. Fetches user by clerkId including `instagramAccount` relation
4. Returns 404 if not found
5. Returns `{ user: { id, email, instagramHandle, niche, location, brandVoice, plan }, instagram, connected }`

---

### `GET /api/profile/posts` (`profile/posts/route.ts`)

**Purpose:** Get user's Instagram posts.

**Logic:**

1. Auth check
2. **Mock mode:** Returns fixture from `mock/user_posts.json`
3. Fetches user by clerkId; 404 if not found
4. Queries `userPost` ordered by engagementRate desc, postedAt desc, limit 30
5. Returns `{ posts }`

### `POST /api/profile/posts`

**Purpose:** Trigger manual re-sync of Instagram posts.

**Logic:**

1. Auth check
2. **Mock mode:** Returns `{ synced: true, mock: true }`
3. Fetches user with instagramAccount
4. If no `metaAccessToken` → 400 "Instagram not connected"
5. If token expired → 401 "reconnect"
6. Returns `{ redirect: "/api/auth/instagram" }` for client to follow

---

### `POST /api/scripts/generate` (`scripts/generate/route.ts`)

**Purpose:** Generate 3 script variations via Claude AI.

**Logic:**

1. Auth check
2. Zod validation: goal, platform, lengthSecs (15/30/60), tone (default "friendly")
3. **Mock mode:** 1.5s delay, returns fixture from `mock/generated_scripts.json`
4. Fetches user by clerkId; 404 if not found
5. **Rate limit (free tier):** counts scripts created this month; if >= 5, returns 429
6. Builds prompt via `buildScriptGenerationPrompt` from `@instagram-dashboard/ai` with user's niche, brandVoice, products, audience, plus hardcoded winning hooks/formats/phrases
7. Sends to Claude with max_tokens=4096, tracks duration
8. Parses JSON from response using regex `/\{[\s\S]*\}/`
9. Persists: creates `GeneratedScript` + `AiUsageLog` in parallel via Promise.all
10. Returns `{ scripts }`

---

### `POST /api/user/onboard` (`user/onboard/route.ts`)

**Purpose:** Save onboarding form data.

**Logic:**

1. Auth check
2. Parses JSON body; 400 if invalid
3. Zod validation: niche (required), location (required), instagramHandle?, targetAudience?, brandVoice (enum, default "friendly"), productsServices?
4. `prisma.user.upsert` by clerkId — creates or updates with all onboarding fields + `onboardingDone: true`
5. Returns `{ success: true, user: { id, niche } }`

---

### `POST /api/webhooks/stripe` (`webhooks/stripe/route.ts`)

**Purpose:** Handle Stripe webhook events.

**Logic:**

1. If Stripe not configured → 400
2. Instantiates Stripe client, verifies webhook signature via `constructEvent`
3. **`checkout.session.completed`** — extracts `clerk_id` from session metadata, updates user plan to `"pro"`
4. **`customer.subscription.deleted`** — extracts `clerk_id`, updates user plan to `"free"`
5. Returns `{ received: true }`

---

## FastAPI Python Backend

All files in `apps/api/`. Runs on Render as a separate service.

---

### `main.py` — Application Entry Point

**`lifespan(app)`** — async context manager

- **Startup:** Prints banner, warns if `USE_MOCK_DATA=true`
- **Shutdown:** Prints shutdown message

**`rate_limit_handler(request, exc)`** — `@app.exception_handler(RateLimitExceeded)`

- Catches SlowAPI rate limit violations
- Returns `429 { "detail": "Rate limit exceeded..." }`

**`health()`** — `GET /health`

- Returns `{ status: "ok", mock_mode: bool, version: "1.0.0" }`
- Registers routers: auth, profile, competitors, analyze, scripts
- Configures CORS (allows `NEXT_PUBLIC_APP_URL` + localhost:3000)
- Attaches rate limiter with 10 req/min (free) / 60 req/min (pro)

---

### `routes/auth.py`

**`auth_status()`** — `GET /status`

- Stub endpoint; auth handled by Clerk
- Returns `{ authenticated: true, message: "..." }`

---

### `routes/profile.py`

**`get_profile(clerk_id)`** — `GET /{clerk_id}`

- **Mock mode:** Returns hardcoded mock profile
- **Live:** Returns 501 "Not Implemented"

**`update_profile(clerk_id, req)`** — `PUT /{clerk_id}`

- Stub; returns `{ success: true }`

---

### `routes/competitors.py`

**`discover_competitors(req)`** — `POST /discover`

- **Mock mode:** Returns fixture from `mock/competitors.json`
- **Live:**
  1. Gathers raw candidates from Apify (`discover_competitors_from_hashtags`) + Meta Ad Library (`query_meta_ad_library`)
  2. Does deduplication by handle
  3. Calls `filter_competitors_with_ai(niche, location, unique)` to AI-rank candidates
  4. Returns filtered list with scores

**`get_mock_competitors()`** — `GET /mock`

- Returns raw content of `mock/competitors.json`

---

### `routes/analyze.py`

**`start_analysis(req, background_tasks)`** — `POST /start`

- **Mock mode:** Returns `{ job_id: "mock-job-001", status: "complete", mock: true }`
- **Live:** Generates UUID, schedules `run_analysis_job` as FastAPI BackgroundTask, returns `{ status: "pending" }`

**`get_mock_analyses()`** — `GET /mock/video-analyses`

- Returns raw content of `mock/video_analyses.json`

**`get_mock_niche_summary()`** — `GET /mock/niche-summary`

- Returns hardcoded niche summary with 5 winning patterns, 3 hook styles, power phrases

**`get_job_status(job_id)`** — `GET /job/{job_id}`

- Mock job "mock-job-001" returns complete
- Otherwise returns pending (placeholder for Redis/DB)

**`run_analysis_job(job_id, handles, niche, max_posts)`** — standalone async

- Wraps worker call in try/except; logs failures

---

### `routes/scripts.py`

**`generate(req)`** — `POST /generate`

- **Mock mode:** Returns fixture from `apps/web/mock/generated_scripts.json`
- **Live:** Calls `generate_scripts()` from services, returns scripts or 500 on error

---

### `services/ai.py` — Core AI Integrations

All AI functions use `@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))`.

**`filter_competitors_with_ai(niche, location, candidates)`**

- Claude prompt: "Act as Instagram marketing expert, filter to 15 most relevant business competitors"
- Expects JSON response with `filtered` array (handle, relevance_score 0-100, reasoning)
- Minimum score >= 50, sorted descending
- Parses JSON by finding first `{` and last `}` in response

**`analyze_video_content(video_url, caption, niche, transcript=None)`**

- Claude prompt: Analyze Instagram Reel for niche
- Extracts: hook_text, hook_type, hook_duration_s, value_prop, cta_text, pacing_style, sentiment, content_format, power_words, audio_track_name
- Max tokens: 1024

**`summarize_niche_patterns(niche, location, analyses)`**

- Claude prompt: Synthesize N analyses of top-performing posts
- Returns: winning_patterns[5], best_hook_styles, top_content_formats, power_phrases, best_posting_patterns, trending_audio_categories, summary

**`transcribe_audio(audio_path)`**

- OpenAI Whisper (`whisper-1` model, `response_format="text"`)
- Opens file, sends to API
- Returns `None` on failure (graceful degradation for caption-only analysis)

---

### `services/meta_graph.py` — Meta Graph API Client

**`fetch_ig_media(ig_user_id, access_token, limit=30)`** — `@retry(3x, 2s-30s backoff)`

- `GET /{ig_user_id}/media` with fields: id, caption, media_type, media_url, thumbnail_url, permalink, timestamp, like_count, comments_count
- Uses `httpx.AsyncClient` with 30s timeout
- Returns `data.data` or `[]`

**`fetch_ig_profile(ig_user_id, access_token)`** — `@retry(3x, 2s-30s backoff)`

- `GET /{ig_user_id}` with fields: id, username, name, biography, profile_picture_url, followers_count, follows_count, media_count

**`fetch_post_insights(media_id, access_token, media_type="IMAGE")`**

- `GET /{media_id}/insights` with metrics: impressions, reach, engagement (+ video_views for VIDEO/REEL)
- Returns `{}` on non-success (insights may be unavailable)

---

### `services/scraper.py` — Data Scraping

**`discover_competitors_from_hashtags(niche, location, hashtags=None)`** — `@retry(3x, 4s-30s)`

- **Mock:** Returns competitors from `mock/competitors.json`
- **Live:** Derives hashtags from niche+location slugs, calls Apify Instagram Hashtag Scraper for each, aggregates results
- Missing API token raises ValueError

**`fetch_competitor_posts(handle, max_posts=50)`** — `@retry(3x, 4s-30s)`

- **Mock:** Returns posts from `mock/video_analyses.json`, truncated to max_posts
- **Live:** Calls Apify Instagram scraper actor; currently returns `[]` (polling planned Phase 4)

**`query_meta_ad_library(niche, location)`**

- **Mock:** Returns ads from `mock/ad_library.json`
- **Live:** `GET graph.facebook.com/v19.0/ads_archive` with app access token, country UZ, niche search, limit 25

---

### `services/script_generator.py` — RAG Script Generator

**`generate_scripts(niche, brand_voice, tone, goal, platform, length_secs, products_services, target_audience, temperature=0.7)`** — `@retry(3x)`

- Claude prompt: Expert video scriptwriter for given niche
- Includes hardcoded winning hooks (question, shock, promise, story) + top formats (talking-head, before-after, educational-list)
- Requests exactly 3 scripts with full scene breakdowns
- Max tokens: 4096
- Parses JSON response, returns `data.get("scripts", [])`

---

### `services/vector_search.py` — Pinecone Integration

**`upsert_analysis(post_id, niche, embedding, metadata)`**

- If `PINECONE_API_KEY` empty → logs message, returns post_id (no-op)
- Instantiates Pinecone client, upserts vector under niche namespace

**`query_top_patterns(niche, query_embedding, top_k=10)`**

- If `PINECONE_API_KEY` empty → returns `[]`
- Queries Pinecone index with embedding, returns matches with metadata

---

### `utils/cache.py` — Redis Caching

**`get_redis()`** — lazy singleton

- Creates async Redis client from `REDIS_URL` env var (default `redis://localhost:6379`)

**`cache_key(*parts)`** — builds MD5-hashed key prefixed `"instaintel:"`

**`get_cached(key)`** — `await r.get(key)` → `json.loads` or `None`

- Returns `None` on any error (cache miss, connection failure)

**`set_cached(key, value, ttl=604800)`** — `await r.setex(key, ttl, json.dumps(value))`

- Silently logs failure (non-critical)

---

### `utils/rate_limit.py`

- Module-level: `limiter = Limiter(key_func=get_remote_address)`
- Constants: `FREE_LIMIT = "10/minute"`, `PRO_LIMIT = "60/minute"`

---

### `workers/analysis_worker.py` — Background Analysis Worker

**`run_analysis(job_id, user_id, niche, competitor_handles)`**

- Full async pipeline:
  1. For each competitor handle:
     - Cache check (currently hardcoded to None — TODO)
     - Fetch posts via `fetch_competitor_posts(handle, 50)`
     - Score engagement via `estimate_engagement(post)`
     - Select top 10% (min 1) by engagement score
     - For each top post:
       - Download video, transcribe via Whisper if `OPENAI_API_KEY` set
       - Analyze via Claude (`analyze_video_content`)
       - Fire-and-forget Pinecone upsert (stub embedding)
       - Per-post errors caught and logged (continues)
     - Cache analyses with 7-day TTL
  2. If any analyses exist: generate niche summary via Claude
  3. Cache niche summary with 7-day TTL
- Outer per-competitor try/except (continues to next)
- Prints completion stats

**`estimate_engagement(post)`**

- `raw = ((likes + comments * 2) / max(views, 1)) * 1000`
- `return min(100, raw * 5)` — comments weighted 2x, capped at 100

**`transcribe_url(video_url)`**

- Downloads video via httpx (30s timeout)
- Writes to temp `.mp4` file
- Calls `transcribe_audio(tmp_path)` from `services.ai`
- Deletes temp file immediately
- Returns `None` on any error

---

## Frontend Components

All components in `apps/web/components/`.

---

### `Header` (`dashboard/Header.tsx`)

- Reads language from `useLang()` hook
- Conditionally loads Clerk `UserButton` via `next/dynamic` (only when real Clerk keys exist)
- Renders: mobile logo, language toggle (UZ/EN with gradient styling on active), notification bell, user avatar
- Falls back to gradient icon when Clerk not configured

---

### `Sidebar` (`dashboard/Sidebar.tsx`)

- Uses `usePathname()` for active route detection
- 5 nav items: Profile (`/dashboard` exact), Competitors, Analysis, Insights, Scripts (with "AI" pink badge)
- `isActive(href, exact)` helper: exact match for profile, `startsWith` for others
- Footer: "Free Plan" label, script quota text, "Upgrade to Pro" CTA button

---

### `OAuthToast` (`dashboard/OAuthToast.tsx`)

- Reads `ig_connected` and `ig_error` from search params
- `IG_ERRORS` map: access_denied, no_pages, no_ig_business, invalid_state, server_error
- Auto-dismiss after 4 seconds via `router.replace("/dashboard")`
- Success: green toast with "Instagram connected!"
- Error: red toast with specific error message

---

### `ProfileOverview` (`dashboard/ProfileOverview.tsx`)

- State machine: loading → connected / not-connected / error
- On mount: `Promise.all([fetch("/api/profile"), fetch("/api/profile/posts")])`
- `handleSync()`: POST to `/api/profile/posts`; if response has `redirect` → `window.location.href = data.redirect`
- **Not connected:** Connect prompt with link to `/api/auth/instagram`, info box about Business/Creator account requirement
- **Connected:** Avatar, name, handle, bio, sync button, view link, metrics (4 rows), content mix (colored dots), top 12 hashtags (chips), top 6 posts (grid with hover overlay), last synced timestamp
- **`MetricTile`** — internal component: colored icon + value + label + optional note
- **`PostThumbnail`** — internal component: square thumbnail with hover overlay (likes + comments), media type dot (reel=violet, image=pink, carousel=orange)

---

### `StatCard` (`dashboard/StatCard.tsx`)

- 5 color variants: violet, pink, orange, green, blue
- Props: label, value, subtext?, icon, color, trend? (value + positive bool)
- Renders: colored icon box, optional trend badge (green +X% / red -X%), large value, label, optional subtext

---

### `AnalysisJobStatus` (`dashboard/analysis/AnalysisJobStatus.tsx`)

- Props: jobId, onComplete callback
- **Mock mode** (`jobId === "mock-job-001"`): simulates progress every 500ms (+20 per tick, 5 steps), auto-completes
- **Live mode:** polls `/api/analyze/${jobId}` every 3 seconds
- States: pending → running (progress bar + 5-step animated checklist) → done (green) / failed (red with error)
- Steps: Fetching, Transcribing, Analyzing, Extracting, Building

---

### `CompetitorTable` (`dashboard/analysis/CompetitorTable.tsx`)

- HTML table sorted by avg_engagement_rate descending
- Columns: Account, Followers, Avg ER, Posts, Top Format, Top Hook, Views/Post
- **`ERBadge`** — internal: colored by rate (green >= 7%, yellow >= 4%, orange < 4%), icon (TrendingUp/TrendingDown)
- Format labels map, hook type badges with colors
- Footer: "All metrics AI-estimated from public signals."

---

### `NicheSummaryCard` (`dashboard/analysis/NicheSummaryCard.tsx`)

- 5 sections:
  1. **Executive summary** — violet info card with AI summary paragraph
  2. **Winning patterns** (top 5) — name, frequency %, gradient progress bar, "why it works"
  3. **Best hook styles** (top 3) — type, effectiveness X/100, example quote
  4. **Power phrases** — orange chip badges
  5. **Best posting times** — 3-column grid with time slots, days, frequency

---

### `TopPostsGallery` (`dashboard/analysis/TopPostsGallery.tsx`)

- Vertical list of post cards
- Each card: hook text (quoted, line-clamp-2), meta row (@handle, hook type badge, format badge, duration), score badge (green >= 85, yellow >= 70), stats (hearts, comments, views)
- Click to toggle expanded caption view
- **`ScoreBadge`** — internal: color-coded score display

---

### `CandidateCard` (`dashboard/competitors/CandidateCard.tsx`)

- Clickable card with selection state (violet border/bg when selected, checkmark circle top-right)
- Shows: Instagram icon, display name/handle, relevance score (colored ring, X/100), source badge (Hashtag=violet, Meta Ads=blue, Manual=green), followers estimate, AI reasoning (line-clamp-2)
- `scoreColor(score)`: green >= 80, yellow >= 65, orange
- `scoreRingColor(score)`: matching border + bg

---

### `ConfirmedList` (`dashboard/competitors/ConfirmedList.tsx`)

- Vertical list of tracked competitors
- Each item: Instagram icon, display name/@handle, followers, relevance score, post count, status badge (Analyzed=green|Pending=muted)
- Remove button: calls DELETE `/api/competitors/{id}`, shows spinner during removal
- `statusInfo()` helper: Analyzed if `_count.posts > 0`, else Pending

---

### `DiscoveryPanel` (`dashboard/competitors/DiscoveryPanel.tsx`)

- 5-phase state machine: `idle → discovering → review → confirming → done`
- **`runDiscovery()`**: POST to `/api/competitors/discover` with step animation (4 steps, 600ms each). Pre-selects candidates with score >= 70.
- **`toggle(handle)`**: add/remove from selected set
- **`addManual()`**: creates manual candidate (score 75, source "manual"), prepends and auto-selects
- **`confirmSelection()`**: POST to `/api/competitors/confirm`, maps response to `ConfirmedResult[]`, calls `onConfirmed(confirmedData)` after 1.5s done state
- **Idle**: dashed border box with "Start discovery" button
- **Discovering**: spinner + 4-step animated checklist
- **Review**: candidate grid (2 columns), manual add input, select/deselect all, sticky bottom bar with selected count + confirm button
- **Done**: green success with checkmark, auto-transitions

---

### `EngagementTrendChart` (`dashboard/charts/EngagementTrendChart.tsx`)

- Recharts `LineChart` with `ResponsiveContainer`
- X-axis: week labels; Y-axis: percentage
- Violet line (#7C3AED): avg competitor ER (solid)
- Pink line (#EC4899): top competitor ER (dashed, conditional)
- Dark theme tooltip, 5% opacity grid

---

### `ContentFormatPie` (`dashboard/charts/ContentFormatPie.tsx`)

- Recharts donut chart (innerRadius=55, outerRadius=85, paddingAngle=3)
- Custom label: shows percentage only when >= 10%
- Each slice uses `entry.color` for fill
- Legend with circle icons

---

## Library Utilities

All in `apps/web/lib/`.

---

### `utils.ts`

**`cn(...inputs: ClassValue[])`** — `clsx` + `tailwind-merge` for class merging

**`formatNumber(n: number)`** — formats to human-readable: `>= 1M → "1.0M"`, `>= 1K → "1.0K"`, else plain

**`formatEngagementRate(rate: number)`** — formats as `"3.45%"` with 2 decimal places

**`sleep(ms: number)`** — `Promise.resolve` after setTimeout

**`fetchWithRetry(url, options?, retries=3, backoffMs=1000)`** — exponential backoff

- Retries on HTTP >= 500 or network errors
- Wait time: `backoffMs * 2^attempt`
- Throws `"Failed after N retries"` on exhaustion

---

### `api-client.ts`

**`request<T>(path, options?)`** — internal helper

- Constructs full URL from `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000`)
- Sets `Content-Type: application/json`, returns parsed JSON as `T`
- On error, extracts `.detail` from error JSON or falls back to "Unknown error"

**`api.get<T>(path, init?)`** / **`api.post<T>(path, body, init?)`** / **`api.put<T>(path, body, init?)`** / **`api.delete<T>(path, init?)`**

- Convenience wrappers calling `request<T>` with correct method

---

### `mock-auth.ts`

**`MOCK_USER`** — constant: `{ id: "dev_mock_user_001", ... }`

**`isMockMode()`** — returns true if `USE_MOCK_DATA=true` OR Clerk key is missing/placeholder

**`getCurrentUser()`** — returns `MOCK_USER` in mock mode, else Clerk's `currentUser()`

**`getAuth()`** — returns `{ userId: "dev_mock_user_001" }` in mock mode, else Clerk's `auth()`

---

### `meta-graph.ts` — Meta Graph API Client (Frontend)

**`exchangeCodeForToken(code)`** — `GET /oauth/access_token` with client_id, secret, redirect_uri, code → returns short-lived token

**`getLongLivedToken(shortToken)`** — `GET /oauth/access_token?grant_type=fb_exchange_token` → returns `{ token, expiresIn }`

**`getFacebookPages(accessToken)`** — `GET /me/accounts` → returns user's Facebook Pages

**`getIGBusinessAccount(pageId, pageToken)`** — `GET /{pageId}?fields=instagram_business_account` → returns IG account or null

**`getIGProfile(igUserId, accessToken)`** — fetches profile fields: username, name, biography, picture, followers/follows/media counts

**`getIGMedia(igUserId, accessToken, limit=30)`** — fetches recent 30 posts with likes, comments, media info

**`calculateEngagementMetrics(posts, followersCount)`** — computes:

- avgEngagementRate = `(avgLikes + avgComments) / followers * 100`
- avgLikes, avgComments, postingFreqPerWk, contentMix (by media type)

**`extractHashtags(caption)`** — regex extracts `#` + word chars (including Cyrillic), lowercased, removes `#`

**`buildOAuthUrl(state)`** — constructs Facebook OAuth dialog URL with scopes: instagram_basic, instagram_manage_insights, pages_show_list, pages_read_engagement

---

### `export-script-docx.ts` — Client-side .docx Generator

**`downloadScriptAsDocx(script, meta_)`** — generates and downloads Word document:

- **`spacer(before, after)`** — empty paragraph with spacing
- **`rule()`** — horizontal rule paragraph
- **`meta(label, value)`** — bold purple label + regular value paragraph
- **`section(emoji, title)`** — bold dark-navy heading with emoji
- **`makeSceneTable(scenes)`** — 4-column table (Timecode, Visual, On-Screen Text, Audio), purple header, alternating row colors
- Full document: cover page, script overview, scene breakdown table, caption, hashtags, thumbnail idea, page header/footer
- `Packer.toBlob(doc)` → creates download link with filename `instaintel-script-v{n}-{title}.docx`

---

### `i18n/context.tsx`

**`LangProvider`** — React context provider

- State: `lang` default `"uz"` (Uzbek)
- On mount: hydrates from `localStorage` key `"instaintel_lang"`
- `setLang`: persists to localStorage, updates state
- Provides `{ lang, setLang, T }` where `T` is the translation object cast to `Translations` type

**`useLang()`** — hook returning `{ lang, setLang, T }`

---

### `i18n/translations.ts`

- `t` constant with two language objects: `uz` (Uzbek) and `en` (English)
- Sections: nav, sidebar, header, dashboard, competitors, analysis, insights, scripts, onboarding, upgrade
- ~300 keys per language, ~463 lines total
- `Translations` type: widened `DeepString<typeof t.en>` so all leaf values are `string`
- `Lang` type: `"uz" | "en"`

---

## Shared Packages

### `packages/ai/` — AI Prompt Templates

**`index.ts`** — barrel file re-exporting all prompt modules.

**`competitor-filter.ts`:**

- `buildCompetitorFilterPrompt({ niche, location, candidates })` — Claude prompt to filter + score competitor candidates, expects JSON `{ filtered: [{ handle, relevance_score, reasoning }], excluded_count, exclusion_reasons }`

**`video-analysis.ts`:**

- `buildVideoAnalysisPrompt({ transcript?, caption?, niche })` — Claude prompt to analyze single video, expects JSON with hook, pacing, sentiment, power words, etc.
- `buildNicheSummaryPrompt({ niche, location, postCount, analyses })` — Claude prompt to synthesize niche intelligence report across all analyzed posts

**`script-generation.ts`:**

- `buildScriptGenerationPrompt(params)` — Claude prompt to generate 3 video scripts with full scene breakdowns
- `ScriptGenerationParams` interface with all generation parameters

---

### `packages/db/` — Prisma ORM

**`index.ts`:**

- Singleton `PrismaClient` via globalThis (prevents hot-reload duplication)
- Dev mode logs: `["query", "error", "warn"]`; prod: `["error"]`
- Re-exports `* from @prisma/client`

**`prisma/schema.prisma`** — 10 models:

- `User` — clerkId, email, niche, location, brandVoice, plan, meta tokens
- `InstagramAccount` — 1:1 with User, profile snapshot + engagement metrics
- `Competitor` — tracked accounts with relevance score, source, confirmation
- `Post` — competitor posts with engagement estimates
- `VideoAnalysis` — 1:1 with Post, AI analysis results + Pinecone data
- `GeneratedScript` — script generation history
- `AnalysisJob` — async job tracking
- `UserPost` — user's own synced posts
- `AiUsageLog` — AI API usage tracking

---

## Configuration & Middleware

### `middleware.ts`

- `config.matcher`: excludes `_next` and static files, includes `/api`
- `isPublicRoute`: `/`, `/sign-in*`, `/sign-up*`, `/api/webhooks/*`
- **Mock mode** (no Clerk key or `USE_MOCK_DATA=true`): all routes public, pass-through `NextResponse.next()`
- **Production:** `clerkMiddleware` gates non-public routes — if no `userId`, redirects to `/sign-in?redirect_url`

### `app/layout.tsx`

- `metadata`: title "InstaIntel", description, keywords
- **`RootLayout`**: checks `USE_CLERK` (real key starts with `pk_` and not "placeholder")
  - With Clerk: wraps in `ClerkProvider` with dark theme (primary #7C3AED)
  - Without Clerk: no auth wrapper
  - Always: `<html lang="uz" class="dark">`, Inter font, `<LangProvider>`

### `app/page.tsx` — Landing Page

- Server component, no interactivity
- Nav: logo + "Sign in" + "Dashboard" CTA
- Hero: "Powered by Claude AI + Gemini + Whisper" badge, "Tell me your niche. I'll find who's winning."
- 3 feature cards: Competitor Discovery, Deep Content Analysis, Script Generation
- Footer: AI-estimated disclaimer

### `app/onboarding/page.tsx` — Onboarding Wizard

- 3-step client component form with progress bar
- Step 1: Instagram handle + niche
- Step 2: Location + target audience
- Step 3: Brand voice (4-option 2x2 grid) + products/services
- `handleSubmit()`: POST to `/api/user/onboard`, on success navigate to `/dashboard`

### `app/dashboard/layout.tsx`

- Fetches current user; if none, redirects to `/sign-in`
- Renders: `<Sidebar>` + `<Header>` + scrollable content area + `<OAuthToast>` (in Suspense)

### `app/dashboard/page.tsx` — Profile Tab

- **`getDashboardStats(clerkId)`**: mock mode returns hardcoded stats; live mode queries Prisma for user, instagramAccount, competitor count, post count
- `DashboardPage`: fetches stats, passes to `DashboardPageClient`

### `DashboardPageClient` — Profile Tab Client

- 4 `StatCard` components: Followers, Avg Engagement, Posts Analyzed, Competitors Tracked
- `ProfileOverview` component
- 5-step getting-started checklist with completion state from stats

### `app/dashboard/analysis/page.tsx` — Analysis Tab

- Client component with states: empty / running / results
- Fetches `/api/analyze/results` on mount
- `startAnalysis()`: POST to `/api/analyze/start`, polls job if pending
- Empty: dashed box + "Run Analysis" button
- Running: `AnalysisJobStatus` component
- Results: `CompetitorTable`, `EngagementTrendChart`, `ContentFormatPie`, `NicheSummaryCard`, `TopPostsGallery`

### `app/dashboard/competitors/page.tsx` — Competitors Tab

- Server component: `getConfirmedCompetitors(clerkId)` returns empty in mock mode, else queries confirmed competitors from DB
- Passes to `CompetitorsClient`

### `CompetitorsClient` — Competitors Tab Client

- State: `confirmed` list, `showDiscovery` toggle
- `handleConfirmed(results?)`: uses data from DiscoveryPanel if provided, else fetches from API
- Shows: discovery panel (when no competitors or "Discover more" clicked), stats row, confirmed list, how-it-works guide

### `app/dashboard/insights/page.tsx` — Insights Tab

- Client component, fetches `/api/analyze/results` on mount
- If `data.niche_summary` exists: shows 4 `InsightCard` components — Hook Patterns, Top Content Formats, Power Phrases, Trending Audio
- Empty: dashed box with lightbulb icon
- `InsightCard` — private: card with colored icon, title, children

### `app/dashboard/scripts/page.tsx` — Script Generator Tab

- Client component with form state: goal, platform, length, tone
- `generateScripts()`: POST to `/api/scripts/generate` with form values
- `copyScript(script, idx)`: formats full script to plain text, copies to clipboard, shows "Copied!" feedback for 2s
- Form controls: goal (3 buttons with emoji), platform (2 toggle), length (3 buttons), tone (4 buttons), generate button
- Results: 3-column grid of script cards with scene breakdown, copy + download .docx actions
- Empty state: dashed box with wand icon
