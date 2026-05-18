# Frontend

**Framework:** Next.js 15 (App Router)  
**Styling:** Tailwind CSS (dark mode default)  
**Icons:** Lucide React  
**Charts:** Recharts  
**Language:** TypeScript (strict mode)

---

## Pages & Routes

```
/                             Landing page
/sign-in                      Passphrase login
/onboarding                   3-step setup wizard
/upgrade                      Pricing / subscription
/dashboard                    Your Profile (Tab 1)
/dashboard/competitors        Competitor discovery (Tab 2)
/dashboard/analysis           Content analysis (Tab 3)
/dashboard/insights           Content insights (Tab 4)
/dashboard/hooks              Hook library (Tab 5)
/dashboard/scripts            Script generator (Tab 6)
```

---

## Page Details

### Landing Page (`app/page.tsx`)

Hero with headline and three feature highlights: Competitor Discovery, Deep Content Analysis, Script Generation. CTA links directly to `/dashboard`.

### Sign-in (`app/(auth)/sign-in/`)

Simple passphrase form. On success (`POST /api/auth/passphrase`), sets httpOnly cookie and redirects to `/dashboard`. No Clerk, no OAuth in dev.

### Onboarding (`app/onboarding/page.tsx`)

3-step wizard (client component):

1. **Step 1** — Instagram handle + niche/industry
2. **Step 2** — Location + target audience description
3. **Step 3** — Brand voice selection + products/services

Posts to `/api/user/onboard`. Redirects to `/dashboard` on completion.

### Dashboard Layout (`app/dashboard/layout.tsx`)

Wraps `DashboardProviders` (ScriptsContext) around all dashboard pages. Renders:
- **Sidebar** — 6-tab navigation, AI badge on Scripts, free-plan upgrade card
- **Header** — Mobile logo, UZ/EN language toggle, notifications bell, user avatar

### Profile Tab (`app/dashboard/page.tsx`)

Server component — fetches stats, renders `DashboardPageClient`:
- 4 stat cards: Followers, Avg Engagement Rate, Posts Analyzed, Competitors Tracked
- **ProfileOverview** component (fetches own Instagram data client-side)
- 5-step getting-started checklist

### Competitors Tab (`app/dashboard/competitors/`)

State machine: `idle → discovering → review → confirming → done`

- **DiscoveryPanel** — Full discovery flow with animated 4-step progress indicator
- **CandidateCard** — Candidate display with relevance score badge, source tag, AI reasoning
- **ConfirmedList** — Table of tracked competitors with post count and analysis status

### Analysis Tab (`app/dashboard/analysis/page.tsx`)

Three render states: empty state → running (animated job progress) → results

- **AnalysisJobStatus** — 5-step animated progress (Fetching, Transcribing, Analyzing, Extracting, Building)
- **CompetitorTable** — Sortable table with color-coded engagement rates
- **EngagementTrendChart** — 6-week line chart (Recharts)
- **ContentFormatPie** — Donut chart for video/image/carousel breakdown
- **NicheSummaryCard** — Hook styles, power phrases, best posting times
- **TopPostsGallery** — Top-performing posts with engagement score overlay

Also shows:
- Hashtag cloud
- Hook breakdown (by type, % distribution, Uzbek labels)
- Sentiment breakdown
- Pacing style breakdown
- Content format breakdown
- Top CTAs + power words

### Insights Tab (`app/dashboard/insights/page.tsx`)

Reads from `/api/analyze/results` (same data as Analysis tab, different presentation):
- Hook Patterns with effectiveness score progress bars
- Best Content Formats with engagement lift percentages
- Power Words tag cloud
- Trending Audio Categories list

### Hook Library Tab (`app/dashboard/hooks/page.tsx`)

Searchable, filterable library of all extracted hook texts from competitor posts:
- Search input filters by hook text content
- Type filter pills: All / Question / Shock / Challenge / Story / Statistic
- Sort options: Most Liked / Newest / A–Z
- Each hook card shows: text, competitor handle, likes/views, hook type badge, full caption toggle
- Copy button with "Nusxalandi!" feedback

### Script Generator Tab (`app/dashboard/scripts/page.tsx`)

Two sub-tabs: **Generate** (new scripts) and **History** (past generations)

**Generate tab:**
- Controls: goal (brand awareness / direct sales / lead gen), platform (Reels/Ads), length (15/30/60s), tone
- Output: 3 Uzbek-language script variations (via `ScriptsContext`, navigation-persistent)
- Each card: concept title, borrowed pattern, scene-by-scene breakdown, caption + hashtags, thumbnail idea
- Actions: Copy text to clipboard, Download as `.docx`

**History tab:**
- Loads from `/api/scripts/history`
- Grouped by generation session with collapsible script cards
- Download `.docx` from history entries

### Upgrade Page (`app/upgrade/page.tsx`)

Monthly/Annual billing toggle. Free vs Pro plan comparison. Stripe Checkout integration.

---

## Component Tree

```
app/layout.tsx
└── LangProvider (i18n, default UZ)
    └── Page content

app/dashboard/layout.tsx
└── DashboardProviders
    └── ScriptsProvider (ScriptsContext)
        ├── Sidebar
        │   ├── Nav items (6 tabs)
        │   │   └── Scripts nav: shows Loader2 spinner when generating
        │   └── Upgrade card (Free Plan)
        ├── Header
        │   ├── UZ / EN toggle
        │   ├── Notifications bell
        │   └── User avatar
        └── {page children}
            ├── dashboard/         → DashboardPageClient, ProfileOverview, StatCard[]
            ├── competitors/       → CompetitorsClient, DiscoveryPanel, ConfirmedList
            ├── analysis/          → AnalysisJobStatus, CompetitorTable, charts, NicheSummaryCard
            ├── insights/          → InsightCard[]
            ├── hooks/             → HookCard[], search/filter UI
            └── scripts/           → GenerateTab, HistoryTab, ScriptCard[]
```

---

## State Management

| Mechanism             | Used for                                                   |
| --------------------- | ---------------------------------------------------------- |
| `useState`            | Local component UI state (loading, form values, expanded)  |
| `useEffect` + `fetch` | Client-side data loading                                   |
| **ScriptsContext**    | Script generation state — persists across page navigation  |
| **LangContext**       | i18n language preference — persisted to `localStorage`     |
| Server components     | Initial data fetch (dashboard stats, competitors list)     |

### ScriptsContext (`lib/scripts-context.tsx`)

Provided at dashboard layout level. Holds:

```ts
{
  scripts: GeneratedScript[];
  loading: boolean;
  error: string | null;
  goal: Goal;
  platform: Platform;
  lengthSecs: Length;
  tone: Tone;
  generate: () => Promise<void>;  // AbortController + keepalive fetch
}
```

Navigation-persistent — generate on `/dashboard/scripts`, navigate away, come back, results are still there. The HTTP request uses `keepalive: true` so it continues even if the user navigates away.

---

## Internationalization (i18n)

Two languages supported:

| Language | Code | Status  |
| -------- | ---- | ------- |
| Uzbek    | `uz` | Default |
| English  | `en` | Toggle  |

**Implementation (`lib/i18n/`):**

```tsx
// context.tsx — Provider + hook
const { T, lang, setLang } = useLang();

// Usage
<h1>{T.dashboard.pageTitle}</h1>  // "Profilingiz" (uz) or "Your Profile" (en)
```

- Default: Uzbek (`"uz"`)
- Persisted in `localStorage["instaintel_lang"]`
- Hydrated after mount to avoid SSR mismatch
- Toggle in Header (UZ / EN pill buttons)
- Script output is **always Uzbek** regardless of UI language

**Translation file:** `lib/i18n/translations.ts` — ~500 lines, covers all pages and components.

---

## Styling Conventions

- **Dark mode only** — `bg-[#0d1117]` base, `bg-[#161b22]` cards
- **Brand gradient:** purple `#7C3AED` → pink `#EC4899` (class `gradient-brand`)
- **Cards:** `rounded-2xl border border-white/10 bg-white/5`
- **Buttons:** gradient for primary, `border border-white/20` for secondary
- **Custom animation:** `animate-fade-in` on page entry

---

## Key Libraries

| Library        | Purpose                            |
| -------------- | ---------------------------------- |
| `lucide-react` | Icon set (all icons)               |
| `recharts`     | Line chart, donut/pie charts       |
| `docx`         | Client-side `.docx` export         |
| `zod`          | Form + API request validation      |
| `stripe`       | Stripe Checkout redirect           |
| `apify-client` | Apify API (server-side only)       |

---

## Mock Data Files (`apps/web/mock/`)

| File                          | Content                              |
| ----------------------------- | ------------------------------------ |
| `user_profile.json`           | Mock user + Instagram account stats  |
| `user_posts.json`             | 6 mock posts with engagement data    |
| `competitors_discovery.json`  | 10 competitor candidates             |
| `analysis_results.json`       | Full analysis with niche summary     |
| `generated_scripts.json`      | 3 Uzbek script variations            |
