"use client";

import { Instagram, TrendingUp, TrendingDown } from "lucide-react";
import { formatNumber, formatEngagementRate } from "@/lib/utils";

interface Competitor {
  handle: string;
  display_name?: string;
  followers_est?: number;
  posts_analyzed: number;
  avg_engagement_rate: number;
  top_format: string;
  top_hook_type: string;
  avg_views_est?: number;
  posting_freq_per_wk?: number;
}

const FORMAT_LABELS: Record<string, string> = {
  "before-after": "Before/After",
  "tutorial": "Tutorial",
  "showcase": "Showcase",
  "day-in-life": "Day in Life",
  "testimonial": "Testimonial",
  "price-breakdown": "Price Reveal",
  "challenge": "Challenge",
};

const HOOK_BADGES: Record<string, string> = {
  question: "bg-blue-500/20 text-blue-300",
  shock: "bg-red-500/20 text-red-300",
  promise: "bg-violet-500/20 text-violet-300",
  story: "bg-pink-500/20 text-pink-300",
  statistic: "bg-orange-500/20 text-orange-300",
};

function ERBadge({ rate }: { rate: number }) {
  const color = rate >= 7 ? "text-green-400" : rate >= 4 ? "text-yellow-400" : "text-orange-400";
  const Icon = rate >= 4 ? TrendingUp : TrendingDown;
  return (
    <span className={`flex items-center gap-1 font-semibold ${color}`}>
      <Icon size={13} />
      {formatEngagementRate(rate)}
    </span>
  );
}

export function CompetitorTable({ competitors }: { competitors: Competitor[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {["Account", "Followers", "Avg ER ↓", "Posts", "Top Format", "Top Hook", "Views/Post"].map((h) => (
              <th key={h} className="text-left text-xs font-medium text-white/40 pb-3 pr-4 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {competitors
            .sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate)
            .map((c) => (
              <tr key={c.handle} className="hover:bg-white/3 transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Instagram size={13} className="text-white/40" />
                    </div>
                    <div>
                      <div className="font-medium text-white whitespace-nowrap">
                        {c.display_name || c.handle}
                      </div>
                      <div className="text-white/30 text-xs">@{c.handle}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-white/60 whitespace-nowrap">
                  {c.followers_est ? `~${formatNumber(c.followers_est)}` : "—"}
                </td>
                <td className="py-3 pr-4">
                  <ERBadge rate={c.avg_engagement_rate} />
                </td>
                <td className="py-3 pr-4 text-white/60">{c.posts_analyzed}</td>
                <td className="py-3 pr-4">
                  <span className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60 whitespace-nowrap">
                    {FORMAT_LABELS[c.top_format] ?? c.top_format}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-1 rounded-lg capitalize ${HOOK_BADGES[c.top_hook_type] ?? "bg-white/5 text-white/40"}`}>
                    {c.top_hook_type}
                  </span>
                </td>
                <td className="py-3 text-white/60 whitespace-nowrap">
                  {c.avg_views_est ? `~${formatNumber(c.avg_views_est)}` : "—"}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <p className="text-xs text-white/20 mt-3">
        * All metrics AI-estimated from public signals. Not official Instagram data.
      </p>
    </div>
  );
}
