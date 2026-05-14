"""
Redis caching utilities
- 7-day TTL for analyzed competitor videos
- 1-day TTL for generated scripts
"""

import os
import json
import hashlib
from typing import Optional, Any
import redis.asyncio as redis

_client: Optional[redis.Redis] = None

ANALYSIS_TTL = 7 * 24 * 3600  # 7 days
SCRIPT_TTL = 24 * 3600         # 1 day


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        url = os.getenv("REDIS_URL", "redis://localhost:6379")
        _client = redis.from_url(url, encoding="utf-8", decode_responses=True)
    return _client


def cache_key(*parts: str) -> str:
    raw = ":".join(str(p) for p in parts)
    return f"instaintel:{hashlib.md5(raw.encode()).hexdigest()}"


async def get_cached(key: str) -> Optional[Any]:
    try:
        r = get_redis()
        val = await r.get(key)
        return json.loads(val) if val else None
    except Exception:
        return None


async def set_cached(key: str, value: Any, ttl: int = ANALYSIS_TTL) -> None:
    try:
        r = get_redis()
        await r.setex(key, ttl, json.dumps(value, ensure_ascii=False))
    except Exception as e:
        print(f"[cache] Write failed (non-fatal): {e}")
