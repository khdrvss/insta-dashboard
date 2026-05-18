# Development Guide

## Project Conventions

### Code Style

- **TypeScript** — Strict mode, all types explicit
- **No comments** in source unless explaining non-obvious logic
- Follow existing patterns when adding new features

### File Naming

| Pattern             | Example                              |
| ------------------- | ------------------------------------ |
| `page.tsx`          | Next.js page components              |
| `layout.tsx`        | Next.js layout components            |
| `ComponentName.tsx` | React components (PascalCase)        |
| `route.ts`          | Next.js API route handlers           |
| `util-name.ts`      | Utility modules (kebab-case)         |
| `*.json`            | Mock fixture data (`apps/web/mock/`) |

### Git Commit Style

Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`  
Focus on "why", not "what".

---

## Architecture Principles

> **No separate backend.** All logic — AI calls, scraping, DB queries — runs inside Next.js API routes. One `npm run dev`, one `vercel deploy`.

- **Server components** fetch initial data (no client-side waterfalls for first paint)
- **Client components** handle interactivity, forms, and context
- **Mock mode** (`USE_MOCK_DATA=true`) every feature must work with fixture data
- **SQLite arrays stored as JSON strings** — always `JSON.stringify()` on write, `JSON.parse()` on read

---

## Adding a New Feature

### 1. New Dashboard Tab

```bash
# 1. Create the page
apps/web/app/dashboard/new-tab/page.tsx

# 2. Add to Sidebar nav
apps/web/components/dashboard/Sidebar.tsx → NAV_ITEMS

# 3. Add translations (both uz and en)
apps/web/lib/i18n/translations.ts → nav.newTab, ...

# 4. Create API route (if needed)
apps/web/app/api/new-tab/route.ts
```

### 2. Server Component + Client Component Pattern

```tsx
// page.tsx — server component: fetches data
export default async function NewTabPage() {
  const user = await getCurrentUser();
  const data = process.env.USE_MOCK_DATA === "true"
    ? mockData
    : await prisma.someModel.findMany({ where: { userId: user.id } });
  return <NewTabClient data={data} />;
}

// NewTabClient.tsx — client component: interactivity + translations
"use client";
export function NewTabClient({ data }) {
  const { T } = useLang();
  return <div>{T.newTab.title}</div>;
}
```

### 3. New API Route

```tsx
// apps/web/app/api/new-feature/route.ts
import { getAuth as auth } from "@/lib/mock-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";
import { z } from "zod";

const schema = z.object({ field: z.string() });

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Mock mode
  if (process.env.USE_MOCK_DATA === "true") {
    return NextResponse.json({ result: "mock" });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  // ... logic ...
  return NextResponse.json({ result: "ok" });
}
```

### 4. New DB Model

Add to `packages/db/prisma/schema.prisma`:

```prisma
model NewModel {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  data      String   @default("[]") // JSON array stored as TEXT
  createdAt DateTime @default(now()) @map("created_at")
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("new_models")
}
```

Then:
```bash
npm run db:push      # dev (no migration file)
npm run db:generate  # regenerate Prisma client
```

### 5. New Translations

```ts
// lib/i18n/translations.ts — add to both uz and en objects
uz: {
  newTab: {
    title: "Yangi sahifa",
    emptyState: "Ma'lumot yo'q",
  }
},
en: {
  newTab: {
    title: "New Tab",
    emptyState: "No data yet",
  }
}
```

Usage in component:
```tsx
const { T } = useLang();
<h1>{T.newTab.title}</h1>
```

---

## Mock Data Strategy

Every feature **must work in mock mode** without any API keys.

**Pattern:**
```ts
if (process.env.USE_MOCK_DATA === "true") {
  await new Promise(r => setTimeout(r, 1000)); // simulate latency
  return NextResponse.json(mockFixture);
}
```

**Mock files live in** `apps/web/mock/*.json`  
**Keep mock data realistic** — same shape as live API responses, Uzbek-language content.

---

## UI Component Conventions

- Dark theme always — `bg-[#0d1117]` base, `bg-white/5` cards
- Each component handles: loading skeleton, empty state, error state, success state
- Use `animate-pulse` for loading skeletons, `animate-fade-in` for page entry

```tsx
export function MyComponent({ data, isLoading, error }) {
  if (isLoading) return <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />;
  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (!data?.length) return <EmptyState />;
  return <div className="space-y-4">{/* content */}</div>;
}
```

---

## Next.js API Route Conventions

- **Zod** validation for all POST/PUT request bodies
- **Auth check first** — always check `userId` before any DB query
- **Error responses** — `{ error: "human-readable message" }` with HTTP status
- **Mock branch at top** — check `USE_MOCK_DATA` before any external calls
- **Try/catch** around external calls (Apify, OpenRouter) with graceful degradation

---

## Common Tasks

### Add a new AI prompt

```ts
// packages/ai/prompts/new-prompt.ts
export function buildNewPrompt({ niche, ...params }: Params): string {
  return `You are an expert...
  
  Niche: ${niche}
  
  Return valid JSON: { ... }`;
}
```

Import in the API route:
```ts
import { buildNewPrompt } from "@instagram-dashboard/ai";
```

### Add a new Apify scrape

```ts
const { ApifyClient } = await import("apify-client");
const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

const run = await apify.actor("apify/instagram-scraper").call({
  usernames: [handle],
  resultsLimit: 50,
});
const { items } = await apify.dataset(run.defaultDatasetId).listItems();
```

### Debug mock vs live

```bash
# Switch to live mode temporarily
USE_MOCK_DATA=false npm run dev

# Or add ?debug=1 and log in the route handler
console.log("[route] user:", userId, "mock:", process.env.USE_MOCK_DATA);
```

---

## Linting & Type Checking

```bash
npm run lint         # ESLint
npm run type-check   # TypeScript strict mode check
```

TypeScript errors must be fixed before pushing — CI will block on them.

---

## Architecture Decision Records

### Why no separate Python backend?

Next.js API routes on Vercel handle all AI + scraping. The 10s timeout is sufficient for current operations (synchronous scrape + analyze). Removing the FastAPI layer eliminates one entire deployment, one set of env vars, and all cross-service auth complexity.

### Why OpenRouter instead of direct Anthropic/OpenAI?

One API key covers all models. Easy to switch from Gemini 2.0 Flash to Claude Sonnet without code changes — just update `OPENROUTER_MODEL`. Gemini 2.0-flash-001 produces excellent Uzbek (Latin script) output at lower cost than Claude.

### Why SQLite in dev?

Zero config — `npm install` and go. Prisma makes switching to PostgreSQL trivial (`DATABASE_URL` only). Arrays stored as JSON strings is the only real difference.

### Why passphrase auth in dev?

No Clerk account, no OAuth app, no redirect URI setup needed. One env var (`PASSPHRASE`) and one httpOnly cookie. Production-ready Clerk swap is supported via real `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

### Why ScriptsContext at layout level?

Script generation takes 5–15 seconds. Without context, navigating away from `/dashboard/scripts` would abort the request and lose results. Context + `keepalive: true` ensures the HTTP request continues and results are available when the user returns.
