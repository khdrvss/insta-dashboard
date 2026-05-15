"use client";

import { BarChart3, TrendingUp, Users, Zap } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProfileOverview } from "@/components/dashboard/ProfileOverview";
import { formatNumber, formatEngagementRate } from "@/lib/utils";
import { useLang } from "@/lib/i18n/context";

interface Stats {
  followers: number | null;
  avgEngagement: number | null;
  postsAnalyzed: number;
  competitorsTracked: number;
  connected: boolean;
}

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
