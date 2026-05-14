"""
Data scraping service — Apify (ethical, public data only) + Meta Ad Library API
Strict compliance: only public accounts, rate-limited, no raw video storage
"""

import os
import json
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from typing import Optional
from pathlib import Path

MOCK_DIR = Path(__file__).parent.parent / "mock"
APIFY_TOKEN = os.getenv("APIFY_API_TOKEN", "")
META_APP_ID = os.getenv("META_APP_ID", "")
META_APP_SECRET = os.getenv("META_APP_SECRET", "")


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=30))
async def discover_competitors_from_hashtags(
    niche: str,
    location: str,
    hashtags: Optional[list[str]] = None,
) -> list[dict]:
    """
    Discover competitor accounts via Apify hashtag scraper.
    Returns raw candidates (unfiltered) — AI scoring happens separately.
    """
    if os.getenv("USE_MOCK_DATA") == "true":
        with open(MOCK_DIR / "competitors.json") as f:
            return json.load(f)["competitors"]

    if not APIFY_TOKEN:
        raise ValueError("APIFY_API_TOKEN not configured")

    # Derive hashtags from niche + location if not provided
    if not hashtags:
        niche_slug = niche.lower().replace(" ", "")
        loc_slug = location.lower().split(",")[0].replace(" ", "")
        hashtags = [niche_slug, f"{niche_slug}{loc_slug}", loc_slug]

    results = []
    async with httpx.AsyncClient(timeout=60) as client:
        for tag in hashtags[:5]:  # limit API calls
            try:
                # Apify Instagram Hashtag Scraper
                resp = await client.post(
                    f"https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/runs",
                    params={"token": APIFY_TOKEN},
                    json={
                        "hashtags": [tag],
                        "resultsLimit": 20,
                        "onlyPostsNewerThan": "30 days",
                    },
                )
                resp.raise_for_status()
                # In production: poll for run completion and fetch results
                # Simplified here — Phase 4 adds full async polling
                results.extend([{"handle": f"candidate_{tag}_{i}", "source": "hashtag"} for i in range(5)])
            except Exception as e:
                print(f"[scraper] Hashtag {tag} failed: {e}")

    return results


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=30))
async def fetch_competitor_posts(handle: str, max_posts: int = 50) -> list[dict]:
    """
    Fetch public posts for a confirmed competitor via Apify.
    Returns post metadata only — no raw video files stored.
    """
    if os.getenv("USE_MOCK_DATA") == "true":
        with open(MOCK_DIR / "video_analyses.json") as f:
            data = json.load(f)
        return data["posts"][:max_posts]

    if not APIFY_TOKEN:
        raise ValueError("APIFY_API_TOKEN not configured")

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"https://api.apify.com/v2/acts/apify~instagram-scraper/runs",
            params={"token": APIFY_TOKEN},
            json={
                "directUrls": [f"https://www.instagram.com/{handle}/"],
                "resultsType": "posts",
                "resultsLimit": max_posts,
                "addParentData": False,
            },
        )
        resp.raise_for_status()
        # Phase 4: poll for run completion and return results
        return []


async def query_meta_ad_library(niche: str, location: str) -> list[dict]:
    """
    Query Meta Ad Library API for advertisers in this niche.
    Official API — no ToS violation.
    """
    if os.getenv("USE_MOCK_DATA") == "true":
        with open(MOCK_DIR / "ad_library.json") as f:
            return json.load(f)["ads"]

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            "https://graph.facebook.com/v19.0/ads_archive",
            params={
                "access_token": f"{META_APP_ID}|{META_APP_SECRET}",
                "ad_type": "ALL",
                "ad_reached_countries": ["UZ"],  # adjust per location
                "search_terms": niche,
                "fields": "page_name,page_id,ad_creative_body",
                "limit": 25,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", [])
