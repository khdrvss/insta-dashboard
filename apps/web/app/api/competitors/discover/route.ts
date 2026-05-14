import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";
import Anthropic from "@anthropic-ai/sdk";
import { buildCompetitorFilterPrompt } from "@instagram-dashboard/ai";
import mockData from "@/mock/competitors_discovery.json";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Candidate scraped from hashtag search or Ad Library — raw, unfiltered
interface RawCandidate {
  handle: string;
  bio?: string;
  followers?: number;
  source: "hashtag_search" | "ad_library" | "manual";
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!user.niche || !user.location) {
    return NextResponse.json(
      { error: "Complete your profile (niche + location) before discovering competitors" },
      { status: 400 }
    );
  }

  // Mock mode: return fixture data instantly
  if (process.env.USE_MOCK_DATA === "true") {
    await new Promise((r) => setTimeout(r, 2000)); // simulate discovery time
    return NextResponse.json({
      candidates: mockData.candidates,
      total_scanned: mockData.total_scanned,
      mock: true,
    });
  }

  // ── Live discovery ──────────────────────────────────────────────────────────

  // Step 1: Build candidate pool from scraper + Ad Library
  const candidates = await gatherCandidates(user.niche, user.location);

  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "No candidates found. Try broadening your niche description." },
      { status: 404 }
    );
  }

  // Step 2: Claude filters and scores relevance
  const prompt = buildCompetitorFilterPrompt({
    niche: user.niche,
    location: user.location,
    candidates: candidates.map((c) => ({ handle: c.handle, bio: c.bio, followers: c.followers })),
  });

  const message = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "AI filtering failed" }, { status: 500 });
  }

  const { filtered } = JSON.parse(jsonMatch[0]) as {
    filtered: Array<{ handle: string; relevance_score: number; reasoning: string }>;
  };

  // Merge source info back in
  const sourceMap = new Map(candidates.map((c) => [c.handle, c.source]));
  const enriched = filtered.map((f) => ({
    ...f,
    source: sourceMap.get(f.handle) ?? "hashtag_search",
  }));

  await prisma.aiUsageLog.create({
    data: {
      userId: user.id,
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
      operation: "competitor_filter",
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
  });

  return NextResponse.json({
    candidates: enriched,
    total_scanned: candidates.length,
    mock: false,
  });
}

async function gatherCandidates(niche: string, location: string): Promise<RawCandidate[]> {
  const candidates: RawCandidate[] = [];

  // Apify hashtag scraper (if token is configured)
  if (process.env.APIFY_API_TOKEN) {
    try {
      const slug = niche.toLowerCase().replace(/\s+/g, "");
      const locSlug = location.toLowerCase().split(",")[0].replace(/\s+/g, "");
      const tags = [slug, `${slug}${locSlug}`, locSlug];

      const { ApifyClient } = await import("apify-client");
      const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

      const run = await apify.actor("apify/instagram-hashtag-scraper").call({
        hashtags: tags,
        resultsLimit: 30,
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
          })
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
