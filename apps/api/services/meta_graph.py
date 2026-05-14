"""
Meta Graph API service (Python side — used by async analysis workers)
Primary OAuth flow is handled by Next.js. This service uses stored tokens.
"""

import os
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from typing import Optional

GRAPH_BASE = "https://graph.facebook.com/v19.0"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=2, max=30))
async def fetch_ig_media(
    ig_user_id: str,
    access_token: str,
    limit: int = 30,
) -> list[dict]:
    """Fetch user's recent Instagram posts"""
    fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count"
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{GRAPH_BASE}/{ig_user_id}/media",
            params={"fields": fields, "limit": limit, "access_token": access_token},
        )
        resp.raise_for_status()
        return resp.json().get("data", [])


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=2, max=30))
async def fetch_ig_profile(ig_user_id: str, access_token: str) -> dict:
    """Fetch Instagram Business account profile"""
    fields = "id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count"
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{GRAPH_BASE}/{ig_user_id}",
            params={"fields": fields, "access_token": access_token},
        )
        resp.raise_for_status()
        return resp.json()


async def fetch_post_insights(
    media_id: str,
    access_token: str,
    media_type: str = "IMAGE",
) -> dict:
    """Fetch insights for a single media object (requires Instagram Insights permission)"""
    metrics = "impressions,reach,engagement"
    if media_type in ("VIDEO", "REEL"):
        metrics += ",video_views"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{GRAPH_BASE}/{media_id}/insights",
            params={"metric": metrics, "access_token": access_token},
        )
        if not resp.is_success:
            return {}  # Insights may not be available for all posts

        data = resp.json().get("data", [])
        return {item["name"]: item["values"][0]["value"] for item in data}
