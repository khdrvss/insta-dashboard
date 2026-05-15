import { getAuth as auth } from "@/lib/mock-auth";
import { NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ competitors: [] });

  const competitors = await prisma.competitor.findMany({
    where: { userId: user.id },
    orderBy: [{ confirmed: "desc" }, { relevanceScore: "desc" }],
    include: { _count: { select: { posts: true } } },
  });

  return NextResponse.json({ competitors });
}
