"""
Pinecone vector search — stores and retrieves content pattern embeddings by niche
Full implementation in Phase 4
"""

import os
from typing import Optional

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX = os.getenv("PINECONE_INDEX_NAME", "instagram-content-patterns")


async def upsert_analysis(
    post_id: str,
    niche: str,
    embedding: list[float],
    metadata: dict,
) -> str:
    """Store video analysis embedding in Pinecone"""
    if not PINECONE_API_KEY:
        print("[pinecone] No API key — skipping upsert")
        return post_id

    from pinecone import Pinecone
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX)

    index.upsert(
        vectors=[{"id": post_id, "values": embedding, "metadata": {**metadata, "niche": niche}}],
        namespace=niche.lower().replace(" ", "_"),
    )
    return post_id


async def query_top_patterns(
    niche: str,
    query_embedding: list[float],
    top_k: int = 10,
) -> list[dict]:
    """Retrieve top-performing content patterns for a niche"""
    if not PINECONE_API_KEY:
        return []

    from pinecone import Pinecone
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX)

    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        namespace=niche.lower().replace(" ", "_"),
        include_metadata=True,
    )

    return [
        {"score": match.score, **match.metadata}
        for match in results.matches
    ]
