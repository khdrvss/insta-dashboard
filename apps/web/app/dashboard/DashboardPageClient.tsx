"use client";

import { BarChart3, TrendingUp, Users, Zap, Instagram, Image, Video, Layers } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProfileOverview } from "@/components/dashboard/ProfileOverview";
import { formatNumber, formatEngagementRate } from "@/lib/utils";
import { useLang } from "@/lib/i18n/context";
import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

interface Stats {
  followers: number | null;
  avgEngagement: number | null;
  postsAnalyzed: number;
  competitorsTracked: number;
  connected: boolean;
}

interface UserPost {
  id: string;
  mediaType: string;
  caption: string | null;
  engagementRate: number | null;
  likeCount: number | null;
  commentCount: number | null;
  postedAt: string | null;
  permalink: string | null;
}

// ── My Performance ─────────────────────────────────────────────────────────────
function MyPerformance() {
  const { T } = useLang();
  const p = T.performance;
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile/posts");
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts ?? []);
        }
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, []);

  const MEDIA_ICONS: Record<string, React.ElementType> = {
    IMAGE: Image,
    VIDEO: Video,
    CAROUSEL_ALBUM: Layers,
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="font-semibold text-white">{p.title}</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-24 bg-white/5 rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 bg-white/5 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold text-white mb-4">{p.title}</h2>
        <div className="rounded-xl border border-dashed border-white/15 p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-3">
            <Instagram className="h-6 w-6 text-violet-400" />
          </div>
          <p className="text-sm text-white/40">{p.connect}</p>
        </div>
      </div>
    );
  }

  // Sparkline: last 12 posts sorted chronologically by postedAt
  const chronological = [...posts]
    .filter((post) => post.engagementRate != null)
    .sort((a, b) => new Date(a.postedAt ?? 0).getTime() - new Date(b.postedAt ?? 0).getTime())
    .slice(-12);
  const sparklineData = chronological.map((post, i) => ({ i, er: post.engagementRate ?? 0 }));

  // Avg ER
  const withEr = posts.filter((post) => post.engagementRate != null);
  const avgEr = withEr.length > 0
    ? withEr.reduce((s, post) => s + (post.engagementRate ?? 0), 0) / withEr.length
    : 0;

  // Best posting time
  const dayNames = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
  const dayHourFreq: Record<string, number> = {};
  posts.forEach((post) => {
    if (!post.postedAt) return;
    const d = new Date(post.postedAt);
    const key = `${dayNames[d.getDay()]} ${d.getHours()}:00`;
    dayHourFreq[key] = (dayHourFreq[key] ?? 0) + 1;
  });
  const bestTime = Object.entries(dayHourFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? p.noData;

  // Best format (from top 50% of posts by ER)
  const sortedByEr = [...posts].sort((a, b) => (b.engagementRate ?? 0) - (a.engagementRate ?? 0));
  const topHalf = sortedByEr.slice(0, Math.ceil(sortedByEr.length / 2));
  const formatFreq: Record<string, number> = {};
  topHalf.forEach((post) => { formatFreq[post.mediaType] = (formatFreq[post.mediaType] ?? 0) + 1; });
  const bestFormat = Object.entries(formatFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? p.noData;

  // Top 3 / bottom 3
  const top3 = sortedByEr.slice(0, 3);
  const bottom3 = sortedByEr.slice(-3).reverse();

  function PostPill({ post }: { post: UserPost }) {
    const Icon = MEDIA_ICONS[post.mediaType] ?? Image;
    const isOpen = expandedId === post.id;
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <button
          onClick={() => setExpandedId(isOpen ? null : post.id)}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
        >
          <Icon className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
          <span className="text-xs text-white/60 flex-1 min-w-0 truncate text-left">
            {post.caption?.slice(0, 40) ?? p.noData}
          </span>
          <span className="text-xs font-bold text-violet-300 flex-shrink-0">
            {post.engagementRate != null ? `${post.engagementRate.toFixed(1)}%` : "—"}
          </span>
        </button>
        {isOpen && post.caption && (
          <div className="px-3 pb-3 border-t border-white/10 pt-2">
            <p className="text-xs text-white/40 leading-relaxed">{post.caption.slice(0, 200)}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
      <h2 className="font-semibold text-white">{p.title}</h2>

      {/* Sparkline */}
      {sparklineData.length > 1 && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <p className="text-xs text-white/40 mb-2">Jalb darajasi trendi (so'nggi {sparklineData.length} post)</p>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={sparklineData}>
              <defs>
                <linearGradient id="erGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
              <Line
                type="monotone"
                dataKey="er"
                stroke="url(#erGrad)"
                strokeWidth={2}
                dot={false}
                strokeLinecap="round"
              />
              <Tooltip
                contentStyle={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                labelFormatter={() => ""}
                formatter={(v: number) => [`${v.toFixed(2)}%`, "ER"]}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
          <div className="text-lg font-bold text-white">{avgEr.toFixed(1)}%</div>
          <div className="text-xs text-white/40 mt-0.5">{p.avgEr}</div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
          <div className="text-sm font-bold text-white leading-tight">{bestTime}</div>
          <div className="text-xs text-white/40 mt-0.5">{p.bestTime}</div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
          <div className="text-sm font-bold text-white leading-tight">{bestFormat}</div>
          <div className="text-xs text-white/40 mt-0.5">{p.bestFormat}</div>
        </div>
      </div>

      {/* Top 3 / Bottom 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">{p.topPosts}</p>
          <div className="space-y-1.5">
            {top3.map((post) => <PostPill key={post.id} post={post} />)}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">{p.worstPosts}</p>
          <div className="space-y-1.5">
            {bottom3.map((post) => <PostPill key={post.id} post={post} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard page client ─────────────────────────────────────────────────
export function DashboardPageClient({ stats }: { stats: Stats }) {
  const { T } = useLang();
  const d = T.dashboard;

  const steps = [
    { step: 1, title: d.steps.s1title, desc: d.steps.s1desc, done: true },
    { step: 2, title: d.steps.s2title, desc: d.steps.s2desc, done: stats.connected },
    { step: 3, title: d.steps.s3title, desc: d.steps.s3desc, done: stats.competitorsTracked > 0 },
    { step: 4, title: d.steps.s4title, desc: d.steps.s4desc, done: false },
    { step: 5, title: d.steps.s5title, desc: d.steps.s5desc, done: false },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{d.pageTitle}</h1>
        <p className="text-white/50 mt-1">{d.pageSubtitle}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={d.followers}
          value={stats.followers ? formatNumber(stats.followers) : "—"}
          subtext={stats.connected ? undefined : d.connectToSee}
          icon={Users}
          color="violet"
        />
        <StatCard
          label={d.avgEngagement}
          value={stats.avgEngagement ? formatEngagementRate(stats.avgEngagement) : "—"}
          subtext={stats.connected ? d.aiEstimated30 : d.connectToSee}
          icon={TrendingUp}
          color="pink"
        />
        <StatCard
          label={d.postsAnalyzed}
          value={stats.postsAnalyzed}
          subtext={stats.postsAnalyzed > 0 ? d.fromInstagram : d.connectToStart}
          icon={BarChart3}
          color="orange"
        />
        <StatCard
          label={d.competitorsTracked}
          value={stats.competitorsTracked}
          subtext={stats.competitorsTracked > 0 ? d.confirmedComps : d.runDiscovery}
          icon={Zap}
          color="green"
        />
      </div>

      {/* Profile overview */}
      <ProfileOverview />

      {/* My content performance */}
      <MyPerformance />

      {/* Getting started checklist */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold text-white mb-4">{d.gettingStarted}</h2>
        <div className="space-y-3">
          {steps.map(({ step, title, desc, done }) => (
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
