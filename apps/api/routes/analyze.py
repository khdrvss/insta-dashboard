"""
Content analysis routes — triggers async analysis jobs
"""

import os
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from services.ai import analyze_video_content, summarize_niche_patterns
from services.scraper import fetch_competitor_posts

router = APIRouter()
MOCK_DIR = Path(__file__).parent.parent / "mock"


class AnalyzeRequest(BaseModel):
    competitor_handles: list[str]
    niche: str
    user_id: str
    max_posts_per_competitor: int = 50


class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: int
    message: str


@router.post("/start")
async def start_analysis(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    """
    Kick off async content analysis for confirmed competitors.
    Returns a job_id to poll for progress.
    """
    if os.getenv("USE_MOCK_DATA") == "true":
        return {
            "job_id": "mock-job-001",
            "status": "complete",
            "message": "Mock analysis loaded",
            "mock": True,
        }

    import uuid
    job_id = str(uuid.uuid4())

    # In production this would enqueue a Celery/BullMQ task
    background_tasks.add_task(
        run_analysis_job,
        job_id=job_id,
        handles=req.competitor_handles,
        niche=req.niche,
        max_posts=req.max_posts_per_competitor,
    )

    return {"job_id": job_id, "status": "pending", "message": "Analysis queued"}


@router.get("/mock/video-analyses")
async def get_mock_analyses():
    """Return mock video analysis data"""
    mock_path = MOCK_DIR / "video_analyses.json"
    with open(mock_path) as f:
        return json.load(f)


@router.get("/mock/niche-summary")
async def get_mock_niche_summary():
    """Return mock niche summary for testing"""
    return {
        "winning_patterns": [
            {"pattern": "Question-hook + stat reveal", "frequency": 68, "why_it_works": "Triggers curiosity gap immediately"},
            {"pattern": "POV / Day-in-life format", "frequency": 54, "why_it_works": "Builds authentic trust before CTA"},
            {"pattern": "Before & After transformation", "frequency": 47, "why_it_works": "Visual proof drives conversion"},
            {"pattern": "Educational checklist (3-5 items)", "frequency": 41, "why_it_works": "High save rate = algorithmic boost"},
            {"pattern": "Client testimonial with result stat", "frequency": 38, "why_it_works": "Social proof in 15 seconds"},
        ],
        "best_hook_styles": [
            {"type": "shock", "example": "This mistake costs renovators 40% more", "effectiveness_score": 87},
            {"type": "question", "example": "Did you know most contractors hide this?", "effectiveness_score": 82},
            {"type": "promise", "example": "I'll show you how to renovate for half the price", "effectiveness_score": 78},
        ],
        "summary": "Construction and renovation accounts in Tashkent perform best with transparency-led content — price breakdowns, day-in-life, and educational checklists dominate. Hooks that highlight hidden costs or industry secrets generate 2-3x average engagement.",
        "mock": True,
    }


@router.get("/job/{job_id}")
async def get_job_status(job_id: str):
    """Poll analysis job status"""
    if job_id == "mock-job-001":
        return {"job_id": job_id, "status": "complete", "progress": 100}
    # In production, check Redis/DB for job status
    return {"job_id": job_id, "status": "pending", "progress": 0}


async def run_analysis_job(job_id: str, handles: list[str], niche: str, max_posts: int):
    """Background task: fetch posts, transcribe, analyze, embed"""
    # This is the skeleton — Phase 4 fills this in fully
    for handle in handles:
        try:
            posts = await fetch_competitor_posts(handle=handle, max_posts=max_posts)
            for post in posts[:5]:  # analyze top 5 per competitor for now
                if post.get("video_url"):
                    await analyze_video_content(
                        video_url=post["video_url"],
                        caption=post.get("caption", ""),
                        niche=niche,
                    )
        except Exception as e:
            print(f"[analyze_job] Error for {handle}: {e}")
