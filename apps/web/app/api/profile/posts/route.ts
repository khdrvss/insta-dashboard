import { getAuth as auth } from "@/lib/mock-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";
import { getIGMedia, extractHashtags } from "@/lib/meta-graph";
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
    orderBy: { postedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ posts, postCount: posts.length });
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

  try {
    // Fetch up to 50 latest posts from Instagram Graph API
    const media = await getIGMedia(user.metaAccessToken, 50);

    if (!media.length) {
      return NextResponse.json({ synced: true, count: 0, message: "No posts returned from Instagram" });
    }

    const followersCount = user.instagramAccount?.followersCount ?? 1;

    // Upsert each post — create if new, update metrics if existing
    await Promise.all(
      media.map((post) => {
        const engagementRate =
          ((post.like_count ?? 0) + (post.comments_count ?? 0)) / followersCount * 100;

        return prisma.userPost.upsert({
          where: { igMediaId: post.id },
          create: {
            userId:      user.id,
            igMediaId:   post.id,
            mediaType:   post.media_type.toLowerCase(),
            caption:     post.caption ?? null,
            hashtags:    JSON.stringify(extractHashtags(post.caption ?? "")),
            mediaUrl:    post.media_url ?? null,
            thumbnailUrl: post.thumbnail_url ?? null,
            permalink:   post.permalink,
            likeCount:   post.like_count ?? 0,
            commentCount: post.comments_count ?? 0,
            engagementRate,
            postedAt:    new Date(post.timestamp),
          },
          update: {
            likeCount:     post.like_count ?? 0,
            commentCount:  post.comments_count ?? 0,
            engagementRate,
            caption:       post.caption ?? null,
            mediaUrl:      post.media_url ?? null,
            thumbnailUrl:  post.thumbnail_url ?? null,
          },
        });
      })
    );

    return NextResponse.json({ synced: true, count: media.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[profile/posts POST] sync failed:", message);

    // Detect expired / revoked token — prompt the user to reconnect
    const isOAuthError =
      message.includes("OAuthException") ||
      message.includes("API access blocked") ||
      message.includes("token") ||
      message.includes("code\":190") ||
      message.includes("code\":200");

    if (isOAuthError) {
      return NextResponse.json(
        { tokenExpired: true, redirect: "/api/auth/instagram" },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: `Sync failed: ${message}` }, { status: 500 });
  }
}
