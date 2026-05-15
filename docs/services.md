# Services

## AI Services (`apps/api/services/ai.py`)

Core AI integration layer using Anthropic Claude (primary), OpenAI Whisper (transcription), and Google Gemini (fallback).

### Functions

#### `filter_competitors_with_ai(candidates, niche)`

Ranks competitor candidates by relevance using Claude with structured JSON output.

- **Input:** Raw candidate list + niche description
- **Output:** Ranked candidates with relevance scores (0-100) + reasoning
- **Retry:** 3 attempts with exponential backoff

#### `analyze_video_content(caption, transcript, niche)`

Deep content analysis of a single post.

- **Extracts:** Hook text, hook type, value proposition, CTA, pacing, sentiment, power words
- **Prompt:** `packages/ai/prompts/video-analysis.ts`
- **Retry:** 3 attempts

#### `summarize_niche_patterns(analyses)`

Synthesizes patterns across all analyzed videos for a niche.

- **Output:** Top winning patterns, best hook styles, power phrases, recommended formats
- **Retry:** 3 attempts

#### `transcribe_audio(audio_path)`

Transcribes video audio using OpenAI Whisper.

- **Input:** Path to downloaded audio file
- **Output:** Full transcript text
- **File cleaned up after processing**

### Retry Configuration

```
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
```

---

## Scraper (`apps/api/services/scraper.py`)

Data scraping service with retry logic and mock fallback.

### Functions

#### `discover_competitors_from_hashtags(niche, location, hashtags)`

Discovers competitor accounts using Apify Instagram hashtag scraper.

- **Mock mode:** Returns `competitors.json` fixtures
- **Live mode:** Uses `apify-client` with configured actor

#### `fetch_competitor_posts(handle, limit=30)`

Fetches recent posts from a competitor.

- **Mock mode:** Returns generated mock posts
- **Live mode:** Apify Instagram scraper

#### `query_meta_ad_library(search_terms, limit=10)`

Queries official Meta Ad Library API for active ads.

- **Mock mode:** Returns `ad_library.json` fixtures
- **Live mode:** Meta Ad Library API with search terms

---

## Meta Graph API (`apps/api/services/meta_graph.py`)

Official Meta Graph API client for Instagram Business accounts.

### Functions

#### `fetch_ig_media(ig_user_id, access_token, limit=30)`

Fetches recent Instagram posts with `likes`, `comments`, `video_views`.

#### `fetch_ig_profile(ig_user_id, access_token)`

Fetches Instagram Business account profile (followers, follows, media count).

#### `fetch_post_insights(post_id, access_token, metric)`

Fetches per-post insights (impressions, reach, engagement, video_views).

---

## Script Generator (`apps/api/services/script_generator.py`)

RAG-powered script generation using Claude.

### Flow

1. Accepts `goal`, `platform`, `tone`, `length`, `niche`, `patterns`
2. Builds prompt with structured winning hooks and formats
3. Calls Claude for 3 script variations
4. Each variation includes: 4 scenes, caption, hashtags, thumbnail idea

### Output Structure

```json
{
  "scripts": [
    {
      "title": "The Hidden Cost Reveal",
      "goal": "brand_awareness",
      "tone": "bold",
      "scenes": [
        {
          "scene": 1,
          "timestamp": "0:00-0:05",
          "visual": "Description of visual",
          "voiceover": "Voiceover text",
          "textOverlay": "On-screen text"
        }
      ],
      "caption": "Full caption...",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "thumbnailIdea": "Description of thumbnail"
    }
  ]
}
```

---

## Vector Search (`apps/api/services/vector_search.py`)

Pinecone vector database integration for RAG-powered script generation.

### Functions

#### `upsert_analysis(analysis_data, niche)`

Stores video analysis embeddings in Pinecone by niche namespace.

- **Graceful degradation:** Returns silently if `PINECONE_API_KEY` is unset

#### `query_top_patterns(niche, top_k=5)`

Retrieves top patterns from vector store for RAG-based generation.

- **Graceful degradation:** Returns empty array if Pinecone is unavailable

---

## Analysis Worker (`apps/api/workers/analysis_worker.py`)

Background worker for async content analysis. Full pipeline:

```
1. Fetch all confirmed competitors
2. For each competitor:
   a. Fetch recent posts (up to 30)
   b. Estimate engagement scores
   c. Select top 10% by engagement
   d. For each top post:
      - Download video (if Reel)
      - Transcribe audio via Whisper
      - Analyze via Claude
      - Delete temp files
   e. Upsert analysis to Pinecone
3. Generate niche summary
4. Cache results (7-day TTL)
```

### Engagement Estimation Algorithm

```python
score = ((likes + comments * 2) / max(views, 1)) * 1000 * 5
```

Capped at 100.

### Caching

- 7-day TTL per analyzed competitor: `instaintel:analysis:{competitor_id}`
- If cached analysis exists, competitor is skipped

---

## Caching (`apps/api/utils/cache.py`)

Redis-based caching layer with MD5 key hashing.

### Configuration

| Cache Type                 | TTL    | Key Prefix             |
| -------------------------- | ------ | ---------------------- |
| Analyzed competitor videos | 7 days | `instaintel:analysis:` |
| Generated scripts          | 1 day  | `instaintel:script:`   |

- **Graceful degradation:** Returns `None` if Redis is unavailable
- **Key format:** MD5 hash of the unique identifier

---

## Rate Limiting (`apps/api/utils/rate_limit.py`)

| Tier | Limit              |
| ---- | ------------------ |
| Free | 10 requests/minute |
| Pro  | 60 requests/minute |

Uses `slowapi` library with remote address key function.
