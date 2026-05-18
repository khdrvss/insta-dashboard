import { getAuth as auth } from "@/lib/mock-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});
const MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

// POST /api/analyze/scrape?handle=xxx  — scrape one competitor's posts + AI-analyze
// POST /api/analyze/scrape              — scrape ALL confirmed competitors
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { competitors: { where: { confirmed: true } } },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.competitors.length)
    return NextResponse.json({ error: "No confirmed competitors" }, { status: 400 });

  const singleHandle = req.nextUrl.searchParams.get("handle");
  const targets = singleHandle
    ? user.competitors.filter((c) => c.handle === singleHandle)
    : user.competitors;

  if (!targets.length)
    return NextResponse.json({ error: "Competitor not found" }, { status: 404 });

  const results: Record<string, number> = {};

  for (const competitor of targets) {
    try {
      const posts = await scrapeInstagramProfile(competitor.handle);
      if (!posts.length) {
        results[competitor.handle] = 0;
        continue;
      }

      // AI-analyze up to 10 posts in one call to save tokens
      const analyzed = await analyzePostsBatch(posts.slice(0, 10), user.niche ?? "");

      // Delete old posts and insert fresh ones
      await prisma.post.deleteMany({ where: { competitorId: competitor.id } });

      await prisma.post.createMany({
        data: posts.map((p, i) => {
          const analysis = analyzed[i];
          return {
            competitorId:    competitor.id,
            externalId:      p.id,
            mediaType:       p.type ?? "video",
            caption:         p.caption,
            hashtags:        JSON.stringify(extractHashtags(p.caption ?? "")),
            thumbnailUrl:    p.thumbnailUrl,
            videoUrl:        p.videoUrl,
            likesEst:        p.likes ?? 0,
            commentsEst:     p.comments ?? 0,
            viewsEst:        p.views ?? null,
            engagementScore: (p.likes != null || p.comments != null)
              ? Math.round(((( p.likes ?? 0) + (p.comments ?? 0)) / Math.max(p.views ?? 1000, 1)) * 100 * 100) / 100
              : null,
            postedAt:        p.postedAt ? new Date(p.postedAt) : null,
          };
        }),
      });

      // Upsert video analyses for analyzed posts
      const createdPosts = await prisma.post.findMany({
        where: { competitorId: competitor.id },
        orderBy: { createdAt: "asc" },
        take: analyzed.length,
      });

      for (let i = 0; i < createdPosts.length && i < analyzed.length; i++) {
        const a = analyzed[i];
        if (!a) continue;
        await prisma.videoAnalysis.upsert({
          where: { postId: createdPosts[i].id },
          update: {
            hookText:      a.hook_text,
            hookType:      a.hook_type,
            valueProp:     a.value_prop,
            ctaText:       a.cta_text,
            pacingStyle:   a.pacing_style,
            contentFormat: a.content_format,
            sentiment:     a.sentiment,
            powerWords:    JSON.stringify(a.power_words ?? []),
          },
          create: {
            postId:        createdPosts[i].id,
            hookText:      a.hook_text,
            hookType:      a.hook_type,
            valueProp:     a.value_prop,
            ctaText:       a.cta_text,
            pacingStyle:   a.pacing_style,
            contentFormat: a.content_format,
            sentiment:     a.sentiment,
            powerWords:    JSON.stringify(a.power_words ?? []),
          },
        });
      }

      // Update lastAnalyzedAt on competitor
      await prisma.competitor.update({
        where: { id: competitor.id },
        data: { lastAnalyzedAt: new Date() },
      });

      results[competitor.handle] = posts.length;
    } catch (err) {
      console.error(`[scrape] ${competitor.handle} failed:`, err);
      results[competitor.handle] = -1;
    }
  }

  return NextResponse.json({ ok: true, results });
}

// ── Apify scraper ─────────────────────────────────────────────────────────────

interface ScrapedPost {
  id: string;
  type: string;
  caption?: string;
  likes?: number;
  comments?: number;
  views?: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  postedAt?: string;
}

async function scrapeInstagramProfile(handle: string): Promise<ScrapedPost[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_API_TOKEN not set");

  const { ApifyClient } = await import("apify-client");
  const apify = new ApifyClient({ token });

  const run = await apify.actor("apify/instagram-scraper").call({
    directUrls:   [`https://www.instagram.com/${handle}/`],
    resultsType:  "posts",
    resultsLimit: 20,
  });

  const { items } = await apify.dataset(run.defaultDatasetId).listItems();

  return (items as any[]).map((item) => ({
    id:           item.id ?? item.shortCode ?? String(Math.random()),
    type:         item.type ?? (item.videoUrl ? "video" : "image"),
    caption:      item.caption,
    likes:        item.likesCount ?? item.likes,
    comments:     item.commentsCount ?? item.comments,
    views:        item.videoViewCount ?? item.views,
    thumbnailUrl: item.displayUrl ?? item.thumbnailUrl,
    videoUrl:     item.videoUrl,
    postedAt:     item.timestamp,
  }));
}

// ── AI analysis ───────────────────────────────────────────────────────────────

interface PostAnalysis {
  hook_text?: string;
  hook_type?: string;
  value_prop?: string;
  cta_text?: string;
  pacing_style?: string;
  content_format?: string;
  sentiment?: string;
  power_words?: string[];
}

async function analyzePostsBatch(posts: ScrapedPost[], niche: string): Promise<PostAnalysis[]> {
  const prompt = `You are an Instagram content strategist analyzing ${niche} competitor posts.

Analyze these ${posts.length} posts and return a JSON array with one object per post:

Posts:
${posts.map((p, i) => `${i + 1}. Caption: "${(p.caption ?? "").slice(0, 300)}"`).join("\n")}

For each post return:
{
  "hook_text": "first 10 words of caption or inferred hook",
  "hook_type": one of: "question|shock|promise|story|stat|pov",
  "value_prop": "main value offered in 1 sentence",
  "cta_text": "call to action if present",
  "pacing_style": one of: "fast|medium|slow",
  "content_format": one of: "educational|testimonial|transformation|behind_scenes|promotional|entertainment",
  "sentiment": one of: "positive|neutral|urgent",
  "power_words": ["word1", "word2"]
}

Return ONLY a valid JSON array, no markdown.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0].message.content ?? "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return posts.map(() => ({}));
    return JSON.parse(match[0]) as PostAnalysis[];
  } catch {
    return posts.map(() => ({}));
  }
}

function extractHashtags(caption: string): string[] {
  return (caption.match(/#[\wЀ-ӿ]+/g) ?? []).map((h) => h.slice(1).toLowerCase());
}
