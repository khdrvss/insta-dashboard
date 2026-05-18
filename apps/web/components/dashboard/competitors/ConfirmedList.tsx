"use client";

import { useState } from "react";
import { Instagram, Trash2, Clock, CheckCircle, Loader2, Plus, RefreshCw, Zap } from "lucide-react";
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
  onAdded: (c: ConfirmedCompetitor) => void;
  onAnalyzed?: () => void;
}

function statusInfo(competitor: ConfirmedCompetitor) {
  if (competitor._count?.posts && competitor._count.posts > 0) {
    return { label: "Analyzed", icon: CheckCircle, color: "text-green-400 bg-green-500/10 border-green-500/20" };
  }
  return { label: "Pending", icon: Clock, color: "text-white/30 bg-white/5 border-white/10" };
}

export function ConfirmedList({ competitors, onRemove, onAdded, onAnalyzed }: Props) {
  const [removing, setRemoving]       = useState<string | null>(null);
  const [analyzing, setAnalyzing]     = useState<string | null>(null); // handle being analyzed
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [manualHandle, setManualHandle] = useState("");
  const [adding, setAdding]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

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

  async function handleAddManual() {
    const handle = manualHandle.replace("@", "").trim().toLowerCase();
    if (!handle) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/competitors/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitors: [{
            handle,
            relevanceScore: 75,
            relevanceReason: "Manually added",
            discoverySource: "manual",
          }],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to add"); return; }
      const added = data.competitors?.[0];
      if (added) onAdded(added);
      setManualHandle("");
    } catch {
      setError("Network error");
    } finally {
      setAdding(false);
    }
  }

  async function handleAnalyze(handle: string) {
    setAnalyzing(handle);
    setError(null);
    try {
      const res = await fetch(`/api/analyze/scrape?handle=${encodeURIComponent(handle)}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Analysis failed"); return; }
      onAnalyzed?.();
    } catch {
      setError("Analysis failed — please try again");
    } finally {
      setAnalyzing(null);
    }
  }

  async function handleAnalyzeAll() {
    setAnalyzingAll(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze/scrape", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Analysis failed"); return; }
      onAnalyzed?.();
    } catch {
      setError("Analysis failed — please try again");
    } finally {
      setAnalyzingAll(false);
    }
  }

  const unanalyzed = competitors.filter((c) => !c._count?.posts);

  return (
    <div className="space-y-4">
      {/* Manual add row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium">@</span>
          <input
            type="text"
            value={manualHandle}
            onChange={(e) => setManualHandle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
            placeholder="Add competitor handle manually…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <button
          onClick={handleAddManual}
          disabled={!manualHandle.trim() || adding}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add
        </button>
        {unanalyzed.length > 0 && (
          <button
            onClick={handleAnalyzeAll}
            disabled={analyzingAll}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 disabled:opacity-40 text-violet-300 text-sm font-medium transition-colors"
          >
            {analyzingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {analyzingAll ? "Analyzing…" : `Analyze all (${unanalyzed.length})`}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {competitors.map((c) => {
        const status = statusInfo(c);
        const StatusIcon = status.icon;
        const isAnalyzing = analyzing === c.handle;
        return (
          <div
            key={c.id}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
              <Instagram className="h-4 w-4 text-white/40" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-white text-sm truncate">{c.displayName || c.handle}</span>
                <span className="text-white/30 text-xs">@{c.handle}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {c.followersEst && (
                  <span className="text-xs text-white/30">~{formatNumber(c.followersEst)} followers</span>
                )}
                <span className="text-xs text-white/30">Relevance: {c.relevanceScore}/100</span>
                {c._count?.posts ? (
                  <span className="text-xs text-white/30">{c._count.posts} posts analyzed</span>
                ) : null}
              </div>
            </div>

            {/* Status badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium flex-shrink-0 ${status.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </div>

            {/* Analyze button */}
            <button
              onClick={() => handleAnalyze(c.handle)}
              disabled={isAnalyzing || analyzingAll}
              title="Scrape & analyze this competitor"
              className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-white/30 hover:text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/10 transition-colors flex-shrink-0 disabled:opacity-40"
            >
              {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            </button>

            {/* Remove button */}
            <button
              onClick={() => handleRemove(c.id)}
              disabled={removing === c.id}
              className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-white/30 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-colors flex-shrink-0 disabled:opacity-40"
            >
              {removing === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
