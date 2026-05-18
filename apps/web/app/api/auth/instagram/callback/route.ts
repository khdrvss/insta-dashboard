import { getAuth as auth } from "@/lib/mock-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getIGProfile,
  getIGMedia,
  calculateEngagementMetrics,
  extractHashtags,
} from "@/lib/meta-graph";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(`${APP_URL}/sign-in`);

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  // User denied access
  if (error || !code) {
    console.error("[ig-callback] OAuth denied or missing code:", error);
    return NextResponse.redirect(`${APP_URL}/dashboard?ig_error=access_denied`);
  }

  // Verify state matches userId
  if (!state?.startsWith(userId)) {
    return NextResponse.redirect(`${APP_URL}/dashboard?ig_error=invalid_state`);
  }

  try {
    // 1. Exchange code for short-lived token
    const shortToken = await exchangeCodeForToken(code);

    // 2. Get long-lived token (60 days)
    const { token: longToken, expiresIn } = await getLongLivedToken(shortToken);

    // 3. Fetch profile + recent media in parallel using the long-lived token
    const [profile, media] = await Promise.all([
      getIGProfile(longToken),
      getIGMedia(longToken, 30),
    ]);

    const igUserId = profile.id;

    const metrics = calculateEngagementMetrics(media, profile.followers_count);

    // Gather top hashtags across all posts
    const hashtagFreq: Record<string, number> = {};
    for (const post of media) {
      for (const tag of extractHashtags(post.caption ?? "")) {
        hashtagFreq[tag] = (hashtagFreq[tag] ?? 0) + 1;
      }
    }
    const topHashtags = Object.entries(hashtagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag);

    // 6. Store everything in DB
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.redirect(`${APP_URL}/onboarding`);

    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    // SQLite: arrays/objects must be JSON strings
    const topHashtagsJson = JSON.stringify(topHashtags);
    const contentMixJson = JSON.stringify(metrics.contentMix);

    await prisma.$transaction([
      // Update user with token
      prisma.user.update({
        where: { id: user.id },
        data: {
          instagramHandle: profile.username,
          metaAccessToken: longToken,
          metaTokenExpiry: tokenExpiry,
        },
      }),
      // Upsert Instagram account snapshot
      prisma.instagramAccount.upsert({
        where: { userId: user.id },
        update: {
          igUserId,
          username: profile.username,
          name: profile.name,
          biography: profile.biography,
          profilePictureUrl: profile.profile_picture_url,
          followersCount: profile.followers_count,
          followsCount: profile.follows_count,
          mediaCount: profile.media_count,
          avgEngagementRate: metrics.avgEngagementRate,
          avgLikes: metrics.avgLikes,
          avgComments: metrics.avgComments,
          postingFreqPerWk: metrics.postingFreqPerWk,
          topHashtags: topHashtagsJson,
          contentMix: contentMixJson,
          lastSyncedAt: new Date(),
        },
        create: {
          userId: user.id,
          igUserId,
          username: profile.username,
          name: profile.name,
          biography: profile.biography,
          profilePictureUrl: profile.profile_picture_url,
          followersCount: profile.followers_count,
          followsCount: profile.follows_count,
          mediaCount: profile.media_count,
          avgEngagementRate: metrics.avgEngagementRate,
          avgLikes: metrics.avgLikes,
          avgComments: metrics.avgComments,
          postingFreqPerWk: metrics.postingFreqPerWk,
          topHashtags: topHashtagsJson,
          contentMix: contentMixJson,
        },
      }),
      // Clear old posts and insert fresh batch
      prisma.userPost.deleteMany({ where: { userId: user.id } }),
    ]);

    // Insert posts (outside transaction — can be large)
    if (media.length) {
      await prisma.userPost.createMany({
        data: media.map((post) => ({
          userId: user.id,
          igMediaId: post.id,
          mediaType:
            post.media_type === "CAROUSEL_ALBUM"
              ? "carousel"
              : post.media_type === "VIDEO"
              ? "reel"
              : "image",
          caption: post.caption,
          hashtags: JSON.stringify(extractHashtags(post.caption ?? "")),
          mediaUrl: post.media_url,
          thumbnailUrl: post.thumbnail_url ?? post.media_url,
          permalink: post.permalink,
          likeCount: post.like_count ?? 0,
          commentCount: post.comments_count ?? 0,
          engagementRate:
            profile.followers_count > 0
              ? (((post.like_count ?? 0) + (post.comments_count ?? 0)) /
                  profile.followers_count) *
                100
              : 0,
          postedAt: post.timestamp ? new Date(post.timestamp) : null,
        })),
      });
    }

    return NextResponse.redirect(`${APP_URL}/dashboard?ig_connected=1`);
  } catch (err) {
    console.error("[ig-callback] Error:", err);
    return NextResponse.redirect(`${APP_URL}/dashboard?ig_error=server_error`);
  }
}
