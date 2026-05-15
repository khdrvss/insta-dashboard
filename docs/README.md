# InstaIntel — Instagram Marketing Intelligence Dashboard

**Tagline:** Tell me your niche — I'll find who's winning, why they're winning, and write better content for you.

InstaIntel is an AI-powered SaaS platform that helps Instagram marketers discover competitors, analyze top-performing content, and generate optimized scripts. It uses Anthropic Claude for AI analysis, OpenAI Whisper for audio transcription, and Pinecone for vector-based pattern retrieval.

## Quick Start

```bash
npm install
cp .env.example .env.local  # edit as needed
npm run dev
```

The app runs in **mock mode** by default (`USE_MOCK_DATA=true`) — no external API keys required. Visit `http://localhost:3000`.

---

## Table of Contents

| Doc                                 | Description                                  |
| ----------------------------------- | -------------------------------------------- |
| [Architecture](architecture.md)     | System design, monorepo structure, data flow |
| [Setup & Installation](setup.md)    | Environment setup, Docker, configuration     |
| [API Reference](api.md)             | FastAPI + Next.js API routes                 |
| [Database Schema](database.md)      | Prisma models, relationships                 |
| [Frontend](frontend.md)             | Pages, components, i18n, styling             |
| [Services](services.md)             | AI, scraping, workers, caching               |
| [Deployment](deployment.md)         | Vercel, Render, Docker, CI/CD                |
| [Development Guide](development.md) | Conventions, adding features, testing        |
| [Mock Data Strategy](mock-data.md)  | Mock mode architecture and usage             |
