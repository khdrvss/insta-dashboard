"use client";

import { useEffect, useState } from "react";
import { Lightbulb, AlertCircle, Music, Hash, Zap, Clock, Loader2 } from "lucide-react";
import { useLang } from "@/lib/i18n/context";

interface NicheSummary {
  winning_patterns: Array<{ pattern: string; frequency: number; why_it_works: string }>;
  best_hook_styles: Array<{ type: string; example: string; effectiveness_score: number }>;
  top_content_formats: Array<{ format: string; avg_engagement_lift: number; description: string }>;
  power_phrases: string[];
  best_posting_patterns: { times: string[]; days: string[]; frequency: string };
  trending_audio_categories: string[];
  mock?: boolean;
}

export default function InsightsPage() {
  const [summary, setSummary] = useState<NicheSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { T } = useLang();
  const ins = T.insights;

  useEffect(() => {
    fetch("/api/analyze/results")
      .then((r) => r.json())
      .then((data) => {
        if (data.niche_summary) setSummary({ ...data.niche_summary, mock: data.mock });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hasData = !!summary;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">{ins.pageTitle}</h1>
        <p className="text-white/50 mt-1">{ins.pageSubtitle}</p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
        <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200/70">
          <span className="font-medium text-amber-300">{ins.aiEstimated} </span>
          {ins.aiEstimatedText}
        </p>
      </div>

      {summary?.mock && (
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-green-500/20 bg-green-500/10 text-green-300">
          <Zap className="h-3.5 w-3.5" />
          {ins.mockBadge}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-7 w-7 text-violet-400 animate-spin" />
        </div>
      )}

      {!loading && !hasData && (
        <div className="rounded-2xl border border-dashed border-white/15 p-16 text-center">
          <Lightbulb className="h-12 w-12 text-white/10 mx-auto mb-4" />
          <h3 className="font-semibold text-white mb-2">{ins.noDataTitle}</h3>
          <p className="text-white/40 text-sm max-w-sm mx-auto">{ins.noDataDesc}</p>
        </div>
      )}

      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hook patterns */}
          <InsightCard icon={Zap} title={ins.hookPatterns} color="violet">
            <div className="space-y-3">
              {summary!.best_hook_styles.map(({ type, score, example }: any) => (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white font-medium capitalize">{type} Hook</span>
                    <span className="text-violet-400">{score ?? example?.effectiveness_score ?? "—"}{ins.hookScore}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full">
                    <div className="h-full rounded-full gradient-brand" style={{ width: `${score ?? 70}%` }} />
                  </div>
                  <p className="text-xs text-white/30 italic">
                    &ldquo;{example?.example ?? example}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </InsightCard>

          {/* Top content formats */}
          <InsightCard icon={Clock} title={ins.contentFormats} color="pink">
            <div className="space-y-3">
              {summary!.top_content_formats?.map(({ format, avg_engagement_lift, description }: any) => (
                <div key={format} className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-xs font-bold text-pink-300 flex-shrink-0">
                    +{avg_engagement_lift}%
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white capitalize">{format.replace(/-/g, " ")}</div>
                    <div className="text-xs text-white/30">{description}</div>
                  </div>
                </div>
              ))}
            </div>
          </InsightCard>

          {/* Power phrases */}
          <InsightCard icon={Hash} title={ins.powerWords} color="orange">
            <div className="flex flex-wrap gap-2">
              {summary!.power_phrases.map((phrase) => (
                <span key={phrase} className="px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-300 text-sm">
                  {phrase}
                </span>
              ))}
            </div>
          </InsightCard>

          {/* Trending audio */}
          <InsightCard icon={Music} title={ins.trendingAudio} color="green">
            <div className="space-y-2">
              {summary!.trending_audio_categories.map((name, i) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <Music className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-sm text-white">{name}</span>
                  </div>
                  <span className="text-xs text-white/30">#{i + 1}</span>
                </div>
              ))}
            </div>
          </InsightCard>
        </div>
      )}
    </div>
  );
}

function InsightCard({
  icon: Icon, title, color, children,
}: {
  icon: React.ElementType;
  title: string;
  color: "violet" | "pink" | "orange" | "green";
  children: React.ReactNode;
}) {
  const colors = {
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    pink: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className={`h-8 w-8 rounded-lg ${colors[color]} flex items-center justify-center`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}
