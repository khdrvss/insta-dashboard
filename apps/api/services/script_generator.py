"""
RAG-based script generation service
Queries Pinecone for niche patterns, builds context, calls Claude
"""

import os
import json
from typing import Literal, Optional
import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential

_claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def generate_scripts(
    niche: str,
    brand_voice: str,
    tone: str,
    goal: str,
    platform: str,
    length_secs: int,
    products_services: Optional[str],
    target_audience: Optional[str],
    temperature: float = 0.7,
) -> list[dict]:
    """
    Generate 3 script variations using RAG + Claude.
    Phase 4 adds Pinecone retrieval; Phase 1 uses hardcoded patterns.
    """
    # Stub patterns — Phase 4 replaces with Pinecone vector retrieval
    winning_hooks = [
        {"type": "question", "example": "Did you know most people get this wrong?"},
        {"type": "shock", "example": "This one decision costs renovators 40% more"},
        {"type": "promise", "example": "I'll show you how to get professional results"},
        {"type": "story", "example": "We almost lost this project on day 3..."},
    ]

    top_formats = [
        {"format": "talking-head", "description": "Direct address builds authentic trust"},
        {"format": "before-after", "description": "Visual transformation is the most compelling proof"},
        {"format": "educational-list", "description": "Checklists get saved 3x more than other formats"},
    ]

    goal_map = {
        "brand_awareness": "Build brand recognition and trust",
        "direct_sales": "Drive immediate purchase or booking",
        "lead_generation": "Generate DMs, form fills, or link clicks",
    }

    prompt = f"""You are an expert video scriptwriter for {niche} brands.

Brand: {brand_voice} voice, {tone} tone
Goal: {goal_map.get(goal, goal)}
Platform: {platform}
Length: {length_secs} seconds
Products/Services: {products_services or "Not specified"}
Target Audience: {target_audience or "General audience in this niche"}

Winning hooks from this niche:
{json.dumps(winning_hooks, indent=2)}

Top formats:
{json.dumps(top_formats, indent=2)}

Generate 3 ORIGINAL video scripts. Each scene fills the full {length_secs} seconds.

Return JSON: {{"scripts": [{{
  "variation": 1,
  "concept_title": "string",
  "hook_type": "string",
  "borrowed_pattern": "string (which pattern + why it works)",
  "scenes": [{{"timecode": "0:00-0:03", "visual": "string", "on_screen_text": "string|null", "audio": "string"}}],
  "suggested_audio_style": "string",
  "caption": "string (150-200 chars)",
  "hashtags": ["10 hashtags without #"],
  "thumbnail_idea": "string",
  "predicted_strength": "hook|retention|cta|balanced"
}}]}}"""

    message = _claude.messages.create(
        model=MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,  # type: ignore[call-arg]
    )

    raw = message.content[0].text
    data = json.loads(raw[raw.find("{"):raw.rfind("}") + 1])
    return data.get("scripts", [])
