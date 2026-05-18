"use client";

import { Brain, TrendingUp, Zap, Hash, Clock } from "lucide-react";

interface Pattern {
  pattern: string;
  frequency: number;
  why_it_works: string;
}

interface HookStyle {
  type: string;
  example: string;
  score?: number;
  effectiveness_score?: number;
}

interface NicheSummary {
  winning_patterns: Pattern[];
  best_hook_styles: HookStyle[];
  top_content_formats?: any[];
  power_phrases: string[];
  best_posting_patterns: { times: string[]; days: string[]; frequency: string };
  summary?: string;
}

export function NicheSummaryCard({ summary }: { summary: NicheSummary }) {
  return (
    <div className="space-y-6">
      {/* Executive summary */}
      {summary.summary && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-semibold text-violet-300">
              AI xulosasi <span className="text-violet-400/50 font-normal">(AI Niche Summary)</span>
            </span>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">{summary.summary}</p>
        </div>
      )}

      {/* Winning patterns */}
      {summary.winning_patterns?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-pink-400" />
            G'olib namunalar <span className="text-white/30 font-normal">(Winning patterns)</span>
          </h4>
          <div className="space-y-3">
            {summary.winning_patterns.slice(0, 5).map((p, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">{p.pattern}</span>
                  <span className="text-xs text-white/40 flex-shrink-0 ml-2">{p.frequency}% top postlar</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full">
                  <div className="h-full rounded-full gradient-brand" style={{ width: `${Math.min(p.frequency, 100)}%` }} />
                </div>
                <p className="text-xs text-white/30 italic">{p.why_it_works}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best hook styles */}
      {summary.best_hook_styles?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-violet-400" />
            Eng yaxshi hook turlari <span className="text-white/30 font-normal">(Best hook styles)</span>
          </h4>
          <div className="space-y-2">
            {summary.best_hook_styles.slice(0, 4).map((h) => {
              const score = h.score ?? h.effectiveness_score ?? 0;
              return (
                <div key={h.type} className="rounded-xl bg-white/5 border border-white/5 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white capitalize">{h.type} Hook</span>
                    <span className="text-xs font-bold text-violet-400">{score}/100</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full mb-2">
                    <div className="h-full rounded-full gradient-brand" style={{ width: `${score}%` }} />
                  </div>
                  <p className="text-xs text-white/40 italic">"{h.example}"</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top content formats */}
      {(summary.top_content_formats ?? []).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-pink-400" />
            Eng samarali formatlar <span className="text-white/30 font-normal">(Top formats)</span>
          </h4>
          <div className="space-y-2">
            {(summary.top_content_formats ?? []).slice(0, 4).map((f: any) => (
              <div key={f.format} className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-xs font-bold text-pink-300 flex-shrink-0">
                  +{f.avg_engagement_lift}
                </div>
                <div>
                  <div className="text-sm font-medium text-white capitalize">{f.format.replace(/_/g, " ")}</div>
                  <div className="text-xs text-white/30 leading-relaxed">{f.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Power phrases */}
      {summary.power_phrases?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
            <Hash className="h-4 w-4 text-orange-400" />
            Kuchli so'zlar <span className="text-white/30 font-normal">(Power phrases)</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {summary.power_phrases.map((phrase) => (
              <span key={phrase} className="text-xs px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300">
                {phrase}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Posting patterns */}
      <div>
        <h4 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-green-400" />
          Eng yaxshi post vaqtlari <span className="text-white/30 font-normal">(Best posting times)</span>
        </h4>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {summary.best_posting_patterns.times.map((t) => (
            <div key={t} className="rounded-lg bg-green-500/10 border border-green-500/20 py-2 text-center">
              <span className="text-sm font-semibold text-green-300">{t}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/30">
          Eng yaxshi kunlar: {summary.best_posting_patterns.days.join(", ")}
          <span className="mx-1">·</span>
          {summary.best_posting_patterns.frequency}
        </p>
      </div>
    </div>
  );
}
