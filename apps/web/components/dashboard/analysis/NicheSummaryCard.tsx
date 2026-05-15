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
  effectiveness_score: number;
}

interface NicheSummary {
  winning_patterns: Pattern[];
  best_hook_styles: HookStyle[];
  power_phrases: string[];
  best_posting_patterns: { times: string[]; days: string[]; frequency: string };
  summary: string;
}

export function NicheSummaryCard({ summary }: { summary: NicheSummary }) {
  return (
    <div className="space-y-5">
      {/* Executive summary */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">AI Niche Summary</span>
        </div>
        <p className="text-sm text-white/70 leading-relaxed">{summary.summary}</p>
      </div>

      {/* Winning patterns */}
      <div>
        <h4 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-pink-400" />
          Top 5 Winning Patterns
        </h4>
        <div className="space-y-2.5">
          {summary.winning_patterns.slice(0, 5).map((p, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium">{p.pattern}</span>
                <span className="text-xs text-white/40 flex-shrink-0 ml-2">{p.frequency}% of top posts</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full">
                <div
                  className="h-full rounded-full gradient-brand transition-all"
                  style={{ width: `${p.frequency}%` }}
                />
              </div>
              <p className="text-xs text-white/30">{p.why_it_works}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Best hook styles */}
      <div>
        <h4 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-violet-400" />
          Best Hook Styles
        </h4>
        <div className="space-y-2">
          {summary.best_hook_styles.slice(0, 3).map((h) => (
            <div key={h.type} className="rounded-xl bg-white/5 border border-white/5 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-white capitalize">{h.type} Hook</span>
                <span className="text-xs font-bold text-violet-400">{h.effectiveness_score}/100</span>
              </div>
              <p className="text-xs text-white/40 italic">&ldquo;{h.example}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>

      {/* Power phrases */}
      <div>
        <h4 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
          <Hash className="h-4 w-4 text-orange-400" />
          Power Phrases
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {summary.power_phrases.map((phrase) => (
            <span key={phrase} className="text-xs px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300">
              {phrase}
            </span>
          ))}
        </div>
      </div>

      {/* Posting patterns */}
      <div>
        <h4 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-green-400" />
          Best Posting Times
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {summary.best_posting_patterns.times.map((t) => (
            <div key={t} className="rounded-lg bg-green-500/10 border border-green-500/20 py-2 text-center">
              <span className="text-sm font-semibold text-green-300">{t}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/30 mt-2">
          Best days: {summary.best_posting_patterns.days.join(", ")} · {summary.best_posting_patterns.frequency}
        </p>
      </div>
    </div>
  );
}
