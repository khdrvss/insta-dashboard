# Frontend

**Framework:** Next.js 15 (App Router)  
**UI Library:** shadcn/ui (Radix + Tailwind CSS)  
**Charts:** Recharts  
**Language:** TypeScript  
**Styling:** Tailwind CSS (dark mode default)

## Pages & Routes

```
/                                       Landing page
/sign-in                                Authentication
/sign-up                                Registration
/onboarding                             3-step setup wizard
/upgrade                                Pricing / subscription
/dashboard                              Profile tab (Tab 1)
/dashboard/competitors                  Competitor discovery (Tab 2)
/dashboard/analysis                     Content analysis (Tab 3)
/dashboard/insights                     Content insights (Tab 4)
/dashboard/scripts                      Script generator (Tab 5)
```

### Landing Page (`app/page.tsx`)

Hero with headline "Tell me your niche. I'll find who's winning." Three feature highlights: Competitor Discovery, Deep Content Analysis, Script Generation. CTA links to `/dashboard`.

### Onboarding (`app/onboarding/page.tsx`)

3-step wizard:

1. Instagram handle + niche selection
2. Location + target audience
3. Brand voice (formal/friendly/bold/educational) + products/services

Posts to `/api/user/onboard`. Redirects to `/dashboard` on completion.

### Dashboard Layout (`app/dashboard/layout.tsx`)

Persistent layout with:

- **Sidebar** — 5-tab navigation with active state, AI badge on Scripts, free plan upgrade card
- **Header** — Mobile logo, language toggle (UZ/EN), notifications, user avatar
- **OAuthToast** — Instagram OAuth result notification (auto-dismiss 4s)

### Profile Tab (`app/dashboard/page.tsx`)

- 4 stat cards: Followers, Avg Engagement Rate, Posts Analyzed, Competitors Tracked
- ProfileOverview component with Instagram profile display
- 5-step getting-started checklist

### Competitors Tab (`app/dashboard/competitors/`)

State machine: `idle → discovering → review → confirming → done`

- **DiscoveryPanel** — Full discovery flow with animated 4-step progress
- **CandidateCard** — Candidate display with relevance score, source badge, AI reasoning
- **ConfirmedList** — Tracked competitors with analysis status

### Analysis Tab (`app/dashboard/analysis/page.tsx`)

Three states: empty, running (job progress), results

- **AnalysisJobStatus** — Animated 5-step progress (Fetching, Transcribing, Analyzing, Extracting, Building)
- **CompetitorTable** — Sortable table with color-coded engagement rates
- **EngagementTrendChart** — 6-week line chart (user vs top competitor)
- **ContentFormatPie** — Donut chart (video/image/carousel)
- **NicheSummaryCard** — Top patterns, hook styles, power phrases, best posting times
- **TopPostsGallery** — Top-performing posts with engagement overlay

### Insights Tab (`app/dashboard/insights/page.tsx`)

- Hook Patterns with effectiveness score bars
- Best Content Formats with engagement lift percentages
- Power Words tag cloud
- Trending Audio categories

### Scripts Tab (`app/dashboard/scripts/page.tsx`)

Generation form: goal, platform (reels/ads), length (15/30/60s), tone. Outputs 3 script variations with:

- Scene-by-scene breakdown (timestamp, visual, voiceover, text overlay)
- Caption with hashtags
- Thumbnail idea
- Copy to clipboard + download as .docx

## Component Tree

```
app/layout.tsx
├── ClerkProvider (conditional)
│   └── LangProvider (i18n)
│       └── Page Content
│
app/dashboard/layout.tsx
├── Sidebar
│   ├── Nav items (5 tabs)
│   ├── AI badge
│   └── Upgrade card
├── Header
│   ├── Language toggle
│   ├── Notifications
│   └── User avatar
├── OAuthToast
└── Page content
    ├── dashboard/  →  ProfileOverview, StatCard[]
    ├── competitors/ →  DiscoveryPanel, CandidateCard[], ConfirmedList
    ├── analysis/   →  AnalysisJobStatus, CompetitorTable,
    │                  EngagementTrendChart, ContentFormatPie,
    │                  NicheSummaryCard, TopPostsGallery
    ├── insights/   →  HookPatterns, ContentFormats, PowerWords
    └── scripts/    →  ScriptForm, ScriptResult[]
```

## State Management

No global state library. States are managed via:

- **React state** (`useState`) — Component-local UI state
- **Server state** — Direct fetch in server components or `useEffect` in client components
- **URL state** — Tab navigation, job IDs
- **Context** — i18n language (localStorage-persisted)

## Styling Conventions

- **Dark mode by default** — `class` strategy in Tailwind
- **Brand colors:** Purple (`#7C3AED`), Pink (`#EC4899`), Orange (`#F97316`)
- **Gradient:** Purple-to-pink (`bg-gradient-to-r from-purple-500 to-pink-500`)
- **Custom animations:** `shimmer`, `fade-in`, `accordion`
- **Component styling:** shadcn/ui CSS variables with dark theme

## Internationalization (i18n)

Two languages supported:

| Language | Code | Status    |
| -------- | ---- | --------- |
| Uzbek    | `uz` | Default   |
| English  | `en` | Available |

Implementation:

- React Context (`LangProvider`) wrapping the app
- `localStorage` persistence for language preference
- Hydrates after mount to avoid SSR mismatch
- Translations stored in `lib/i18n/translations.ts` (463 lines, ~300 keys per language)

Usage:

```tsx
const { t, language, setLanguage } = useLang();
// t('nav.dashboard') → "Dashboard" or "Boshqaruv paneli"
```

## Key Libraries

| Library                    | Purpose                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `@clerk/nextjs`            | Authentication UI + session management                                             |
| `@radix-ui/*`              | 10 accessible UI primitives (avatar, dialog, dropdown, tabs, toast, tooltip, etc.) |
| `lucide-react`             | Icon set                                                                           |
| `recharts`                 | Charts (line, pie, donut)                                                          |
| `tailwind-merge` + `clsx`  | Class name merging                                                                 |
| `class-variance-authority` | Component variants                                                                 |
| `stripe`                   | Payment processing                                                                 |
| `docx`                     | Client-side .docx export                                                           |
| `zod`                      | Form/API validation                                                                |
| `@anthropic-ai/sdk`        | Direct AI calls from API routes                                                    |

## Mock Data Files

| File                              | Content                           |
| --------------------------------- | --------------------------------- |
| `mock/user_profile.json`          | Mock user profile                 |
| `mock/user_posts.json`            | 6 mock posts with engagement data |
| `mock/competitors_discovery.json` | 10 competitor candidates          |
| `mock/analysis_results.json`      | Full analysis with niche summary  |
| `mock/generated_scripts.json`     | 3 script variations               |
