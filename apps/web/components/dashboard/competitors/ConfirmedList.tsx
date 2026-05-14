"use client";

import { useState } from "react";
import { Instagram, Trash2, BarChart3, Clock, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export interface ConfirmedCompetitor {
  id: string;
  handle: string;
  displayName?: string | null;
  followersEst?: number | null;
  relevanceScore: number;
  discoverySource: string;
  lastAnalyzedAt?: string | null;
  _count?: { posts: number };
}

interface Props {
  competitors: ConfirmedCompetitor[];
  onRemove: (id: string) => void;
}

function statusInfo(competitor: ConfirmedCompetitor) {
  if (competitor._count?.posts && competitor._count.posts > 0) {
    return { label: "Analyzed", icon: CheckCircle, color: "text-green-400 bg-green-500/10 border-green-500/20" };
  }
  return { label: "Pending analysis", icon: Clock, color: "text-white/30 bg-white/5 border-white/10" };
}

export function ConfirmedList({ competitors, onRemove }: Props) {
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleRemove(id: string) {
    setRemoving(id);
    try {
      await fetch(`/api/competitors/${id}`, { method: "DELETE" });
      onRemove(id);
    } catch {
      console.error("Remove failed");
    } finally {
      setRemoving(null);
    }
  }

  if (!competitors.length) return null;

  return (
    <div className="space-y-3">
      {competitors.map((c) => {
        const status = statusInfo(c);
        const StatusIcon = status.icon;
        return (
          <div
            key={c.id}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          >
            {/* Avatar placeholder */}
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
              <Instagram className="h-4 w-4 text-white/40" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-white text-sm truncate">
                  {c.displayName || c.handle}
                </span>
                <span className="text-white/30 text-xs">@{c.handle}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {c.followersEst && (
                  <span className="text-xs text-white/30">
                    ~{formatNumber(c.followersEst)} followers
                  </span>
                )}
                <span className="text-xs text-white/30">
                  Relevance: {c.relevanceScore}/100
                </span>
                {c._count?.posts ? (
                  <span className="text-xs text-white/30">
                    {c._count.posts} posts analyzed
                  </span>
                ) : null}
              </div>
            </div>

            {/* Status badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium flex-shrink-0 ${status.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </div>

            {/* Remove button */}
            <button
              onClick={() => handleRemove(c.id)}
              disabled={removing === c.id}
              className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-white/30 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-colors flex-shrink-0 disabled:opacity-40"
              aria-label="Remove competitor"
            >
              {removing === c.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
