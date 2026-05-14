"use client";

import { useState } from "react";
import { AlertCircle, Users, Plus, RefreshCw } from "lucide-react";
import { DiscoveryPanel } from "@/components/dashboard/competitors/DiscoveryPanel";
import { ConfirmedList, ConfirmedCompetitor } from "@/components/dashboard/competitors/ConfirmedList";

interface Props {
  initialConfirmed: ConfirmedCompetitor[];
}

export function CompetitorsClient({ initialConfirmed }: Props) {
  const [confirmed, setConfirmed] = useState<ConfirmedCompetitor[]>(initialConfirmed);
  const [showDiscovery, setShowDiscovery] = useState(confirmed.length === 0);

  function handleRemove(id: string) {
    setConfirmed((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleConfirmed() {
    // Refresh confirmed list from server
    const res = await fetch("/api/competitors");
    if (res.ok) {
      const data = await res.json();
      setConfirmed(data.competitors.filter((c: ConfirmedCompetitor & { confirmed: boolean }) => c.confirmed));
    }
    setShowDiscovery(false);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Competitors</h1>
          <p className="text-white/50 mt-1">
            Discover and track competitor Instagram accounts in your niche
          </p>
        </div>
        <div className="flex items-center gap-3">
          {confirmed.length > 0 && !showDiscovery && (
            <button
              onClick={() => setShowDiscovery(true)}
              className="flex items-center gap-2 gradient-brand text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="h-4 w-4" />
              Discover more
            </button>
          )}
        </div>
      </div>

      {/* Compliance note */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
        <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200/70">
          <span className="font-medium text-amber-300">Data transparency: </span>
          All competitor metrics are AI-estimated based on publicly available signals.
          Competitor data is sourced only from public profiles via approved APIs (Apify +
          Meta Ad Library). Not affiliated with Meta or Instagram.
        </p>
      </div>

      {/* Stats row (only when we have confirmed competitors) */}
      {confirmed.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-bold text-white">{confirmed.length}</div>
            <div className="text-sm text-white/50 mt-0.5">Competitors tracked</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-bold text-white">
              {confirmed.filter((c) => c._count?.posts && c._count.posts > 0).length}
            </div>
            <div className="text-sm text-white/50 mt-0.5">Fully analyzed</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-bold text-white">
              {confirmed.reduce((s, c) => s + (c._count?.posts ?? 0), 0)}
            </div>
            <div className="text-sm text-white/50 mt-0.5">Posts analyzed total</div>
          </div>
        </div>
      )}

      {/* Discovery panel */}
      {showDiscovery && (
        <div className="space-y-4">
          {confirmed.length > 0 && (
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Discover more competitors</h2>
              <button
                onClick={() => setShowDiscovery(false)}
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          <DiscoveryPanel onConfirmed={handleConfirmed} />
        </div>
      )}

      {/* Confirmed list */}
      {confirmed.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-400" />
              Confirmed Competitors ({confirmed.length})
            </h2>
          </div>
          <ConfirmedList competitors={confirmed} onRemove={handleRemove} />
        </div>
      )}

      {/* How it works (always visible) */}
      {!showDiscovery && confirmed.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold text-white mb-4">How competitor discovery works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: "1",
                title: "Hashtag Search",
                desc: "Scans top Instagram posts using your niche + location hashtags to extract active business accounts",
              },
              {
                step: "2",
                title: "Meta Ad Library",
                desc: "Queries the official Meta Ad Library API for businesses running ads with your niche keywords",
              },
              {
                step: "3",
                title: "AI Scoring",
                desc: "Claude filters 30+ candidates, scores relevance 0–100, returns top 15 for your review",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="h-7 w-7 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                  {step}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{title}</div>
                  <div className="text-xs text-white/40 mt-1 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
