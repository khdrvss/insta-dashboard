import { getAuth as auth } from "@/lib/mock-auth";
import { NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";
import mockData from "@/mock/competitors_discovery.json";

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Mock mode: return stored confirmed competitors from memory
  if (process.env.USE_MOCK_DATA === "true") {
    return NextResponse.json({
      competitors: mockData.candidates
        .filter((c: any) => c.confirmed)
        .map((c: any) => ({
          id: c.handle,
          handle: c.handle,
          displayName: c.display_name,
          profilePicUrl: c.profile_pic_url,
          bio: c.bio,
          followersEst: c.followers_est,
          relevanceScore: c.relevance_score,
          confirmed: true,
          discoverySource: c.source,
          _count: { posts: 0 },
        })),
    });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ competitors: [] });

  const competitors = await prisma.competitor.findMany({
    where: { userId: user.id },
    orderBy: [{ confirmed: "desc" }, { relevanceScore: "desc" }],
    include: { _count: { select: { posts: true } } },
  });

  return NextResponse.json({ competitors });
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Mock mode: store temporarily in a way the GET can return
  // For real functionality, this relies on POST /confirm saving to DB
  if (process.env.USE_MOCK_DATA === "true") {
    return NextResponse.json({ saved: true, competitor: body, mock: true });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ saved: true });
}
