"""
Script generation routes
"""

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal, Optional
from services.script_generator import generate_scripts

router = APIRouter()


class ScriptRequest(BaseModel):
    niche: str
    brand_voice: Literal["formal", "friendly", "bold", "educational"] = "friendly"
    tone: str = "friendly"
    goal: Literal["brand_awareness", "direct_sales", "lead_generation"]
    platform: Literal["reels", "ads"]
    length_secs: Literal[15, 30, 60] = 30
    products_services: Optional[str] = None
    target_audience: Optional[str] = None
    temperature: float = 0.7


@router.post("/generate")
async def generate(req: ScriptRequest):
    if os.getenv("USE_MOCK_DATA") == "true":
        import json
        from pathlib import Path
        mock_path = Path(__file__).parent.parent.parent.parent / "apps" / "web" / "mock" / "generated_scripts.json"
        with open(mock_path) as f:
            data = json.load(f)
        return {"scripts": data["scripts"], "mock": True}

    try:
        scripts = await generate_scripts(
            niche=req.niche,
            brand_voice=req.brand_voice,
            tone=req.tone,
            goal=req.goal,
            platform=req.platform,
            length_secs=req.length_secs,
            products_services=req.products_services,
            target_audience=req.target_audience,
            temperature=req.temperature,
        )
        return {"scripts": scripts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
