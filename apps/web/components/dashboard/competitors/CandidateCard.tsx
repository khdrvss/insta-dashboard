"use client";

import { Instagram, Check, Plus } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export interface Candidate {
  handle: string;
  display_name?: string;
  relevance_score: number;
  reasoning: string;
  source: "hashtag_search" | "ad_library" | "manual";
  followers_est?: number;
}

interface Props {
  candidate: Candidate;
  selected: boolean;
  onToggle: () => void;
}

const SOURCE_LABELS = {
  hashtag_search: "Hashtag",
  ad_library: "Meta Ads",
  manual: "Manual",
};

const SOURCE_COLORS = {
  hashtag_search: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  ad_library: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  manual: "text-green-400 bg-green-500/10 border-green-500/20",
};

function scoreColor(score: number) {
  if (score >= 80) return "text-green-400";
  if (score >= 65) return "text-yellow-400";
  return "text-orange-400";
}

function scoreRingColor(score: number) {
  if (score >= 80) return "border-green-500/40 bg-green-500/10";
  if (score >= 65) return "border-yellow-500/40 bg-yellow-500/10";
  return "border-orange-500/40 bg-orange-500/10";
}

export function CandidateCard({ candidate, selected, onToggle }: Props) {
  return (
    <div
      className={`relative rounded-2xl border p-4 cursor-pointer transition-all ${
        selected
          ? "border-violet-500/60 bg-violet-500/10"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/7"
      }`}
      onClick={onToggle}
    >
      {/* Select indicator */}
      <div
        className={`absolute top-3 right-3 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
          selected
            ? "border-violet-500 bg-violet-500"
            : "border-white/20 bg-transparent"
        }`}
      >
        {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 pr-8">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-pink-500/30 border border-white/10 flex items-center justify-center flex-shrink-0">
          <Instagram className="h-5 w-5 text-white/50" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-white text-sm truncate">
            {candidate.display_name || candidate.handle}
          </div>
          <div className="text-white/40 text-xs">@{candidate.handle}</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {/* Relevance score */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${scoreRingColor(candidate.relevance_score)}`}>
          <span className={scoreColor(candidate.relevance_score)}>
            {candidate.relevance_score}
          </span>
          <span className="text-white/30">/ 100</span>
        </div>

        {/* Source badge */}
        <span className={`px-2 py-1 rounded-lg border text-xs font-medium ${SOURCE_COLORS[candidate.source]}`}>
          {SOURCE_LABELS[candidate.source]}
        </span>

        {/* Followers */}
        {candidate.followers_est && (
          <span className="text-xs text-white/30">
            ~{formatNumber(candidate.followers_est)} followers
          </span>
        )}
      </div>

      {/* AI reasoning */}
      <p className="mt-2.5 text-xs text-white/40 leading-relaxed line-clamp-2">
        {candidate.reasoning}
      </p>
    </div>
  );
}
