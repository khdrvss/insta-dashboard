import { NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";
import {
  getIGProfile,
  getIGMedia,
  calculateEngagementMetrics,
  extractHashtags,
} from "@/lib/meta-graph";

// Syncs Instagram data using META_ACCESS_TOKEN from env into the database.
// Call GET /api/auth/instagram/sync once to populate the dashboard with real data.
export async function GET() {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "META_ACCESS_TOKEN not set in env" }, { status: 400 });
  }

  try {
    const [profile, media] = await Promise.all([
      getIGProfile(token),
      getIGMedia(token, 30),
    ]);

    const metrics = calculateEngagementMetrics(media, profile.followers_count);

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

    const user = await prisma.user.findUnique({ where: { clerkId: "user_001" } });
    if (!user) return NextResponse.json({ error: "User not seeded. Run seed script first." }, { status: 404 });

    const topHashtagsJson = JSON.stringify(topHashtags);
    const contentMixJson  = JSON.stringify(metrics.contentMix);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          instagramHandle: profile.username,
          metaAccessToken: token,
          metaTokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        },
      }),
      prisma.instagramAccount.upsert({
        where: { userId: user.id },
        update: {
          igUserId:          profile.id,
          username:          profile.username,
          name:              profile.name,
          biography:         profile.biography,
          profilePictureUrl: profile.profile_picture_url,
          followersCount:    profile.followers_count,
          followsCount:      profile.follows_count,
          mediaCount:        profile.media_count,
          avgEngagementRate: metrics.avgEngagementRate,
          avgLikes:          metrics.avgLikes,
          avgComments:       metrics.avgComments,
          postingFreqPerWk:  metrics.postingFreqPerWk,
          topHashtags:       topHashtagsJson,
          contentMix:        contentMixJson,
          lastSyncedAt:      new Date(),
        },
        create: {
          userId:            user.id,
          igUserId:          profile.id,
          username:          profile.username,
          name:              profile.name,
          biography:         profile.biography,
          profilePictureUrl: profile.profile_picture_url,
          followersCount:    profile.followers_count,
          followsCount:      profile.follows_count,
          mediaCount:        profile.media_count,
          avgEngagementRate: metrics.avgEngagementRate,
          avgLikes:          metrics.avgLikes,
          avgComments:       metrics.avgComments,
          postingFreqPerWk:  metrics.postingFreqPerWk,
          topHashtags:       topHashtagsJson,
          contentMix:        contentMixJson,
        },
      }),
      prisma.userPost.deleteMany({ where: { userId: user.id } }),
    ]);

    if (media.length) {
      await prisma.userPost.createMany({
        data: media.map((post) => ({
          userId:      user.id,
          igMediaId:   post.id,
          mediaType:
            post.media_type === "CAROUSEL_ALBUM" ? "carousel"
            : post.media_type === "VIDEO"        ? "reel"
            : "image",
          caption:         post.caption,
          hashtags:        JSON.stringify(extractHashtags(post.caption ?? "")),
          mediaUrl:        post.media_url,
          thumbnailUrl:    post.thumbnail_url ?? post.media_url,
          permalink:       post.permalink,
          likeCount:       post.like_count ?? 0,
          commentCount:    post.comments_count ?? 0,
          engagementRate:
            profile.followers_count > 0
              ? (((post.like_count ?? 0) + (post.comments_count ?? 0)) / profile.followers_count) * 100
              : 0,
          postedAt: post.timestamp ? new Date(post.timestamp) : null,
        })),
      });
    }

    return NextResponse.json({
      ok:       true,
      username: profile.username,
      followers: profile.followers_count,
      posts:    media.length,
      metrics,
    });
  } catch (err) {
    console.error("[ig-sync]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
