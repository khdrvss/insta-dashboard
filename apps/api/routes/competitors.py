"""
Competitor discovery and management routes
"""

import os
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from services.ai import filter_competitors_with_ai
from services.scraper import discover_competitors_from_hashtags, query_meta_ad_library

router = APIRouter()
MOCK_DIR = Path(__file__).parent.parent / "mock"


class DiscoverRequest(BaseModel):
    niche: str
    location: str
    hashtags: Optional[list[str]] = None
    user_id: Optional[str] = None


class ConfirmRequest(BaseModel):
    user_id: str
    handles: list[str]


@router.post("/discover")
async def discover_competitors(req: DiscoverRequest):
    """
    Discover competitors via hashtag search + Meta Ad Library, then AI-score them.
    """
    if os.getenv("USE_MOCK_DATA") == "true":
        mock_path = MOCK_DIR / "competitors.json"
        with open(mock_path) as f:
            data = json.load(f)
        return {"competitors": data["competitors"], "total_scanned": 47, "mock": True}

    # Step 1: Gather raw candidates
    candidates: list[dict] = []

    try:
        hashtag_candidates = await discover_competitors_from_hashtags(
            niche=req.niche,
            location=req.location,
            hashtags=req.hashtags,
        )
        candidates.extend(hashtag_candidates)
    except Exception as e:
        print(f"[discover] Hashtag scrape failed: {e}")

    try:
        ad_candidates = await query_meta_ad_library(req.niche, req.location)
        for ad in ad_candidates:
            candidates.append({
                "handle": ad.get("page_name", "").lower().replace(" ", "_"),
                "source": "ad_library",
            })
    except Exception as e:
        print(f"[discover] Ad Library failed: {e}")

    if not candidates:
        raise HTTPException(status_code=404, detail="No candidates found — try a broader niche description")

    # Deduplicate
    seen = set()
    unique = []
    for c in candidates:
        if c["handle"] not in seen:
            seen.add(c["handle"])
            unique.append(c)

    total_scanned = len(unique)

    # Step 2: AI filter + score
    try:
        filtered = await filter_competitors_with_ai(
            niche=req.niche,
            location=req.location,
            candidates=unique,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI filtering failed: {e}")

    return {
        "competitors": filtered,
        "total_scanned": total_scanned,
        "mock": False,
    }


@router.get("/mock")
async def get_mock_competitors():
    """Return mock competitor data for testing"""
    mock_path = MOCK_DIR / "competitors.json"
    with open(mock_path) as f:
        return json.load(f)
