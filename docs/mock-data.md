# Mock Data Strategy

InstaIntel uses a **mock data system** that allows full development and demonstration without any external API keys. Set `USE_MOCK_DATA=true` (default in `.env.local`) to enable.

## How It Works

### Detection

```typescript
// apps/web/lib/mock-auth.ts
export function isMockMode(): boolean {
  return (
    process.env.USE_MOCK_DATA === "true" ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith(
      "pk_test_placeholder",
    )
  );
}
```

```python
# apps/api/main.py
USE_MOCK = os.getenv("USE_MOCK_DATA", "false").lower() == "true"
```

### Mock Auth Bypass

In mock mode, Clerk authentication is bypassed:

- **Middleware** (`apps/web/middleware.ts`): All routes are public
- **Root layout** (`apps/web/app/layout.tsx`): ClerkProvider is not rendered
- **Auth helpers** (`apps/web/lib/mock-auth.ts`): Returns `dev_mock_user_001` with mock session

### Mock Mode Scope

| Feature              | Behavior                                                  |
| -------------------- | --------------------------------------------------------- |
| Authentication       | Auto-logged in as mock user                               |
| Onboarding           | Works normally (saves to SQLite)                          |
| Profile              | Returns `mock/user_profile.json`                          |
| Posts                | Returns `mock/user_posts.json`                            |
| Competitor Discovery | Returns `mock/competitors_discovery.json` (2s delay)      |
| Content Analysis     | Returns `mock/analysis_results.json` (simulated progress) |
| Insights             | Returns analysis results data                             |
| Script Generation    | Returns `mock/generated_scripts.json` (1.5s delay)        |
| Instagram OAuth      | Not available (mocked as connected)                       |
| Stripe Payments      | Redirects to `/dashboard?upgrade=demo`                    |
| Upstash Redis        | Graceful degradation                                      |
| Pinecone             | Graceful degradation (empty results)                      |

## Mock Data Files

### Frontend (`apps/web/mock/`)

| File                         | Description                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `user_profile.json`          | User "stroycorp_demo" in construction/renovation niche, 12.4K followers, 4.73% ER |
| `user_posts.json`            | 6 posts (4 Reels, 2 Carousels, 1 Image) with engagement rates 4.48%-10.81%        |
| `competitors_discovery.json` | 10 candidates from 2 sources, scores 68-94                                        |
| `analysis_results.json`      | 5 analyzed competitors, 6 top posts, 6-week trends, niche summary                 |
| `generated_scripts.json`     | 3 complete script variations with 4 scenes each                                   |

### Backend (`apps/api/mock/`)

| File                  | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| `competitors.json`    | 10 competitors in Tashkent construction niche                       |
| `video_analyses.json` | 5 analyzed Reels with transcripts, engagement scores, hook analysis |
| `ad_library.json`     | 5 Meta Ad Library entries with spend ranges and ad copy             |

## Mock Niche (Default)

The mock data revolves around a consistent niche: **construction/renovation in Tashkent, Uzbekistan**.

- **User handle:** `stroycorp_demo`
- **Brand voice:** Bold
- **Language mix:** Russian/Uzbek (realistic for the region)
- **Competitors:** 10 accounts with 6.2K-67.8K followers
- **Content types:** Renovation reveals, cost breakdowns, before/after, checklists

## Adding Mock Data for a New Feature

1. Create the JSON fixture file in the appropriate `mock/` directory
2. In your route handler/service, check `USE_MOCK_DATA`:
   ```typescript
   if (isMockMode()) {
     await sleep(1500); // Simulate network delay
     return NextResponse.json(mockData);
   }
   ```
   ```python
   if USE_MOCK:
       return MockModel(**mock_data)
   ```
3. Ensure the mock data structure matches the real API response type

## Testing with Mock Data

The mock data system enables:

- **Full UI development** without any API keys
- **Demonstration/trials** of the complete product
- **Automated testing** of all UI states (loading, empty, error, success)
- **Offline development** without internet access

To switch to live mode, set `USE_MOCK_DATA=false` in `.env.local` and configure the required API keys (see [Setup & Installation](setup.md)).
