import { getCurrentUser } from "@/lib/mock-auth";
import { prisma } from "@instagram-dashboard/db";
import { formatNumber, formatEngagementRate } from "@/lib/utils";
import mockProfile from "@/mock/user_profile.json";
import { DashboardPageClient } from "./DashboardPageClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Profile" };

async function getDashboardStats(clerkId: string) {
  if (process.env.USE_MOCK_DATA === "true") {
    const ig = mockProfile.instagram;
    return {
      followers: ig.followersCount,
      avgEngagement: ig.avgEngagementRate,
      postsAnalyzed: ig.mediaCount,
      competitorsTracked: 10,
      connected: true,
    };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      instagramAccount: true,
      _count: {
        select: {
          competitors: { where: { confirmed: true } },
          userPosts: true,
        },
      },
    },
  });

  return {
    followers: user?.instagramAccount?.followersCount ?? null,
    avgEngagement: user?.instagramAccount?.avgEngagementRate ?? null,
    postsAnalyzed: user?._count?.userPosts ?? 0,
    competitorsTracked: user?._count?.competitors ?? 0,
    connected: !!user?.metaAccessToken,
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const stats = await getDashboardStats(user!.id);
  return <DashboardPageClient stats={stats} />;
}
