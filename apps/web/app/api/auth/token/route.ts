/**
 * POST /api/auth/token
 * Save a manually-pasted Instagram access token.
 * Validates it against the Graph API, upserts the InstagramAccount,
 * then syncs the latest posts — no OAuth flow needed.
 */
import { getAuth as auth } from "@/lib/mock-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";
import { getIGProfile, getIGMedia, calculateEngagementMetrics, extractHashtags } from "@/lib/meta-graph";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const token: string = (body.token ?? "").trim();

  if (!token || token.length < 20) {
    return NextResponse.json({ error: "Please paste a valid Instagram access token." }, { status: 400 });
  }

  // ── 1. Validate token against Instagram Graph API ────────────────────────
  let igProfile;
  try {
    igProfile = await getIGProfile(token);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isExpired = msg.includes("OAuthException") || msg.includes("code\":190") || msg.includes("code\":200");
    return NextResponse.json(
      { error: isExpired ? "Token is expired or invalid — generate a new one from Meta Graph Explorer." : `Instagram rejected this token: ${msg}` },
      { status: 400 }
    );
  }

  // ── 2. Find or create user ───────────────────────────────────────────────
  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    user = await prisma.user.create({ data: { clerkId: userId } });
  }

  // ── 3. Set a generous expiry (60 days from now for long-lived tokens) ────
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  // ── 4. Update user with token ────────────────────────────────────────────
  await prisma.user.update({
    where: { id: user.id },
    data: {
      metaAccessToken: token,
      metaTokenExpiry: expiresAt,
    },
  });

  // ── 5. Fetch posts to compute engagement metrics ─────────────────────────
  const media = await getIGMedia(token, 50).catch(() => []);
  const metrics = calculateEngagementMetrics(media, igProfile.followers_count);

  // ── 6. Upsert InstagramAccount snapshot ─────────────────────────────────
  await prisma.instagramAccount.upsert({
    where: { userId: user.id },
    create: {
      userId:           user.id,
      igUserId:         igProfile.id,
      username:         igProfile.username,
      name:             igProfile.name ?? null,
      biography:        igProfile.biography ?? null,
      followersCount:   igProfile.followers_count,
      followsCount:     igProfile.follows_count,
      mediaCount:       igProfile.media_count,
      avgEngagementRate: metrics.avgEngagementRate,
      avgLikes:         metrics.avgLikes,
      avgComments:      metrics.avgComments,
      postingFreqPerWk: metrics.postingFreqPerWk,
      contentMix:       JSON.stringify(metrics.contentMix),
      topHashtags:      JSON.stringify([]),
      lastSyncedAt:     new Date(),
    },
    update: {
      username:         igProfile.username,
      name:             igProfile.name ?? null,
      biography:        igProfile.biography ?? null,
      followersCount:   igProfile.followers_count,
      followsCount:     igProfile.follows_count,
      mediaCount:       igProfile.media_count,
      avgEngagementRate: metrics.avgEngagementRate,
      avgLikes:         metrics.avgLikes,
      avgComments:      metrics.avgComments,
      postingFreqPerWk: metrics.postingFreqPerWk,
      contentMix:       JSON.stringify(metrics.contentMix),
      lastSyncedAt:     new Date(),
    },
  });

  // ── 7. Upsert all posts ──────────────────────────────────────────────────
  let synced = 0;
  if (media.length > 0) {
    await Promise.all(
      media.map((post) => {
        const engagementRate =
          ((post.like_count ?? 0) + (post.comments_count ?? 0)) /
          Math.max(igProfile.followers_count, 1) * 100;

        return prisma.userPost.upsert({
          where: { igMediaId: post.id },
          create: {
            userId:       user!.id,
            igMediaId:    post.id,
            mediaType:    post.media_type.toLowerCase(),
            caption:      post.caption ?? null,
            hashtags:     JSON.stringify(extractHashtags(post.caption ?? "")),
            mediaUrl:     post.media_url ?? null,
            thumbnailUrl: post.thumbnail_url ?? null,
            permalink:    post.permalink,
            likeCount:    post.like_count ?? 0,
            commentCount: post.comments_count ?? 0,
            engagementRate,
            postedAt:     new Date(post.timestamp),
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
    synced = media.length;
  }

  return NextResponse.json({
    ok: true,
    username:  igProfile.username,
    followers: igProfile.followers_count,
    synced,
  });
}
