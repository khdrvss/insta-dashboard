import { currentUser } from "@clerk/nextjs/server";
import { BarChart3, TrendingUp, Users, Zap, Clock } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProfileOverview } from "@/components/dashboard/ProfileOverview";
import { prisma } from "@instagram-dashboard/db";
import { formatNumber, formatEngagementRate } from "@/lib/utils";
import mockProfile from "@/mock/user_profile.json";

export const metadata = { title: "Your Profile" };

async function getDashboardStats(clerkId: string) {
  if (process.env.USE_MOCK_DATA === "true") {
    const ig = mockProfile.instagram;
    const competitorCount = 10;
    return {
      followers: ig.followersCount,
      avgEngagement: ig.avgEngagementRate,
      postsAnalyzed: ig.mediaCount,
      competitorsTracked: competitorCount,
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
  const user = await currentUser();
  const stats = await getDashboardStats(user!.id);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Your Profile</h1>
        <p className="text-white/50 mt-1">
          Overview of your Instagram account performance
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Followers"
          value={stats.followers ? formatNumber(stats.followers) : "—"}
          subtext={stats.connected ? undefined : "Connect Instagram to see"}
          icon={Users}
          color="violet"
        />
        <StatCard
          label="Avg Engagement Rate"
          value={stats.avgEngagement ? formatEngagementRate(stats.avgEngagement) : "—"}
          subtext={stats.connected ? "AI-estimated · last 30 posts" : "Connect Instagram to see"}
          icon={TrendingUp}
          color="pink"
        />
        <StatCard
          label="Posts Analyzed"
          value={stats.postsAnalyzed}
          subtext={stats.postsAnalyzed > 0 ? "From your Instagram" : "Connect to start"}
          icon={BarChart3}
          color="orange"
        />
        <StatCard
          label="Competitors Tracked"
          value={stats.competitorsTracked}
          subtext={stats.competitorsTracked > 0 ? "Confirmed competitors" : "Run competitor discovery"}
          icon={Zap}
          color="green"
        />
      </div>

      {/* Profile overview component (client, fetches own data) */}
      <ProfileOverview />

      {/* Getting started checklist */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold text-white mb-4">Getting Started</h2>
        <div className="space-y-3">
          {[
            {
              step: 1,
              title: "Complete your profile",
              desc: "Add your niche, location, and brand voice",
              done: true,
            },
            {
              step: 2,
              title: "Connect Instagram",
              desc: "Link your Instagram Business account via Meta OAuth",
              done: stats.connected,
            },
            {
              step: 3,
              title: "Discover competitors",
              desc: "Run AI-powered competitor discovery for your niche",
              done: stats.competitorsTracked > 0,
            },
            {
              step: 4,
              title: "Analyze top content",
              desc: "Extract winning patterns from competitor Reels",
              done: false,
            },
            {
              step: 5,
              title: "Generate your first script",
              desc: "Create high-converting Reels scripts in seconds",
              done: false,
            },
          ].map(({ step, title, desc, done }) => (
            <div key={step} className="flex items-start gap-4">
              <div
                className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  done
                    ? "gradient-brand text-white"
                    : "border border-white/20 text-white/40"
                }`}
              >
                {done ? "✓" : step}
              </div>
              <div>
                <div className={`text-sm font-medium ${done ? "text-white" : "text-white/70"}`}>
                  {title}
                </div>
                <div className="text-xs text-white/30 mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
