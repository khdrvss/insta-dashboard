# InstaIntel — Instagram Marketing Intelligence Dashboard

**Tagline:** Raqobatchilaringizni toping. Ularning sirlari ustida ustunlik qiling. Uzbekistonda g'olib content yarating.

InstaIntel is an AI-powered Instagram intelligence platform built specifically for Uzbek real estate businesses (initially for **buston.village** — a premium cottage village project near Tashkent). It discovers competitors, analyzes their top-performing content, and generates ready-to-publish Uzbek-language video scripts.

> **Stack:** Next.js 15 · OpenRouter (Gemini) · Apify · Prisma (SQLite) · Turborepo  
> **No FastAPI. No Redis. No Pinecone. No Whisper. No Clerk in dev.**

## Quick Start

```bash
npm install
cp .env.example .env.local  # add OPENROUTER_API_KEY + APIFY_API_TOKEN
npm run dev
```

The app runs in **mock-auth mode** by default (passphrase `19801980` via httpOnly cookie). Visit `http://localhost:3000`.

---

## Table of Contents

| Doc                                       | Description                                              |
| ----------------------------------------- | -------------------------------------------------------- |
| [Architecture](architecture.md)           | Monorepo structure, data flow, design decisions          |
| [Flows & Diagrams](flows.md)              | Mermaid diagrams for all key pipelines                   |
| [Logic Reference](logic.md)              | Every API route, component, and utility explained        |
| [API Reference](api.md)                  | Next.js API routes with request/response shapes          |
| [Database Schema](database.md)           | Prisma models and relationships                          |
| [Frontend](frontend.md)                  | Pages, components, i18n, styling                         |
| [Setup & Installation](setup.md)         | Environment variables, configuration                     |
| [Deployment](deployment.md)              | Vercel deployment guide                                  |
| [Development Guide](development.md)      | Conventions, adding features, testing                    |
| [Mock Data Strategy](mock-data.md)       | Mock mode architecture and usage                         |

---

## Feature Overview

### 🔍 Competitor Discovery
- Scrapes Instagram via Apify `instagram-hashtag-scraper` using Uzbek real estate hashtags (`uysotuv`, `kotedj`, `kvartirasotuv`, etc.)
- AI-filters candidates with Gemini 2.5 Flash — strict real estate-only, score ≥ 70
- 7-day DB cache to avoid repeat scraping
- `DELETE /api/competitors/discover?force=true` bypasses cache

### 📊 Competitor Analysis
- Scrapes top posts for each confirmed competitor via Apify `apify/instagram-scraper`
- Analyzes each post with Gemini: hook type, pacing, sentiment, CTA, power words, hashtags
- Aggregates into: hashtag cloud, hook breakdown, sentiment/pacing distributions, top CTAs
- Full Uzbek-language UI with English in parentheses

### 💡 Insights
- Computationally derived from DB data (no extra AI tokens)
- Shows: winning hook styles, top content formats, power phrases, best posting times
- Uses `buildNicheSummary()` — pure data aggregation, no additional AI calls

### 🎬 Script Generation
- Uzbek-only output using `google/gemini-2.0-flash-001` (cheaper, Uzbek-friendly)
- 3 variations with full scene breakdowns, captions, hashtags, thumbnail ideas
- Navigation-persistent via `ScriptsContext` React context at layout level
- HTTP request kept alive with `keepalive: true` — survives page navigation
- Export as `.docx` via `docx` npm package

---

## Auth

Development uses a **passphrase cookie** (`session=authenticated`), not Clerk. All `getCurrentUser()` calls return `{ clerkId: "user_001" }` in dev. No OAuth, no JWT complexity.

Production-ready for Clerk by setting real `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
