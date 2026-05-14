"""
Instagram Marketing Intelligence Dashboard — FastAPI backend
Handles heavy AI tasks: transcription, embedding, analysis, script generation
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes import auth, profile, competitors, analyze, scripts
from utils.rate_limit import limiter
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 InstaIntel API starting...")
    if os.getenv("USE_MOCK_DATA") == "true":
        print("⚠️  USE_MOCK_DATA=true — all live API calls bypassed")
    yield
    # Shutdown
    print("👋 InstaIntel API shutting down")


app = FastAPI(
    title="InstaIntel API",
    description="Instagram Marketing Intelligence — AI analysis & script generation",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please slow down."},
    )

# Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(profile.router, prefix="/profile", tags=["profile"])
app.include_router(competitors.router, prefix="/competitors", tags=["competitors"])
app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(scripts.router, prefix="/scripts", tags=["scripts"])


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "mock_mode": os.getenv("USE_MOCK_DATA") == "true",
        "version": "1.0.0",
    }
