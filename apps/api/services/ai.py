"""
AI service — OpenRouter-powered (Claude, Gemini, etc.)
All structured JSON output. Prompt versions tracked.
"""

import os
import json
import openai
from tenacity import retry, stop_after_attempt, wait_exponential
from typing import Optional

_client = openai.OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY", ""),
    base_url="https://openrouter.ai/api/v1",
)
MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")


def _chat(prompt: str, max_tokens: int = 2048) -> str:
    response = _client.chat.completions.create(
        model=MODEL,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content or ""


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def filter_competitors_with_ai(
    niche: str,
    location: str,
    candidates: list[dict],
) -> list[dict]:
    """Use AI to filter and score competitor relevance"""
    prompt = f"""You are an Instagram marketing expert. Filter these candidate accounts to find the 15 most relevant BUSINESS competitors for:
- Niche: {niche}
- Location: {location}

Candidates: {json.dumps(candidates, ensure_ascii=False)}

Return JSON: {{"filtered": [{{"handle": "str", "relevance_score": 0-100, "reasoning": "str"}}], "excluded_count": 0}}
Sort by relevance_score descending. Include only score >= 50."""

    raw = _chat(prompt, max_tokens=2048)
    data = json.loads(raw[raw.find("{"):raw.rfind("}") + 1])
    return data.get("filtered", [])


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def analyze_video_content(
    video_url: str,
    caption: str,
    niche: str,
) -> dict:
    """Analyze video content — hook, pacing, CTA, power words"""
    prompt = f"""Analyze this Instagram Reel content for the {niche} niche.
Caption: {caption}
Video URL: {video_url}

Return JSON with: hook_text, hook_type (question/shock/promise/story/statistic/challenge),
hook_duration_s, value_prop, cta_text, pacing_style (fast_cut/talking_head/b_roll/text_only/mixed),
sentiment, content_format, power_words (array)"""

    raw = _chat(prompt, max_tokens=1024)
    return json.loads(raw[raw.find("{"):raw.rfind("}") + 1])


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def summarize_niche_patterns(
    niche: str,
    location: str,
    analyses: list[dict],
) -> dict:
    """AI synthesizes top patterns across all analyzed videos"""
    prompt = f"""You analyzed {len(analyses)} top-performing Instagram posts in the "{niche}" niche targeting "{location}".

Data: {json.dumps(analyses[:20], ensure_ascii=False)}

Summarize: top 5 winning patterns, best hook styles, content formats, power phrases, best posting times.
Return as structured JSON with keys: winning_patterns, best_hook_styles, top_content_formats, power_phrases, best_posting_patterns, summary"""

    raw = _chat(prompt, max_tokens=2048)
    return json.loads(raw[raw.find("{"):raw.rfind("}") + 1])
