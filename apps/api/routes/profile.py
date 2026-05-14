"""
User profile and Instagram account routes
"""

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ProfileUpdateRequest(BaseModel):
    clerk_id: str
    instagram_handle: Optional[str] = None
    niche: Optional[str] = None
    location: Optional[str] = None
    brand_voice: Optional[str] = None


@router.get("/{clerk_id}")
async def get_profile(clerk_id: str):
    if os.getenv("USE_MOCK_DATA") == "true":
        return {
            "clerk_id": clerk_id,
            "instagram_handle": "mock_construction_tz",
            "niche": "construction Tashkent",
            "location": "Tashkent, Uzbekistan",
            "brand_voice": "bold",
            "plan": "free",
            "mock": True,
        }
    # In production: fetch from DB
    raise HTTPException(status_code=501, detail="Live profile fetch implemented in Phase 2")


@router.put("/{clerk_id}")
async def update_profile(clerk_id: str, req: ProfileUpdateRequest):
    return {"success": True, "clerk_id": clerk_id}
