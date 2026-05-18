# API Reference

InstaIntel has a single API surface: **Next.js API Routes** in `apps/web/app/api/`. All AI, scraping, and data logic runs here — there is no separate Python/FastAPI backend.

**Base URL:** `http://localhost:3000`  
**Auth:** httpOnly cookie (`session=authenticated`) in dev; Clerk session in production  
**All routes** return JSON. Errors return `{ error: "message" }`.

---

## Analysis

### `POST /api/analyze/start`

Start content analysis for all confirmed competitors.

**Response (mock):** `{ job_id: "mock-job-001", status: "done", progress: 100, mock: true }`

**Response (live):** `{ job_id, status: "done", analysed_count: N }`

---

### `GET /api/analyze/results`

Get full analysis results — competitor stats, post breakdown, and aggregated intelligence.

**Response:**

```json
{
  "competitors": [
    {
      "id": "...",
      "handle": "buston_uz",
      "displayName": "Buston Village",
      "followersEst": 12400,
      "avg_likes": 340,
      "avg_comments": 22,
      "avg_views_est": 5800,
      "hook_examples": ["Toshkent yaqinida 3 xonali kotedj...", "..."],
      "value_prop_examples": ["Premium sifat, qulay narx", "..."],
      "top_hashtags": ["kotedj", "uysotuv", "toshkent"],
      "sentiment_breakdown": { "positive": 8, "neutral": 4, "negative": 1 },
      "pacing_dist": { "fast": 6, "medium": 5, "slow": 2 }
    }
  ],
  "top_posts": [
    {
      "id": "...",
      "caption": "...",
      "likesEst": 890,
      "commentsEst": 45,
      "hook_text": "Arzon narxda kotedj xohlaysizmi?",
      "hook_type": "question",
      "cta_text": "DM yuboring",
      "power_words": ["arzon", "premium", "qulay"],
      "effectiveness_score": 87,
      "score": 87
    }
  ],
  "engagement_trend": [
    { "week": "12 May", "avg_er": 4.2, "top_er": 7.8 }
  ],
  "niche_summary": {
    "top_hook_styles": [
      { "type": "question", "effectiveness_score": 85, "score": 85, "example": "Kotedj olmoqchimisiz?" }
    ],
    "top_content_formats": ["Ta'limiy", "Guvohnoma", "O'zgarish"],
    "power_phrases": ["arzon narx", "premium sifat", "tez yetkazib berish"],
    "best_posting_times": [
      { "time": "18:00–20:00", "days": "Juma, Shanba", "frequency": "yuqori" }
    ]
  },
  "hashtag_cloud": [
    { "tag": "kotedj", "count": 34 },
    { "tag": "uysotuv", "count": 28 }
  ],
  "hook_breakdown": [
    { "type": "Savol", "count": 18, "pct": 45 },
    { "type": "Shok", "count": 10, "pct": 25 }
  ],
  "sentiment_breakdown": [
    { "label": "Ijobiy", "count": 28, "pct": 70 }
  ],
  "pacing_breakdown": [
    { "label": "Tez sur'at", "count": 20, "pct": 50 }
  ],
  "content_format_breakdown": [
    { "label": "Ta'limiy (Educational)", "count": 15, "pct": 37 }
  ],
  "top_ctas": ["DM yuboring", "Bog'laning", "Havolaga o'ting"],
  "power_words": ["premium", "arzon", "yangi", "qulay"],
  "total_posts_analyzed": 40
}
```

---

### `GET /api/analyze/[jobId]`

Poll analysis job status.

**Response:** `{ job_id, status: "pending"|"running"|"done"|"failed", progress: 0-100, error? }`

---

## Competitors

### `GET /api/competitors`

List all confirmed competitors for current user.

**Response:** `{ competitors: [{ id, handle, displayName, relevanceScore, confirmed, _count: { posts: N } }] }`

---

### `POST /api/competitors/discover`

Run competitor discovery pipeline.

**Query params:** `?force=true` — bypass 7-day cache

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
      "aiReasoning": "Premium real estate developer in Tashkent region with active property listings"
    }
  ],
  "total_scanned": 47,
  "mock": false
}
```

---

### `DELETE /api/competitors/discover`

Clear all unconfirmed competitors (reset discovery cache).

**Response:** `{ deleted: N }`

---

### `POST /api/competitors/confirm`

Confirm selected competitors.

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

Remove a tracked competitor (hard delete).

**Response:** `{ deleted: true }`

---

### `PATCH /api/competitors/[id]`

Update competitor confirmation status.

**Request body:** `{ confirmed: true | false }`

**Response:** `{ updated: N }`

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

- `goal`: `"brand_awareness"` | `"direct_sales"` | `"lead_generation"`
- `platform`: `"reels"` | `"ads"`
- `lengthSecs`: `15` | `30` | `60`
- `tone`: `"formal"` | `"friendly"` | `"bold"` | `"educational"`

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
      "caption": "Buston Village — bu nafaqat uy, bu hayot tarzi. Batafsil: link in bio 👇",
      "hashtags": ["bustonvillage", "kotedj", "uysotuv", "toshkent", "premiumuy"],
      "thumbnail_idea": "Katta oyna va zamonaviy fasad — oltin soat nuri",
      "predicted_strength": "hook"
    }
  ]
}
```

**Rate limit:** 5 scripts/month on free plan → 429 if exceeded

---

## Profile

### `GET /api/profile`

Get user profile + Instagram account.

**Response:** `{ user: { id, email, niche, location, brandVoice, plan }, instagram: {...} | null, connected: bool }`

---

### `GET /api/profile/posts`

Get user's Instagram posts sorted by engagement rate.

**Response:** `{ posts: [{ id, mediaType, caption, likesCount, commentsCount, engagementRate, postedAt }] }`

---

### `POST /api/profile/posts`

Trigger manual re-sync of Instagram posts.

**Response:** `{ synced: true }` or `{ redirect: "/api/auth/instagram" }` if token expired

---

## Auth (Instagram OAuth)

### `GET /api/auth/instagram`

Initiate Instagram OAuth flow. Redirects to Facebook OAuth dialog.

### `GET /api/auth/instagram/callback`

Handle OAuth callback. Exchanges code for long-lived token, fetches profile + posts, saves to DB.

**Redirect on success:** `/dashboard?ig_connected=1`

**Error codes:** `ig_error=access_denied|no_pages|no_ig_business|invalid_state|server_error`

---

## User

### `POST /api/user/onboard`

Save onboarding form data.

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

## Billing

### `POST /api/billing/create-checkout`

Create Stripe Checkout session.

**Request body:** `{ priceId?: string, interval?: "monthly" | "annual" }`

**Response:** `{ url: "https://checkout.stripe.com/..." }`  
**Dev mode (no Stripe keys):** `{ url: "/dashboard?upgrade=demo" }`

---

## Webhooks

### `POST /api/webhooks/stripe`

Handle Stripe webhook events. Verifies signature with `STRIPE_WEBHOOK_SECRET`.

**Events:**
- `checkout.session.completed` → set user plan to `"pro"`
- `customer.subscription.deleted` → set user plan to `"free"`

**Response:** `{ received: true }`
