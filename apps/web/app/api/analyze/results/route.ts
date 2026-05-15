import { getAuth as auth } from "@/lib/mock-auth";
import { NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";
import mockResults from "@/mock/analysis_results.json";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (process.env.USE_MOCK_DATA === "true") {
    return NextResponse.json({ ...mockResults, mock: true });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      competitors: {
        where: { confirmed: true },
        include: {
          posts: {
            orderBy: { engagementScore: "desc" },
            take: 50,
            include: { videoAnalysis: true },
          },
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Build competitor stats
  const competitors = user.competitors.map((c) => {
    const posts = c.posts;
    const avgER =
      posts.length > 0
        ? posts.reduce((s, p) => s + (p.engagementScore ?? 0), 0) / posts.length
        : 0;
    const formats = posts.flatMap((p) => p.videoAnalysis?.contentFormat ?? []);
    const hookTypes = posts.flatMap((p) => p.videoAnalysis?.hookType ?? []);
    const topFormat = mostFrequent(formats) ?? "unknown";
    const topHook = mostFrequent(hookTypes) ?? "unknown";

    return {
      handle: c.handle,
      display_name: c.displayName,
      followers_est: c.followersEst,
      posts_analyzed: posts.length,
      avg_engagement_rate: Math.round(avgER * 100) / 100,
      top_format: topFormat,
      top_hook_type: topHook,
    };
  });

  // Top posts across all competitors
  const allPosts = user.competitors
    .flatMap((c) =>
      c.posts.map((p) => ({
        id: p.id,
        competitor_handle: c.handle,
        caption: p.caption,
        hook_text: p.videoAnalysis?.hookText,
        hook_type: p.videoAnalysis?.hookType,
        engagement_score: p.engagementScore ?? 0,
        likes_est: p.likesEst,
        comments_est: p.commentsEst,
        views_est: p.viewsEst,
        pacing_style: p.videoAnalysis?.pacingStyle,
        content_format: p.videoAnalysis?.contentFormat,
        duration_secs: p.durationSecs,
      }))
    )
    .sort((a, b) => b.engagement_score - a.engagement_score)
    .slice(0, 10);

  // Engagement trend (weekly aggregates from posts)
  const trendMap = new Map<string, { total: number; count: number }>();
  user.competitors.forEach((c) => {
    c.posts.forEach((p) => {
      if (!p.postedAt || !p.engagementScore) return;
      const week = getWeekLabel(p.postedAt);
      const existing = trendMap.get(week) ?? { total: 0, count: 0 };
      trendMap.set(week, { total: existing.total + p.engagementScore, count: existing.count + 1 });
    });
  });
  const engagement_trend = Array.from(trendMap.entries())
    .map(([week, { total, count }]) => ({ week, avg_engagement: Math.round((total / count) * 100) / 100 }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8);

  return NextResponse.json({
    competitors,
    top_posts: allPosts,
    engagement_trend,
    niche_summary: null, // populated after AI summarization job
    mock: false,
  });
}

function mostFrequent(arr: string[]): string | null {
  if (!arr.length) return null;
  const freq: Record<string, number> = {};
  for (const item of arr) freq[item] = (freq[item] ?? 0) + 1;
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

function getWeekLabel(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // start of week
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
