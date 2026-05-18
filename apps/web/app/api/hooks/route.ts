import { getAuth as auth } from "@/lib/mock-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ hooks: [] });

  const { searchParams } = new URL(req.url);
  const typeFilter = searchParams.get("type");
  const searchQuery = searchParams.get("search");

  const analyses = await prisma.videoAnalysis.findMany({
    where: {
      hookText: { not: null },
      post: { competitor: { userId: user.id, confirmed: true } },
      ...(typeFilter ? { hookType: typeFilter } : {}),
    },
    include: {
      post: {
        select: {
          likesEst: true,
          viewsEst: true,
          caption: true,
          postedAt: true,
          mediaType: true,
          competitor: { select: { handle: true, displayName: true } },
        },
      },
    },
    orderBy: { analyzedAt: "desc" },
    take: 200,
  });

  let hooks = analyses.map((a) => ({
    id: a.id,
    hookText: a.hookText!,
    hookType: a.hookType ?? "unknown",
    competitorHandle: a.post.competitor.handle,
    competitorName: a.post.competitor.displayName,
    caption: a.post.caption,
    postedAt: a.post.postedAt,
    likesEst: a.post.likesEst,
    viewsEst: a.post.viewsEst,
    contentFormat: a.contentFormat,
    ctaText: a.ctaText,
    sentiment: a.sentiment,
  }));

  // Search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    hooks = hooks.filter((h) => h.hookText.toLowerCase().includes(q));
  }

  // Sort by likesEst desc, then viewsEst desc
  hooks.sort((a, b) => {
    const likeDiff = (b.likesEst ?? 0) - (a.likesEst ?? 0);
    if (likeDiff !== 0) return likeDiff;
    return (b.viewsEst ?? 0) - (a.viewsEst ?? 0);
  });

  return NextResponse.json({ hooks });
}
