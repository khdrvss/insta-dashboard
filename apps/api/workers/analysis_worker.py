"""
Content analysis background worker.
Called by FastAPI /analyze/start — runs async in the background.
Fetches competitor posts, transcribes, analyzes, embeds.
"""

import os
import asyncio
import json
from pathlib import Path
from typing import Optional
from services.scraper import fetch_competitor_posts
from services.ai import analyze_video_content, summarize_niche_patterns
from services.vector_search import upsert_analysis
from utils.cache import set_cached, cache_key, ANALYSIS_TTL

MOCK_DIR = Path(__file__).parent.parent / "mock"


async def run_analysis(
    job_id: str,
    user_id: str,
    niche: str,
    competitor_handles: list[str],
    db=None,  # Prisma client injected by route
):
    """Full analysis pipeline for all confirmed competitors."""
    print(f"[worker] Starting analysis job {job_id} for {len(competitor_handles)} competitors")

    all_analyses = []

    for i, handle in enumerate(competitor_handles):
        try:
            # Check 7-day cache
            cache_k = cache_key("competitor_analysis", handle, niche)
            cached = None  # TODO: await get_cached(cache_k)
            if cached:
                all_analyses.extend(cached)
                print(f"[worker] {handle}: cache hit, skipping")
                continue

            print(f"[worker] {handle}: fetching posts ({i+1}/{len(competitor_handles)})")
            posts = await fetch_competitor_posts(handle=handle, max_posts=50)

            # Score engagement (basic estimate without follower count)
            scored = [
                {**p, "engagement_score": estimate_engagement(p)}
                for p in posts
            ]

            # Top 10% by engagement
            scored.sort(key=lambda p: p.get("engagement_score", 0), reverse=True)
            top_posts = scored[:max(1, len(scored) // 10)]

            print(f"[worker] {handle}: analyzing top {len(top_posts)} posts")
            handle_analyses = []

            for post in top_posts:
                try:
                    analysis = await analyze_video_content(
                        video_url=post.get("video_url", ""),
                        caption=post.get("caption", ""),
                        niche=niche,
                    )
                    analysis["handle"] = handle
                    analysis["engagement_score"] = post.get("engagement_score", 0)
                    handle_analyses.append(analysis)

                    # Embed into Pinecone (non-blocking)
                    if os.getenv("PINECONE_API_KEY"):
                        asyncio.create_task(
                            upsert_analysis(
                                post_id=post.get("id", f"{handle}_{len(handle_analyses)}"),
                                niche=niche,
                                embedding=[0.0] * 1536,  # Phase 5: real embeddings via OpenAI
                                metadata={
                                    "handle": handle,
                                    "hook_type": analysis.get("hook_type"),
                                    "content_format": analysis.get("content_format"),
                                    "pacing_style": analysis.get("pacing_style"),
                                    "engagement_score": post.get("engagement_score", 0),
                                },
                            )
                        )

                except Exception as e:
                    print(f"[worker] Post analysis failed for {handle}: {e}")

            all_analyses.extend(handle_analyses)

            # Cache this competitor's analysis for 7 days
            if handle_analyses:
                await set_cached(cache_k, handle_analyses, ANALYSIS_TTL)

        except Exception as e:
            print(f"[worker] Failed to process {handle}: {e}")

    # Summarize all patterns with Claude
    if all_analyses:
        try:
            summary = await summarize_niche_patterns(
                niche=niche,
                location="",
                analyses=all_analyses,
            )
            # Cache niche summary for 7 days
            summary_key = cache_key("niche_summary", niche)
            await set_cached(summary_key, summary, ANALYSIS_TTL)
            print(f"[worker] Niche summary cached")
        except Exception as e:
            print(f"[worker] Niche summary failed: {e}")

    print(f"[worker] Job {job_id} complete — analyzed {len(all_analyses)} posts total")
    return all_analyses


def estimate_engagement(post: dict) -> float:
    """Estimate engagement score 0-100 from raw post data."""
    likes = post.get("like_count", 0) or post.get("likes_est", 0) or 0
    comments = post.get("comments_count", 0) or post.get("comments_est", 0) or 0
    views = post.get("video_view_count", 0) or post.get("views_est", 0) or 1
    # Normalize: engagement per 1000 views, capped at 100
    raw = ((likes + comments * 2) / max(views, 1)) * 1000
    return min(100, raw * 5)


