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

  // ── Per-competitor stats ────────────────────────────────────────────────────
  const competitors = user.competitors.map((c) => {
    const posts = c.posts;
    const analyzed = posts.filter((p) => p.videoAnalysis);

    const avgER = posts.length > 0
      ? posts.reduce((s, p) => s + (p.engagementScore ?? 0), 0) / posts.length
      : 0;
    const avgViews = posts.filter((p) => p.viewsEst).length > 0
      ? posts.reduce((s, p) => s + (p.viewsEst ?? 0), 0) / posts.filter((p) => p.viewsEst).length
      : null;
    const avgLikes = posts.length > 0
      ? Math.round(posts.reduce((s, p) => s + (p.likesEst ?? 0), 0) / posts.length)
      : 0;
    const avgComments = posts.length > 0
      ? Math.round(posts.reduce((s, p) => s + (p.commentsEst ?? 0), 0) / posts.length)
      : 0;

    const formats = analyzed.map((p) => p.videoAnalysis!.contentFormat).filter(Boolean) as string[];
    const hookTypes = analyzed.map((p) => p.videoAnalysis!.hookType).filter(Boolean) as string[];
    const sentiments = analyzed.map((p) => p.videoAnalysis!.sentiment).filter(Boolean) as string[];
    const pacings = analyzed.map((p) => p.videoAnalysis!.pacingStyle).filter(Boolean) as string[];

    const topFormat = mostFrequent(formats) ?? "unknown";
    const topHook = mostFrequent(hookTypes) ?? "unknown";

    // Hook examples (real hook texts from analyzed posts)
    const hookExamples = analyzed
      .filter((p) => p.videoAnalysis?.hookText)
      .slice(0, 3)
      .map((p) => ({ hook: p.videoAnalysis!.hookText!, type: p.videoAnalysis!.hookType ?? "unknown" }));

    // Sentiment breakdown
    const sentimentBreakdown = countFreq(sentiments);

    // Top hashtags for this competitor
    const allHashtags = posts.flatMap((p) => safeParseArray(p.hashtags));
    const hashtagFreq = countFreq(allHashtags);
    const topHashtags = Object.entries(hashtagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);

    // Value props from analysis
    const valuePropExamples = analyzed
      .filter((p) => p.videoAnalysis?.valueProp)
      .slice(0, 2)
      .map((p) => p.videoAnalysis!.valueProp!);

    return {
      handle: c.handle,
      display_name: c.displayName,
      followers_est: c.followersEst,
      posts_analyzed: posts.length,
      avg_engagement_rate: Math.round(avgER * 100) / 100,
      avg_views_est: avgViews ? Math.round(avgViews) : null,
      avg_likes: avgLikes,
      avg_comments: avgComments,
      top_format: topFormat,
      top_hook_type: topHook,
      hook_examples: hookExamples,
      sentiment_breakdown: sentimentBreakdown,
      top_hashtags: topHashtags,
      value_prop_examples: valuePropExamples,
      pacing_dist: countFreq(pacings),
    };
  });

  // ── Top posts across all competitors ───────────────────────────────────────
  const allPosts = user.competitors
    .flatMap((c) =>
      c.posts.map((p) => ({
        id: p.id,
        competitor_handle: c.handle,
        caption: p.caption,
        hook_text: p.videoAnalysis?.hookText,
        hook_type: p.videoAnalysis?.hookType,
        value_prop: p.videoAnalysis?.valueProp,
        cta_text: p.videoAnalysis?.ctaText,
        pacing_style: p.videoAnalysis?.pacingStyle,
        content_format: p.videoAnalysis?.contentFormat,
        sentiment: p.videoAnalysis?.sentiment,
        power_words: safeParseArray(p.videoAnalysis?.powerWords ?? null),
        engagement_score: p.engagementScore ?? 0,
        likes_est: p.likesEst,
        comments_est: p.commentsEst,
        views_est: p.viewsEst,
        hashtags: safeParseArray(p.hashtags).slice(0, 8),
        thumbnail_url: p.thumbnailUrl,
        posted_at: p.postedAt,
      }))
    )
    .sort((a, b) => b.engagement_score - a.engagement_score)
    .slice(0, 15);

  // ── Engagement trend ────────────────────────────────────────────────────────
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

  // ── Global aggregates ───────────────────────────────────────────────────────
  const allAnalyzed = user.competitors.flatMap((c) =>
    c.posts.filter((p) => p.videoAnalysis).map((p) => p.videoAnalysis!)
  );

  // Content format breakdown for pie chart
  const formatFreq = countFreq(allAnalyzed.map((a) => a.contentFormat).filter(Boolean) as string[]);
  const FORMAT_COLORS: Record<string, string> = {
    educational:    "#7C3AED",
    testimonial:    "#EC4899",
    transformation: "#F97316",
    behind_scenes:  "#06B6D4",
    promotional:    "#10B981",
    entertainment:  "#F59E0B",
  };
  const totalFormats = Object.values(formatFreq).reduce((s, v) => s + v, 0) || 1;
  const content_format_breakdown = Object.entries(formatFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name: formatLabel(name),
      name_uz: formatLabelUz(name),
      value: Math.round((count / totalFormats) * 100),
      color: FORMAT_COLORS[name] ?? "#6B7280",
    }));

  // Sentiment aggregate
  const sentimentAll = countFreq(allAnalyzed.map((a) => a.sentiment).filter(Boolean) as string[]);
  const totalSentiment = Object.values(sentimentAll).reduce((s, v) => s + v, 0) || 1;
  const sentiment_breakdown = Object.entries(sentimentAll).map(([name, count]) => ({
    name,
    name_uz: sentimentLabelUz(name),
    count,
    pct: Math.round((count / totalSentiment) * 100),
  }));

  // Pacing breakdown
  const pacingAll = countFreq(allAnalyzed.map((a) => a.pacingStyle).filter(Boolean) as string[]);
  const totalPacing = Object.values(pacingAll).reduce((s, v) => s + v, 0) || 1;
  const pacing_breakdown = Object.entries(pacingAll).map(([name, count]) => ({
    name,
    name_uz: pacingLabelUz(name),
    count,
    pct: Math.round((count / totalPacing) * 100),
  }));

  // Global hashtag cloud (top 25 across all posts)
  const allPostsRaw = user.competitors.flatMap((c) => c.posts);

  // Heat map input: all posts with postedAt and engagementScore
  const allPostsFlat = allPostsRaw.map((p) => ({ postedAt: p.postedAt, engagementScore: p.engagementScore }));
  const posting_heat_map = computeHeatMap(allPostsFlat);
  const allHashtags = allPostsRaw.flatMap((p) => safeParseArray(p.hashtags));
  const hashtagFreq = countFreq(allHashtags);
  const hashtag_cloud = Object.entries(hashtagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([tag, count]) => ({ tag, count }));

  // Hook type breakdown
  const hookFreq = countFreq(allAnalyzed.map((a) => a.hookType).filter(Boolean) as string[]);
  const totalHooks = Object.values(hookFreq).reduce((s, v) => s + v, 0) || 1;
  const hook_breakdown = Object.entries(hookFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      type,
      type_uz: hookLabelUz(type),
      count,
      pct: Math.round((count / totalHooks) * 100),
    }));

  // Top CTA texts
  const ctaFreq = countFreq(
    allAnalyzed.map((a) => a.ctaText?.trim() ?? "").filter((v): v is string => Boolean(v) && v.length > 2)
  );
  const top_ctas = Object.entries(ctaFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([text, count]) => ({ text, count }));

  // Power words aggregate
  const allPowerWords = allAnalyzed.flatMap((a) => safeParseArray(a.powerWords ?? null));
  const powerFreq = countFreq(allPowerWords.filter(Boolean));
  const power_words = Object.entries(powerFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([word, count]) => ({ word, count }));

  // Niche summary (data-driven)
  const niche_summary = buildNicheSummary(user.competitors as any);

  return NextResponse.json({
    competitors,
    top_posts: allPosts,
    engagement_trend,
    content_format_breakdown,
    sentiment_breakdown,
    pacing_breakdown,
    hashtag_cloud,
    hook_breakdown,
    top_ctas,
    power_words,
    niche_summary,
    posting_heat_map,
    total_posts_analyzed: allPostsRaw.length,
    mock: false,
  });
}

// ── Heat Map ──────────────────────────────────────────────────────────────────

function computeHeatMap(posts: Array<{ postedAt: Date | null; engagementScore: number | null }>) {
  const DAYS_UZ = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
  const SLOTS = ["06–12", "12–17", "17–21", "21–06"];

  const matrix: Array<Array<{ count: number; totalEng: number }>> =
    Array.from({ length: 7 }, () => Array.from({ length: 4 }, () => ({ count: 0, totalEng: 0 })));

  for (const post of posts) {
    if (!post.postedAt) continue;
    const d = new Date(post.postedAt);
    const dayIdx = d.getDay();
    const hour = d.getHours();
    const slotIdx = hour >= 6 && hour < 12 ? 0 : hour >= 12 && hour < 17 ? 1 : hour >= 17 && hour < 21 ? 2 : 3;
    matrix[dayIdx][slotIdx].count++;
    matrix[dayIdx][slotIdx].totalEng += post.engagementScore ?? 0;
  }

  return DAYS_UZ.map((day, di) => ({
    day,
    slots: SLOTS.map((slot, si) => ({
      slot,
      count: matrix[di][si].count,
      avgEng: matrix[di][si].count > 0 ? matrix[di][si].totalEng / matrix[di][si].count : 0,
    })),
  }));
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function safeParseArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

function countFreq(arr: string[]): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const item of arr) if (item) freq[item] = (freq[item] ?? 0) + 1;
  return freq;
}

function mostFrequent(arr: string[]): string | null {
  if (!arr.length) return null;
  const freq = countFreq(arr);
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

function getWeekLabel(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatLabel(fmt: string): string {
  const m: Record<string, string> = {
    educational: "Educational", testimonial: "Testimonial",
    transformation: "Transformation", behind_scenes: "Behind Scenes",
    promotional: "Promotional", entertainment: "Entertainment",
  };
  return m[fmt] ?? fmt;
}

function formatLabelUz(fmt: string): string {
  const m: Record<string, string> = {
    educational: "Ta'limiy", testimonial: "Guvohnoma",
    transformation: "O'zgarish", behind_scenes: "Sahna ortida",
    promotional: "Reklama", entertainment: "Ko'ngilochar",
  };
  return m[fmt] ?? fmt;
}

function sentimentLabelUz(s: string): string {
  const m: Record<string, string> = { positive: "Ijobiy", neutral: "Neytral", urgent: "Shoshilinch" };
  return m[s] ?? s;
}

function pacingLabelUz(s: string): string {
  const m: Record<string, string> = { fast: "Tez", medium: "O'rta", slow: "Sekin" };
  return m[s] ?? s;
}

function hookLabelUz(s: string): string {
  const m: Record<string, string> = {
    question: "Savol", shock: "Shok", promise: "Va'da",
    story: "Hikoya", stat: "Statistika", pov: "POV",
  };
  return m[s] ?? s;
}

// ── Niche summary ─────────────────────────────────────────────────────────────
function buildNicheSummary(competitors: any[]): object | null {
  const allPosts = competitors.flatMap((c: any) => c.posts);
  const analyzed = allPosts.filter((p: any) => p.videoAnalysis);
  if (analyzed.length === 0) return null;

  const hookFreq: Record<string, { count: number; examples: string[] }> = {};
  analyzed.forEach((p: any) => {
    const type = p.videoAnalysis?.hookType;
    if (!type) return;
    if (!hookFreq[type]) hookFreq[type] = { count: 0, examples: [] };
    hookFreq[type].count++;
    if (p.videoAnalysis?.hookText && hookFreq[type].examples.length < 2)
      hookFreq[type].examples.push(p.videoAnalysis.hookText);
  });
  const best_hook_styles = Object.entries(hookFreq)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .map(([type, { count, examples }]) => {
      const score = Math.round((count / analyzed.length) * 100);
      return { type, score, effectiveness_score: score, example: examples[0] ?? "—" };
    });

  const formatFreq: Record<string, { count: number; totalER: number }> = {};
  analyzed.forEach((p: any) => {
    const fmt = p.videoAnalysis?.contentFormat;
    if (!fmt) return;
    if (!formatFreq[fmt]) formatFreq[fmt] = { count: 0, totalER: 0 };
    formatFreq[fmt].count++;
    formatFreq[fmt].totalER += p.engagementScore ?? 0;
  });
  const formatDescs: Record<string, string> = {
    educational: "Foydali ma'lumot beradi — ishonch va otorite quradi",
    testimonial: "Haqiqiy mijoz hikoyalari — eng kuchli ishonch signali",
    transformation: "Oldin/keyin ko'rsatadi — kuchli vizual hook",
    behind_scenes: "Jarayonni ko'rsatadi — brendni insoniylashtiradi",
    promotional: "To'g'ridan-to'g'ri taklif — ishonch qurilganda ishlaydi",
    entertainment: "Qiziqarli/o'xshash kontent — erishuvni maksimallashtiradi",
  };
  const top_content_formats = Object.entries(formatFreq)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .map(([format, { count, totalER }]) => ({
      format,
      avg_engagement_lift: Math.round((totalER / count) * 10) / 10,
      description: formatDescs[format] ?? "Nishaingiz uchun samarali",
    }));

  const wordFreq: Record<string, number> = {};
  analyzed.forEach((p: any) => {
    safeParseArr(p.videoAnalysis?.powerWords).forEach((w: string) => {
      wordFreq[w] = (wordFreq[w] ?? 0) + 1;
    });
  });
  const power_phrases = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word]) => word);

  const patternFreq: Record<string, number> = {};
  analyzed.forEach((p: any) => {
    const hook = p.videoAnalysis?.hookType;
    const fmt = p.videoAnalysis?.contentFormat;
    if (hook && fmt) patternFreq[`${hookLabelUz(hook)} + ${formatLabelUz(fmt)}`] = (patternFreq[`${hookLabelUz(hook)} + ${formatLabelUz(fmt)}`] ?? 0) + 1;
  });
  const winning_patterns = Object.entries(patternFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([pattern, frequency]) => ({
      pattern,
      frequency: Math.round((frequency / analyzed.length) * 100),
      why_it_works: "Bu kombinatsiya raqobatchilar orasida yuqori jalb darajasini ko'rsatmoqda",
    }));

  const dayNames = ["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"];
  const dayFreq: Record<number, number> = {};
  const hourFreq: Record<number, number> = {};
  allPosts.forEach((p: any) => {
    if (!p.postedAt) return;
    const d = new Date(p.postedAt);
    dayFreq[d.getDay()] = (dayFreq[d.getDay()] ?? 0) + 1;
    hourFreq[d.getHours()] = (hourFreq[d.getHours()] ?? 0) + 1;
  });
  const topDays = Object.entries(dayFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d]) => dayNames[Number(d)]);
  const topHours = Object.entries(hourFreq).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([h]) => `${h}:00`);

  return {
    winning_patterns,
    best_hook_styles,
    top_content_formats,
    power_phrases,
    best_posting_patterns: {
      times: topHours.length ? topHours : ["18:00", "12:00"],
      days: topDays.length ? topDays : ["Seshanba", "Payshanba", "Shanba"],
      frequency: "Haftada 4-6 post",
    },
  };
}

function safeParseArr(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}
