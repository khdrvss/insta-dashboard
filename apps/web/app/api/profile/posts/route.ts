import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";
import mockPosts from "@/mock/user_posts.json";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (process.env.USE_MOCK_DATA === "true") {
    return NextResponse.json({ posts: mockPosts.posts, mock: true });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const posts = await prisma.userPost.findMany({
    where: { userId: user.id },
    orderBy: [{ engagementRate: "desc" }, { postedAt: "desc" }],
    take: 30,
  });

  return NextResponse.json({ posts });
}

/** Trigger a manual re-sync with Meta Graph API */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (process.env.USE_MOCK_DATA === "true") {
    return NextResponse.json({ synced: true, mock: true });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { instagramAccount: true },
  });

  if (!user?.metaAccessToken) {
    return NextResponse.json({ error: "Instagram not connected" }, { status: 400 });
  }

  // Check token expiry
  if (user.metaTokenExpiry && user.metaTokenExpiry < new Date()) {
    return NextResponse.json(
      { error: "Instagram token expired — please reconnect" },
      { status: 401 }
    );
  }

  // Re-trigger the full sync by redirecting to OAuth (client should redirect)
  return NextResponse.json({ redirect: "/api/auth/instagram" });
}
