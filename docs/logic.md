# Logic Reference — All Functions & Components

Complete reference of every API route handler, React component, context, and utility in the current codebase.

> **Note:** There is no FastAPI/Python backend. All logic runs inside Next.js API routes.

---

## Table of Contents

- [Next.js API Routes](#nextjs-api-routes)
- [React Contexts](#react-contexts)
- [Frontend Pages](#frontend-pages)
- [Dashboard Components](#dashboard-components)
- [Library Utilities](#library-utilities)
- [Shared Packages](#shared-packages)
- [Configuration & Middleware](#configuration--middleware)

---

## Next.js API Routes

All routes in `apps/web/app/api/`. They run on Vercel serverless (or locally with `next dev`).

---

### `POST /api/analyze/start` (`analyze/start/route.ts`)

**Purpose:** Trigger content analysis for all confirmed competitors.

**Logic:**

1. Auth check via `getCurrentUser()` — returns 401 if no session
2. **Mock mode** (`USE_MOCK_DATA=true`): Returns `{ job_id: "mock-job-001", status: "done", progress: 100, mock: true }` immediately
3. Fetches user with confirmed competitors from DB
4. Returns 400 if no confirmed competitors
5. For each competitor, calls Apify `apify/instagram-scraper` to fetch posts (max 50)
6. For each post, sends `buildVideoAnalysisPrompt(caption, niche)` to OpenRouter (Gemini 2.5 Flash)
7. Parses VideoAnalysis JSON, upserts `Post` + `VideoAnalysis` records in DB
8. Returns `{ job_id, status: "done", analysed_count }`

---

### `GET /api/analyze/results` (`analyze/results/route.ts`)

**Purpose:** Return full analysis with competitor stats, post breakdown, and aggregated intelligence.

**Logic:**

1. Auth check
2. **Mock mode:** Returns fixture from `mock/analysis_results.json`
3. Fetches user with confirmed competitors → each competitor's `Post[]` + `VideoAnalysis[]`
4. **Per-competitor stats** (via `safeParseArray()` on JSON string fields):
   - `avg_likes`, `avg_comments`, `avg_views_est` — arithmetic mean
   - `hook_examples` — top 3 real hook texts from VideoAnalysis
   - `value_prop_examples` — top 3 value propositions
   - `top_hashtags` — top 10 by frequency using `countFreq()`
   - `sentiment_breakdown` — count per sentiment label
   - `pacing_dist` — count per pacing label
5. **Global aggregates** across all competitors:
   - `hashtag_cloud` — top 25 hashtags with frequency count
   - `hook_breakdown` — percentage of each hook type, Uzbek labels via `hookLabelUz()`
   - `sentiment_breakdown` — Uzbek labels via `sentimentLabelUz()`
   - `pacing_breakdown` — Uzbek labels via `pacingLabelUz()`
   - `content_format_breakdown` — Uzbek names via `formatLabelUz()`
   - `top_ctas` — most common call-to-action texts
   - `power_words` — most frequent power words
   - `total_posts_analyzed` — total count
6. **`buildNicheSummary(competitors, allPosts, analyses)`** — pure DB computation:
   - `top_hook_styles` — top 3 hooks by effectiveness_score average
   - `top_content_formats` — top 3 formats by frequency
   - `power_phrases` — top 10 power words across all posts
   - `best_posting_times` — day of week distribution in Uzbek (Dushanba, Seshanba, etc.)
   - No AI API calls — 100% computational
7. Returns complete JSON: `{ competitors, top_posts, engagement_trend, niche_summary, hashtag_cloud, hook_breakdown, sentiment_breakdown, pacing_breakdown, content_format_breakdown, top_ctas, power_words, total_posts_analyzed }`

**Key helpers in this file:**
- `safeParseArray(val)` — `JSON.parse(val ?? "[]")` with catch → returns `[]`
- `countFreq(arr)` — returns `Map<string, number>` sorted by count desc
- `formatLabelUz(format)` — maps `"educational"` → `"Ta'limiy"`, `"testimonial"` → `"Guvohnoma"`, etc.
- `sentimentLabelUz(s)` — maps `"positive"` → `"Ijobiy"`, `"neutral"` → `"Neytral"`, etc.
- `pacingLabelUz(p)` — maps `"fast"` → `"Tez sur'at"`, `"slow"` → `"Sekin sur'at"`, etc.
- `hookLabelUz(h)` — maps `"question"` → `"Savol"`, `"shock"` → `"Shok"`, etc.

**Important:** Hook scores return BOTH `score` and `effectiveness_score` fields for component compatibility.

---

### `GET /api/analyze/[jobId]` (`analyze/[jobId]/route.ts`)

**Purpose:** Poll analysis job status.

**Logic:**

1. Auth check
2. If `jobId === "mock-job-001"` → returns `{ status: "done", progress: 100 }`
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

1. Reads `code`, `error`, `state` from query params
2. Verifies state token starts with user's ID
3. **OAuth pipeline:** exchange code → long-lived token → FB pages → IG business account → fetch profile + 30 posts → calculate metrics → upsert to DB
4. Error codes: `access_denied`, `no_pages`, `no_ig_business`, `invalid_state`, `server_error`

---

### `POST /api/competitors/discover` (`competitors/discover/route.ts`)

**Purpose:** Run competitor discovery via Apify + AI filter.

**Logic:**

1. Auth check
2. **Mock mode:** 2s delay, returns `competitors_discovery.json` fixture
3. Fetches user; validates has `niche` and `location`
4. **Cache check:** queries DB for competitors created within last 7 days; if found and not `?force=true`, returns cached
5. **Live discovery:**
   - `buildRealEstateTags()` — returns hardcoded Uzbek real estate hashtags: `["uysotuv", "uytoshkent", "kvartirasotuv", "kotedj", "yaniqurilis"]`
   - Calls Apify `instagram-hashtag-scraper` for each tag
   - Aggregates + deduplicates raw candidates
   - Builds prompt via `buildCompetitorFilterPrompt({ niche, location, candidates })` from `@instagram-dashboard/ai`
   - Sends to OpenRouter (Gemini 2.5 Flash), parses JSON response with regex
   - Saves candidates to DB with `confirmed=false`
6. Returns `{ candidates, total_scanned, mock: false }`

### `DELETE /api/competitors/discover`

**Purpose:** Clear unconfirmed (cached) competitors so discovery re-runs fresh.

**Logic:**
1. Auth check
2. `prisma.competitor.deleteMany({ where: { userId, confirmed: false } })`
3. Returns `{ deleted: count }`

---

### `POST /api/competitors/confirm` (`competitors/confirm/route.ts`)

**Purpose:** Confirm selected competitors.

**Logic:**

1. Auth check
2. Zod validation: array of 1-20 competitors with handle, relevanceScore (0-100), discoverySource
3. **Mock mode:** Returns mocked success
4. `Promise.all` — upserts each by `userId_handle` unique key, sets `confirmed=true`
5. Returns `{ confirmed: count, competitors: results }`

---

### `DELETE /api/competitors/[id]` + `PATCH /api/competitors/[id]`

- **DELETE:** Ownership check → hard delete competitor record
- **PATCH:** Updates `confirmed` boolean field

---

### `POST /api/scripts/generate` (`scripts/generate/route.ts`)

**Purpose:** Generate 3 Uzbek-language video script variations via AI.

**Logic:**

1. Auth check
2. Zod validation: `{ goal, platform, lengthSecs: 15|30|60, tone }`
3. **Mock mode:** 1.5s delay, returns `mock/generated_scripts.json` fixture
4. Fetches user; 404 if not found
5. **Rate limit:** counts `GeneratedScript` records this month; if >= 5 on free plan → 429
6. Builds prompt via `buildScriptGenerationPrompt(params)` from `@instagram-dashboard/ai`
   - Language: UZBEK ONLY (lotin alifbosi)
   - Context: buston.village, Toshkent yaqinidagi premium kotedj qishlog'i
   - Requests exactly 3 variations with full scene breakdowns
7. Sends to OpenRouter using model `SCRIPT_MODEL ?? "google/gemini-2.0-flash-001"` with `max_tokens: 4096`
8. Extracts JSON from response using regex `/\{[\s\S]*\}/`
9. **DB persist** (fire-and-forget, non-blocking):
   - `JSON.stringify(parsed_scripts)` ← critical: must be string for Prisma SQLite
   - `Promise.all([prisma.generatedScript.create(...), prisma.aiUsageLog.create(...)]).catch(e => console.error(e))`
10. Returns `{ scripts: parsed_scripts.scripts }` immediately (doesn't wait for DB)

---

### Other routes (unchanged from original)

- `GET /api/profile` — user profile + Instagram account
- `GET /api/profile/posts` — user's own posts sorted by engagement
- `POST /api/profile/posts` — trigger manual Instagram re-sync
- `POST /api/user/onboard` — save onboarding form (Zod validated)
- `POST /api/billing/create-checkout` — Stripe Checkout session
- `POST /api/webhooks/stripe` — handle `checkout.session.completed` / `customer.subscription.deleted`

---

## React Contexts

### `ScriptsContext` (`apps/web/lib/scripts-context.tsx`)

**Purpose:** Lift all script generation state to layout level so it persists across navigation.

**Exported types:**

```typescript
export interface GeneratedScript {
  variation: number;
  concept_title: string;
  hook_type: string;
  borrowed_pattern: string;
  scenes: Array<{ timecode: string; visual: string; on_screen_text: string | null }>;
  caption: string;
  hashtags: string[];
  thumbnail_idea: string;
  predicted_strength: "hook" | "retention" | "cta" | "balanced";
}
```

**State:**
- `scripts: GeneratedScript[]` — persists until next generate call
- `loading: boolean` — true while fetch is in flight
- `error: string | null` — error message if generation fails
- `goal: Goal` — "brand_awareness" | "direct_sales" | "lead_generation"
- `platform: Platform` — "reels" | "ads"
- `lengthSecs: Length` — 15 | 30 | 60
- `tone: Tone` — "formal" | "friendly" | "bold" | "educational"

**`generate()` logic:**

1. Cancels previous `AbortController` (if active) — prevents duplicate in-flight requests
2. Creates new `AbortController`, stores in `controllerRef`
3. Sets `loading=true`, `error=null`
4. `fetch("/api/scripts/generate", { method: "POST", keepalive: true, signal, body: JSON.stringify({...}) })`
   - `keepalive: true` keeps the HTTP connection alive even if the browser page changes
5. On success: `setScripts(data.scripts)`, `setLoading(false)`
6. On error (non-abort): `setError(message)`, `setLoading(false)`
7. On abort: silently ignored (new request is already in flight)

**Placement in tree:** `DashboardLayout` → `DashboardProviders` → `ScriptsProvider` wraps ENTIRE layout including `<Sidebar>`.

---

### `LangContext` (`apps/web/lib/i18n/context.tsx`)

- State: `lang` ("uz" | "en"), default "uz"
- Persists to `localStorage["instaintel_lang"]`
- Provides `{ lang, setLang, T }` where `T` is translation object

---

## Frontend Pages

### `app/dashboard/layout.tsx`

- Server component; calls `getCurrentUser()` — redirects to `/sign-in` if no session
- Wraps entire layout in `<DashboardProviders>` (includes Sidebar + Header + content)
- Structure: `DashboardProviders → div.flex.h-screen → [Sidebar, div.flex-col → [Header, main → {children}]] + OAuthToast`

---

### `app/dashboard/page.tsx` — Profile Tab

- **`getDashboardStats(clerkId)`**: server-side; mock mode returns hardcoded stats; live queries Prisma for user, instagramAccount, competitor count, post count
- Client: 4 `StatCard` + `ProfileOverview` + 5-step getting-started checklist

---

### `app/dashboard/analysis/page.tsx` — Analysis Tab (Uzbek)

- **Client component**, fetches `/api/analyze/results` on mount
- 9 Uzbek sections with inline sub-components:
  1. **Stats bar** — Raqobatchilar, Tahlil qilingan postlar, O'rtacha jalb koeff., Unique hashtaglar
  2. **CompetitorCard** (expandable) — per-competitor stats, hook examples, value props, hashtags
  3. **Hook breakdown** — progress bars, Uzbek labels, percentage
  4. **Sentiment breakdown** — Ijobiy/Neytral/Salbiy with %
  5. **Pacing breakdown** — Tez/O'rtacha/Sekin with %
  6. **Content format breakdown** — Ta'limiy/Guvohnoma/O'zgarish etc. with %
  7. **Hashtag buluti** — top 25 tags sized by frequency
  8. **Top posts list** (expandable) — caption, CTA, power words
  9. **Kuchli so'zlar / Power phrases** — pink chip badges

- **Inline components:**
  - `Section({ title, children })` — consistent card wrapper with violet left border
  - `CompetitorCard({ c })` — expandable per-competitor card
  - `TopPostsList({ posts })` — expandable post list with full caption

---

### `app/dashboard/scripts/page.tsx` — Script Generator Tab

- **Client component** — reads ALL state from `useScripts()` context
- Controls: goal (3 buttons), platform (2 toggle), length (3 buttons), tone (4 buttons)
- **Loading state:** Shows "Skriptlar yaratilmoqda… Boshqa sahifalarga o'tishingiz mumkin" banner (not a blocking spinner)
- **Script cards:** Full-width stacked layout, `text-base` font for scene text, `text-lg font-bold` for titles
- **`copyScript(script, idx)`:** Formats script to plain text (with typed `sc` parameter), copies to clipboard, shows checkmark for 2s
- Download: `downloadScriptAsDocx(script, { platform, lengthSecs, tone })`

---

### `app/dashboard/insights/page.tsx` — Insights Tab

- Fetches `/api/analyze/results` on mount
- If `data.niche_summary` exists: shows 4 `InsightCard` sections
  - Hook Patterns (from `niche_summary.top_hook_styles`)
  - Top Content Formats (from `niche_summary.top_content_formats`)
  - Power Phrases (chip badges from `niche_summary.power_phrases`)
  - Best Posting Times (from `niche_summary.best_posting_times`)
- Empty state when no data

---

### `app/dashboard/competitors/page.tsx` — Competitors Tab

- Server component with `CompetitorsClient` doing: discovery panel, stats row, confirmed list
- `DiscoveryPanel` — 5-phase: idle → discovering → review → confirming → done

---

## Dashboard Components

### `Sidebar` (`components/dashboard/Sidebar.tsx`)

- 5 nav items: Profile, Competitors, Analysis, Insights, Scripts
- Imports `useScripts()` from `scripts-context`
- **Scripts nav item behavior:**
  - When `scriptsLoading && !active`: shows `<Loader2 animate-spin>` (pink) instead of "AI" badge
  - When `scriptsLoading && active`: shows `<Loader2 animate-spin>` (violet) alongside ChevronRight
- `isActive(href, exact?)`: exact match for `/dashboard`, `startsWith` for others

---

### `NicheSummaryCard` (`components/dashboard/analysis/NicheSummaryCard.tsx`)

- Props: `summary` (NicheSummary)
- **Handles both** `score` and `effectiveness_score` fields: `(hook.score ?? hook.effectiveness_score ?? 0)`
- Sections: executive summary · winning patterns · best hook styles · power phrases · posting times
- `top_content_formats` section: `(summary.top_content_formats ?? []).map(...)` (null-safe)

---

### `CandidateCard`, `ConfirmedList`, `DiscoveryPanel`

All in `components/dashboard/competitors/`. Logic unchanged from original — see original `logic.md` for details.

---

### `AnalysisJobStatus` (`components/dashboard/analysis/AnalysisJobStatus.tsx`)

- Mock mode: simulates progress every 500ms, completes after 5 steps
- Live mode: polls `/api/analyze/${jobId}` every 3s
- Note: In current implementation, analysis start route returns `status: "done"` synchronously — polling is short-lived

---

## Library Utilities

### `mock-auth.ts`

**`isMockMode()`** — true if `USE_MOCK_DATA=true` OR Clerk key is missing/placeholder

**`getCurrentUser()`** — reads `session` httpOnly cookie; if `"authenticated"` returns `{ id: "user_001", clerkId: "user_001" }`; else returns `null`

**`getAuth()`** — returns `{ userId: "user_001" }` in dev mode

**`MOCK_USER`** — constant `{ id: "dev_mock_user_001", clerkId: "user_001", ... }`

---

### `export-script-docx.ts`

**`downloadScriptAsDocx(script, meta)`** — generates Word document client-side:
- Scene table: 4 columns (Timecode, Visual, On-Screen Text, Audio) with purple header
- Sections: script overview → scene breakdown → caption → hashtags → thumbnail idea
- `Packer.toBlob(doc)` → creates `<a>` download link
- Filename: `instaintel-script-v{idx+1}-{slug}.docx`

---

### `utils.ts`

- `cn(...inputs)` — `clsx` + `tailwind-merge`
- `formatNumber(n)` — `1500000 → "1.5M"`, `1500 → "1.5K"`
- `formatEngagementRate(rate)` — `"3.45%"`
- `sleep(ms)` — Promise setTimeout
- `fetchWithRetry(url, opts?, retries=3, backoffMs=1000)` — exponential backoff on 5xx/network errors

---

## Shared Packages

### `packages/ai/` — AI Prompt Templates

**`competitor-filter.ts`** — v2.0.0:
- `buildCompetitorFilterPrompt({ niche, location, candidates })` — strict Uzbek real estate filter
- Hard exclusion list: content agencies, CRM tools, renovation companies, education platforms
- Client context: "buston.village — Toshkent yaqinidagi premium kotedj qishlog'i loyihasi"
- Minimum score: **70** (was 50 in v1)
- Max results: **10** (was 15 in v1)
- Instruction: "When in doubt — EXCLUDE"
- Expected JSON: `{ filtered: [{ handle, relevance_score, reasoning }], excluded_count, exclusion_reasons }`

**`video-analysis.ts`**:
- `buildVideoAnalysisPrompt({ transcript?, caption?, niche })` — analyzes single Instagram post
- Extracts: hook_text, hook_type, hook_duration_s, value_prop, cta_text, pacing_style, sentiment, content_format, power_words

**`script-generation.ts`** — v2.0.0:
- `buildScriptGenerationPrompt(params)` — entirely in Uzbek
- "BARCHA matn O'ZBEK TILIDA bo'lishi SHART (lotin alifbosi)"
- Context: O'zbekiston, Toshkent, buston.village, premium uy-joy bozori
- Goal/tone/platform maps translated to Uzbek
- Requests 3 variations with: concept_title, hook_type, borrowed_pattern, scenes[], caption, hashtags[], thumbnail_idea, predicted_strength

---

### `packages/db/` — Prisma ORM

**Singleton `PrismaClient`** via `globalThis` (prevents Next.js hot-reload duplication)

**Key models:**
- `User` — clerkId (PK), niche, location, brandVoice, plan, productsServices, targetAudience
- `Competitor` — handle, displayName, relevanceScore, confirmed, discoverySource, userId FK
- `Post` — competitorId FK, likesEst, commentsEst, viewsEst, caption, hashtags (JSON string), mediaType, postedAt
- `VideoAnalysis` — postId FK (1:1), hookText, hookType, pacingStyle, sentiment, ctaText, powerWords (JSON string), effectivenessScore, contentFormat
- `GeneratedScript` — userId FK, goal, platform, lengthSecs, tone, scriptJson (JSON string of scripts array)
- `AiUsageLog` — userId, model, promptTokens, completionTokens, durationMs, feature

**Array/object columns stored as JSON strings** — all TEXT columns holding arrays require `JSON.stringify` on write and `JSON.parse` on read.

---

## Configuration & Middleware

### `middleware.ts`

- Excludes `_next`, static files; includes `/api`
- Public routes: `/`, `/sign-in*`, `/sign-up*`, `/api/webhooks/*`
- **Mock/dev mode:** all routes public, pass-through `NextResponse.next()`
- **Production:** `clerkMiddleware` gates all protected routes

### `app/layout.tsx`

- `<html lang="uz" class="dark">` — Uzbek default language
- `LangProvider` wraps entire app
- Conditionally uses `ClerkProvider` only if real Clerk key detected

### `app/dashboard/DashboardProviders.tsx`

```typescript
"use client";
import { ScriptsProvider } from "@/lib/scripts-context";

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return <ScriptsProvider>{children}</ScriptsProvider>;
}
```

This client boundary allows the server component `layout.tsx` to pass children into the context provider. The provider wraps the **entire dashboard layout** — Sidebar, Header, and page content — so the Sidebar can read `scriptsLoading` state.
