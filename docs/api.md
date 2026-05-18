# API Reference

All server logic lives in **Next.js API Routes** at `apps/web/app/api/`. There is no separate backend.

**Base URL (dev):** `http://localhost:3000`  
**Auth:** httpOnly cookie (`session=authenticated`) set by `/api/auth/passphrase`  
**All routes** return JSON. Errors return `{ error: "message" }` with an appropriate HTTP status code.

---

## Auth

### `POST /api/auth/passphrase`

Set the dev session cookie via passphrase.

**Request body:**
```json
{ "passphrase": "19801980" }
```

**Response (success):** `{ ok: true }` + sets `session=authenticated` httpOnly cookie (30-day expiry)  
**Response (failure):** `401 { error: "Invalid passphrase" }`

---

### `GET /api/auth/instagram`

Initiate Instagram OAuth flow. Redirects to Facebook OAuth dialog.

---

### `GET /api/auth/instagram/callback`

Handle OAuth callback. Exchanges code for a long-lived token, fetches profile + posts, saves to DB.

**Redirect on success:** `/dashboard?ig_connected=1`  
**Error redirect:** `/dashboard?ig_error=access_denied|no_pages|no_ig_business|invalid_state|server_error`

---

### `POST /api/auth/instagram/sync`

Force a re-sync of the connected Instagram account (posts + profile stats).

**Response:** `{ synced: true, postsAdded: N }` or `{ redirect: "/api/auth/instagram" }` if token expired

---

## Competitors

### `POST /api/competitors/discover`

Run competitor discovery pipeline.

**Query params:** `?force=true` — bypass 7-day DB cache

**Response:**
```json
{
  "candidates": [
    {
      "handle": "yangikotedj_uz",
      "displayName": "Yangi Kotedj",
      "followersEst": 8400,
      "relevanceScore": 82,
      "source": "hashtag_search",
      "aiReasoning": "Premium real estate developer in Tashkent with active property listings"
    }
  ],
  "total_scanned": 47,
  "excluded_count": 31,
  "mock": false
}
```

**Logic:** Apify hashtag scraper → Claude/Gemini filters candidates (score ≥ 70) → cached in DB for 7 days

---

### `DELETE /api/competitors/discover`

Clear all unconfirmed competitors (reset discovery cache).

**Response:** `{ deleted: N }`

---

### `GET /api/competitors`

List all confirmed competitors for the current user.

**Response:** `{ competitors: [{ id, handle, displayName, relevanceScore, confirmed, _count: { posts: N } }] }`

---

### `POST /api/competitors/confirm`

Confirm selected discovery candidates as tracked competitors.

**Request body:**
```json
{
  "candidates": [
    {
      "handle": "yangikotedj_uz",
      "displayName": "Yangi Kotedj",
      "followersEst": 8400,
      "relevanceScore": 82,
      "discoverySource": "hashtag_search"
    }
  ]
}
```

**Response:** `{ confirmed: N, competitors: [...] }`

---

### `DELETE /api/competitors/[id]`

Remove a tracked competitor (hard delete with cascade to posts + analyses).

**Response:** `{ deleted: true }`

---

### `PATCH /api/competitors/[id]`

Update competitor confirmation status.

**Request body:** `{ confirmed: true | false }`  
**Response:** `{ updated: N }`

---

## Analysis

### `POST /api/analyze/start`

Trigger content analysis for all confirmed competitors.

**Mock response:** `{ job_id: "mock-job-001", status: "done", progress: 100, mock: true }`

**Live response:** `{ job_id, status: "done", analysed_count: N }`

**Logic:**
1. Fetches confirmed competitors from DB
2. For each competitor: Apify `instagram-scraper` → up to 50 posts
3. For each post: `buildVideoAnalysisPrompt()` → OpenRouter (Gemini 2.5 Flash)
4. Upserts `Post` + `VideoAnalysis` records in DB
5. Returns when all done (synchronous — no job queue in current impl)

---

### `GET /api/analyze/results`

Return full analysis results — competitor stats, post breakdown, and aggregated intelligence.

**Response:**
```json
{
  "competitors": [
    {
      "handle": "yangikotedj_uz",
      "followersEst": 8400,
      "avg_likes": 340,
      "avg_comments": 22,
      "avg_views_est": 5800,
      "hook_examples": ["Toshkent yaqinida 3 xonali kotedj..."],
      "top_hashtags": ["kotedj", "uysotuv"],
      "sentiment_breakdown": { "positive": 8, "neutral": 4 },
      "pacing_dist": { "fast": 6, "medium": 5 }
    }
  ],
  "top_posts": [
    {
      "id": "...",
      "hook_text": "Arzon narxda kotedj xohlaysizmi?",
      "hook_type": "question",
      "cta_text": "DM yuboring",
      "power_words": ["arzon", "premium"],
      "score": 87
    }
  ],
  "engagement_trend": [{ "week": "12 May", "avg_er": 4.2 }],
  "hashtag_cloud": [{ "tag": "kotedj", "count": 34 }],
  "hook_breakdown": [{ "type": "Savol", "count": 18, "pct": 45 }],
  "sentiment_breakdown": [{ "label": "Ijobiy", "count": 28, "pct": 70 }],
  "pacing_breakdown": [{ "label": "Tez sur'at", "count": 20, "pct": 50 }],
  "content_format_breakdown": [{ "label": "Ta'limiy", "count": 15, "pct": 37 }],
  "top_ctas": ["DM yuboring", "Bog'laning"],
  "power_words": ["premium", "arzon", "qulay"],
  "total_posts_analyzed": 40,
  "niche_summary": {
    "top_hook_styles": [{ "type": "question", "score": 85, "example": "Kotedj olmoqchimisiz?" }],
    "top_content_formats": ["Ta'limiy", "Guvohnoma"],
    "power_phrases": ["arzon narx", "premium sifat"],
    "best_posting_times": [{ "time": "18:00–20:00", "days": "Juma, Shanba" }]
  }
}
```

**Note:** All aggregation is pure DB math — no extra AI calls.

---

### `GET /api/analyze/[jobId]`

Poll analysis job status (used during long-running jobs).

**Response:** `{ job_id, status: "pending"|"running"|"done"|"failed", progress: 0-100, error? }`

---

### `POST /api/analyze/scrape`

Scrape posts for a specific competitor on demand (used internally by analysis pipeline).

**Request body:** `{ competitorId: string, maxPosts?: number }`  
**Response:** `{ scraped: N, competitorHandle: string }`

---

## Hooks Library

### `GET /api/hooks`

Return all extracted hook texts from analyzed competitor posts.

**Query params:**
- `?type=question` — filter by hook type (`question`, `shock`, `challenge`, `story`, `statistic`)
- `?search=kotedj` — full-text search within hook text

**Response:**
```json
{
  "hooks": [
    {
      "id": "...",
      "hookText": "Toshkentda 3 xonali kotedj olmoqchimisiz?",
      "hookType": "question",
      "competitorHandle": "yangikotedj_uz",
      "competitorName": "Yangi Kotedj",
      "caption": "Full post caption...",
      "likesEst": 890,
      "viewsEst": 14200,
      "contentFormat": "reel",
      "ctaText": "DM yuboring",
      "sentiment": "positive"
    }
  ]
}
```

**Sorted by:** likesEst desc, then viewsEst desc  
**Limit:** 200 most recent analyses

---

## Scripts

### `POST /api/scripts/generate`

Generate 3 Uzbek-language video script variations.

**Request body:**
```json
{
  "goal": "brand_awareness",
  "platform": "reels",
  "lengthSecs": 30,
  "tone": "friendly"
}
```

| Field        | Values                                                      |
| ------------ | ----------------------------------------------------------- |
| `goal`       | `"brand_awareness"` · `"direct_sales"` · `"lead_generation"` |
| `platform`   | `"reels"` · `"ads"`                                         |
| `lengthSecs` | `15` · `30` · `60`                                          |
| `tone`       | `"formal"` · `"friendly"` · `"bold"` · `"educational"`     |

**Response:**
```json
{
  "scripts": [
    {
      "variation": 1,
      "concept_title": "Toshkent yaqinida orzular uyi",
      "hook_type": "question",
      "borrowed_pattern": "Muammo-yechim-natija formulasi",
      "scenes": [
        {
          "timecode": "0:00–0:05",
          "visual": "Aero-video: ko'k osmon fonida zamonaviy kotedj",
          "on_screen_text": "Toshkentdan 20 daqiqa. Narxini bilasizmi?"
        }
      ],
      "caption": "Buston Village — bu nafaqat uy, bu hayot tarzi. 👇",
      "hashtags": ["bustonvillage", "kotedj", "uysotuv"],
      "thumbnail_idea": "Katta oyna va zamonaviy fasad — oltin soat nuri",
      "predicted_strength": "hook"
    }
  ]
}
```

**Rate limit:** 5 scripts/month on free plan → `429` if exceeded  
**Note:** Script output is always in Uzbek regardless of UI language setting

---

### `GET /api/scripts/history`

Return previously generated scripts for the current user.

**Response:**
```json
{
  "history": [
    {
      "id": "...",
      "goal": "brand_awareness",
      "platform": "reels",
      "lengthSecs": 30,
      "tone": "friendly",
      "scripts": [...],
      "createdAt": "2026-05-18T10:00:00Z"
    }
  ]
}
```

---

## Profile

### `GET /api/profile`

Get user profile + connected Instagram account.

**Response:** `{ user: { id, niche, location, brandVoice, plan }, instagram: {...} | null, connected: bool }`

---

### `GET /api/profile/posts`

Get user's own Instagram posts sorted by engagement rate.

**Response:** `{ posts: [{ id, mediaType, caption, likeCount, commentCount, engagementRate, postedAt }] }`

---

## User

### `POST /api/user/onboard`

Save onboarding form data. Creates or updates the User record.

**Request body:**
```json
{
  "niche": "uy-joy real estate Toshkent",
  "location": "Toshkent",
  "instagramHandle": "bustonvillage",
  "targetAudience": "Toshkentda premium uy izlayotgan oilalar",
  "brandVoice": "friendly",
  "productsServices": "Premium kotedj qishlog'i, 3-5 xonali kotedj uylari"
}
```

**Response:** `{ success: true, user: { id, niche } }`

---

## Usage

### `GET /api/usage`

Get current month's AI usage stats for the logged-in user.

**Response:**
```json
{
  "scriptCount": 3,
  "scriptLimit": 5,
  "totalTokens": 84200,
  "estimatedCostUsd": 0.032,
  "byOperation": [
    {
      "operation": "script_generation",
      "count": 3,
      "inputTokens": 61000,
      "outputTokens": 12000,
      "costUsd": 0.024
    }
  ]
}
```

**Cost model used:** input `$0.075/M tokens`, output `$0.30/M tokens` (Gemini 2.0 Flash pricing)

---

## Billing

### `POST /api/billing/create-checkout`

Create a Stripe Checkout session for plan upgrade.

**Request body:** `{ priceId?: string, interval?: "monthly" | "annual" }`

**Response:** `{ url: "https://checkout.stripe.com/..." }`  
**Dev mode (no Stripe keys):** `{ url: "/dashboard?upgrade=demo" }`

---

## Webhooks

### `POST /api/webhooks/stripe`

Handle Stripe webhook events. Verifies signature with `STRIPE_WEBHOOK_SECRET`.

**Events handled:**
- `checkout.session.completed` → sets user `plan = "pro"`
- `customer.subscription.deleted` → sets user `plan = "free"`

**Response:** `{ received: true }`
