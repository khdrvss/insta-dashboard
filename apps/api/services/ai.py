"""
AI service — Claude, Whisper, Gemini integrations
All structured JSON output. Prompt versions tracked.
"""

import os
import json
import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential
from typing import Optional

_claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def filter_competitors_with_ai(
    niche: str,
    location: str,
    candidates: list[dict],
) -> list[dict]:
    """Use Claude to filter and score competitor relevance"""
    prompt = f"""You are an Instagram marketing expert. Filter these candidate accounts to find the 15 most relevant BUSINESS competitors for:
- Niche: {niche}
- Location: {location}

Candidates: {json.dumps(candidates, ensure_ascii=False)}

Return JSON: {{"filtered": [{{"handle": "str", "relevance_score": 0-100, "reasoning": "str"}}], "excluded_count": 0}}
Sort by relevance_score descending. Include only score >= 50."""

    message = _claude.messages.create(
        model=MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text
    data = json.loads(raw[raw.find("{"):raw.rfind("}") + 1])
    return data.get("filtered", [])


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def analyze_video_content(
    video_url: str,
    caption: str,
    niche: str,
    transcript: Optional[str] = None,
) -> dict:
    """Analyze video content — hook, pacing, CTA, power words"""
    prompt = f"""Analyze this Instagram Reel content for the {niche} niche.
Caption: {caption}
{f"Transcript: {transcript}" if transcript else ""}
Video URL: {video_url}

Return JSON with: hook_text, hook_type (question/shock/promise/story/statistic/challenge),
hook_duration_s, value_prop, cta_text, pacing_style (fast_cut/talking_head/b_roll/text_only/mixed),
sentiment, content_format, power_words (array), audio_track_name"""

    message = _claude.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text
    return json.loads(raw[raw.find("{"):raw.rfind("}") + 1])


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def summarize_niche_patterns(
    niche: str,
    location: str,
    analyses: list[dict],
) -> dict:
    """Claude synthesizes top patterns across all analyzed videos"""
    prompt = f"""You analyzed {len(analyses)} top-performing Instagram posts in the "{niche}" niche targeting "{location}".

Data: {json.dumps(analyses[:20], ensure_ascii=False)}

Summarize: top 5 winning patterns, best hook styles, content formats, power phrases, best posting times, trending audio.
Return as structured JSON with keys: winning_patterns, best_hook_styles, top_content_formats, power_phrases, best_posting_patterns, trending_audio_categories, summary"""

    message = _claude.messages.create(
        model=MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text
    return json.loads(raw[raw.find("{"):raw.rfind("}") + 1])


async def transcribe_audio(audio_path: str) -> Optional[str]:
    """Transcribe audio using OpenAI Whisper"""
    try:
        import openai
        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        with open(audio_path, "rb") as f:
            result = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="text",
            )
        return result
    except Exception as e:
        print(f"[whisper] Transcription failed, falling back to caption-only: {e}")
        return None
