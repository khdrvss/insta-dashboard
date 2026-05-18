import { getAuth as auth } from "@/lib/mock-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";
import OpenAI from "openai";
import { buildCompetitorFilterPrompt } from "@instagram-dashboard/ai";
import mockData from "@/mock/competitors_discovery.json";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});
const MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

// Candidate scraped from hashtag search or Ad Library — raw, unfiltered
interface RawCandidate {
  handle: string;
  bio?: string;
  followers?: number;
  source: "hashtag_search" | "ad_library" | "manual";
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Mock mode: return fixture data instantly (no DB needed)
  if (process.env.USE_MOCK_DATA === "true") {
    await new Promise((r) => setTimeout(r, 2000));
    return NextResponse.json({
      candidates: mockData.candidates,
      total_scanned: mockData.total_scanned,
      mock: true,
    });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!user.niche || !user.location) {
    return NextResponse.json(
      {
        error:
          "Complete your profile (niche + location) before discovering competitors",
      },
      { status: 400 },
    );
  }

  // ── Cache check — skip Apify if we have results < 7 days old ────────────────
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";

  if (!force) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const cached = await prisma.competitor.findMany({
      where: { userId: user.id, updatedAt: { gte: since } },
      orderBy: { relevanceScore: "desc" },
    });
    if (cached.length > 0) {
      return NextResponse.json({
        candidates: cached.map((c) => ({
          handle: c.handle,
          relevance_score: c.relevanceScore,
          reasoning: c.relevanceReason ?? "",
          source: c.discoverySource,
          followers_est: c.followersEst,
          confirmed: c.confirmed,
        })),
        total_scanned: cached.length,
        cached: true,
      });
    }
  }

  // ── Live discovery ──────────────────────────────────────────────────────────

  // Step 1: Build candidate pool from scraper + Ad Library
  const candidates = await gatherCandidates(user.niche, user.location);

  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "No candidates found. Try broadening your niche description." },
      { status: 404 },
    );
  }

  // Step 2: Claude filters and scores relevance
  const prompt = buildCompetitorFilterPrompt({
    niche: user.niche,
    location: user.location,
    candidates: candidates.map((c) => ({
      handle: c.handle,
      bio: c.bio,
      followers: c.followers,
    })),
  });

  const message = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.choices[0].message.content ?? "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "AI filtering failed" }, { status: 500 });
  }

  const { filtered } = JSON.parse(jsonMatch[0]) as {
    filtered: Array<{
      handle: string;
      relevance_score: number;
      reasoning: string;
    }>;
  };

  // Merge source info back in
  const sourceMap = new Map(candidates.map((c) => [c.handle, c.source]));
  const followerMap = new Map(candidates.map((c) => [c.handle, c.followers]));
  const enriched = filtered.map((f) => ({
    ...f,
    source: sourceMap.get(f.handle) ?? "hashtag_search",
    followers_est: followerMap.get(f.handle),
  }));

  // ── Persist all candidates to DB (cache for future calls) ──────────────────
  await Promise.all(
    enriched.map((c) =>
      prisma.competitor.upsert({
        where: { userId_handle: { userId: user.id, handle: c.handle } },
        update: {
          relevanceScore: c.relevance_score,
          relevanceReason: c.reasoning,
          discoverySource: c.source,
          followersEst: c.followers_est ?? null,
        },
        create: {
          userId:          user.id,
          handle:          c.handle,
          relevanceScore:  c.relevance_score,
          relevanceReason: c.reasoning,
          discoverySource: c.source,
          followersEst:    c.followers_est ?? null,
          confirmed:       false,
        },
      }),
    ),
  );

  await prisma.aiUsageLog.create({
    data: {
      userId: user.id,
      model: MODEL,
      operation: "competitor_filter",
      inputTokens: message.usage?.prompt_tokens ?? 0,
      outputTokens: message.usage?.completion_tokens ?? 0,
    },
  });

  return NextResponse.json({
    candidates: enriched,
    total_scanned: candidates.length,
    mock: false,
  });
}

// ── DELETE: clear all non-confirmed (cached) competitors so next POST re-discovers ──
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { count } = await prisma.competitor.deleteMany({
    where: { userId: user.id, confirmed: false },
  });

  return NextResponse.json({ ok: true, deleted: count });
}

// Build real-estate-specific hashtags for Uzbekistan market.
// Priority: known Uzbek real-estate tags first, then supplement from niche/location words.
function buildRealEstateTags(niche: string, location: string): string[] {
  // Core Uzbek real estate hashtags that reliably surface property sellers/developers
  const coreRealEstateTags = [
    "uysotuv",         // "house for sale" (Uzbek)
    "uytoshkent",      // "house Tashkent"
    "kvartirasotuv",   // "apartment for sale"
    "kotedj",          // "cottage"
    "yaniqurilis",     // "new construction"
  ];

  // Supplement with any location words that look like city names (> 4 chars)
  const locExtra = location.toLowerCase()
    .split(/[\s,]+/)
    .map(w => w.replace(/[^a-z0-9а-яёўқғҳ]/gi, ""))
    .filter(w => w.length > 4 && !coreRealEstateTags.some(t => t.includes(w)));

  // Combine, deduplicate, max 6 tags (Apify free tier is limited)
  return Array.from(new Set([...coreRealEstateTags, ...locExtra.slice(0, 1)])).slice(0, 6);
}

async function gatherCandidates(
  niche: string,
  location: string,
): Promise<RawCandidate[]> {
  const candidates: RawCandidate[] = [];

  // Apify hashtag scraper (if token is configured)
  if (process.env.APIFY_API_TOKEN) {
    try {
      // Use targeted Uzbek real-estate hashtags regardless of niche string
      // These pull profiles that actually sell/rent properties in Uzbekistan
      const tags = buildRealEstateTags(niche, location);

      console.log("[discover] Apify hashtags:", tags);

      const { ApifyClient } = await import("apify-client");
      const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

      const run = await apify.actor("apify/instagram-hashtag-scraper").call({
        hashtags: tags,
        resultsLimit: 50,
      });

      const { items } = await apify.dataset(run.defaultDatasetId).listItems();
      for (const item of items as any[]) {
        if (item.ownerUsername) {
          candidates.push({
            handle: item.ownerUsername,
            bio: item.biography,
            followers: item.followersCount,
            source: "hashtag_search",
          });
        }
      }
    } catch (e) {
      console.error("[discover] Apify failed:", e);
    }
  }

  // Meta Ad Library (if configured)
  if (process.env.META_APP_ID && process.env.META_APP_SECRET) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/ads_archive?` +
          new URLSearchParams({
            access_token: `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`,
            ad_type: "ALL",
            search_terms: niche,
            fields: "page_name,page_id",
            limit: "25",
          }),
      );
      if (res.ok) {
        const data = await res.json();
        for (const ad of data.data ?? []) {
          if (ad.page_name) {
            candidates.push({
              handle: ad.page_name.toLowerCase().replace(/\s+/g, "_"),
              source: "ad_library",
            });
          }
        }
      }
    } catch (e) {
      console.error("[discover] Ad Library failed:", e);
    }
  }

  // Deduplicate by handle
  const seen = new Set<string>();
  return candidates.filter((c) => {
    if (seen.has(c.handle)) return false;
    seen.add(c.handle);
    return true;
  });
}
