# Development Guide

## Project Conventions

### Code Style

- **TypeScript** — Strict mode, all types explicit
- **Python** — PEP 8 (via Ruff or Black)
- **No comments** in source code unless explaining non-obvious logic
- Follow existing patterns when adding new features

### File Naming

| Pattern             | Example                       |
| ------------------- | ----------------------------- |
| `page.tsx`          | Page components               |
| `layout.tsx`        | Layout components             |
| `ComponentName.tsx` | React components (PascalCase) |
| `route.ts`          | Next.js API route handlers    |
| `util-name.ts`      | Utility modules (kebab-case)  |
| `service_name.py`   | Python services (snake_case)  |

### Git Commit Style

- Concise, focused on "why" not "what"
- Conventional commits preferred: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`

---

## Adding a New Feature

### 1. Frontend Page

```tsx
// apps/web/app/dashboard/new-feature/page.tsx
export default async function NewFeaturePage() {
  const data = await fetch(...)
  return <NewFeatureClient data={data} />
}
```

### 2. Server Component → Client Component Pattern

```tsx
// page.tsx (server) fetches data
// FeatureClient.tsx (client) handles interactivity
```

### 3. API Route (if needed)

```tsx
// apps/web/app/api/new-feature/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  // validate with Zod, call DB, return Response
}
```

### 4. FastAPI Route (if heavy processing)

```python
# apps/api/routes/new_feature.py
@router.post("/new-feature")
async def new_feature(request: Request):
    data = await request.json()
    return {"result": "processed"}
```

### 5. DB Model (if needed)

Add to `packages/db/prisma/schema.prisma`, then:

```bash
npm run db:push     # dev
npm run db:generate # regenerate Prisma client
```

### 6. Translations (if UI copy)

Add keys to both language objects in `apps/web/lib/i18n/translations.ts`.

---

## Mock Data Strategy

Every feature should work in mock mode (`USE_MOCK_DATA=true`) without external dependencies.

- **Frontend mock data:** `apps/web/mock/*.json`
- **API mock data:** `apps/api/mock/*.json`
- **Pattern:** Check `USE_MOCK_DATA` env var → return fixture → skip external call

See [Mock Data Strategy](mock-data.md) for full details.

---

## UI Component Conventions

- Use `shadcn/ui` components from `components/ui/` (generated via `components.json`)
- Component variants via `class-variance-authority`
- Class merging via `cn()` utility (`tailwind-merge` + `clsx`)
- Dark theme by default
- Each component handles: loading, empty, error, and success states

### Example Component Structure

```tsx
interface Props {
  data?: SomeType;
  isLoading?: boolean;
  error?: string;
}

export function MyComponent({ data, isLoading, error }: Props) {
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState />;
  return <div>{/* actual content */}</div>;
}
```

---

## Service Layer Conventions

### Python Services

- All external API calls use `@retry` decorator (3 attempts, exponential backoff)
- Mock fallback: check `os.getenv("USE_MOCK_DATA") == "true"` → return fixtures
- Graceful degradation: AI, vector DB, and cache services silently fall back when dependencies are unavailable

### Next.js API Routes

- Zod validation for all POST/PUT request bodies
- Error responses: `{ "error": "human-readable message" }` with appropriate HTTP status
- Mock fallback: check `isMockMode()` → return fixture data with simulated delay

---

## Testing

### Frontend Testing

- No testing framework currently configured
- Manual testing: `npm run dev` with mock data

### Backend Testing

- No testing framework currently configured
- Manual testing: run FastAPI with `uvicorn main:app --reload`, test via curl/Postman

### Linting & Type Checking

```bash
npm run lint          # ESLint (Next.js) + Ruff/FastAPI linting
npm run type-check    # TypeScript strict mode
```

---

## Adding Dependencies

### npm packages

```bash
npm install <package> --workspace=<workspace>
# or add to specific workspace's package.json manually
```

### Python packages

```bash
cd apps/api
pip install <package>
pip freeze > requirements.txt
```

---

## Common Tasks

### Add a new dashboard tab

1. Create page at `apps/web/app/dashboard/new-tab/page.tsx`
2. Add link in `Sidebar.tsx`
3. Add translations in `translations.ts`
4. Add route handler if needed

### Add a new AI prompt

1. Create file in `packages/ai/prompts/new-feature.ts`
2. Export the prompt function
3. Add corresponding Python handler in `apps/api/services/ai.py` or Next.js route

### Add a new external API integration

1. Add env variables to `.env.example` and `ENV_KEYS_NEEDED.txt`
2. Create service file in `apps/api/services/`
3. Add retry logic and graceful degradation
4. Add mock fixture data fallback
5. Register in `main.py` router (if new route file)

---

## Architecture Decision Records

### Why Two Backends?

Next.js API routes on Vercel have a 10s timeout — too short for AI analysis. FastAPI on Render handles long-running tasks (transcription, AI analysis, scraping).

### Why No State Management Library?

The app has minimal client-side state. Most data is fetched server-side or via simple `useEffect` fetches. If complexity grows, consider Zustand or TanStack Query.

### Why SQLite in Dev?

Zero-config local development. Prisma makes switching to PostgreSQL trivial — just change `DATABASE_URL`.
