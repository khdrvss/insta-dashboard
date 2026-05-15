"use client";

import { useState } from "react";
import { AlertCircle, Users, RefreshCw } from "lucide-react";
import { DiscoveryPanel } from "@/components/dashboard/competitors/DiscoveryPanel";
import { ConfirmedList, ConfirmedCompetitor } from "@/components/dashboard/competitors/ConfirmedList";
import { useLang } from "@/lib/i18n/context";

interface Props {
  initialConfirmed: ConfirmedCompetitor[];
}

export function CompetitorsClient({ initialConfirmed }: Props) {
  const [confirmed, setConfirmed] = useState<ConfirmedCompetitor[]>(initialConfirmed);
  const [showDiscovery, setShowDiscovery] = useState(confirmed.length === 0);
  const { T } = useLang();
  const c = T.competitors;

  function handleRemove(id: string) {
    setConfirmed((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleConfirmed() {
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
          <h1 className="text-2xl font-bold text-white">{c.pageTitle}</h1>
          <p className="text-white/50 mt-1">{c.pageSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {confirmed.length > 0 && !showDiscovery && (
            <button
              onClick={() => setShowDiscovery(true)}
              className="flex items-center gap-2 gradient-brand text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="h-4 w-4" />
              {c.discoverMore}
            </button>
          )}
        </div>
      </div>

      {/* Compliance note */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
        <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200/70">
          <span className="font-medium text-amber-300">{c.disclaimer} </span>
          {c.disclaimerText}
        </p>
      </div>

      {/* Stats row */}
      {confirmed.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-bold text-white">{confirmed.length}</div>
            <div className="text-sm text-white/50 mt-0.5">{c.statsTracked}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-bold text-white">
              {confirmed.filter((x) => x._count?.posts && x._count.posts > 0).length}
            </div>
            <div className="text-sm text-white/50 mt-0.5">{c.statsAnalyzed}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-bold text-white">
              {confirmed.reduce((s, x) => s + (x._count?.posts ?? 0), 0)}
            </div>
            <div className="text-sm text-white/50 mt-0.5">{c.statsPosts}</div>
          </div>
        </div>
      )}

      {/* Discovery panel */}
      {showDiscovery && (
        <div className="space-y-4">
          {confirmed.length > 0 && (
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">{c.discoverMoreH2}</h2>
              <button
                onClick={() => setShowDiscovery(false)}
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                {c.cancel}
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
              {c.confirmedH2} ({confirmed.length})
            </h2>
          </div>
          <ConfirmedList competitors={confirmed} onRemove={handleRemove} />
        </div>
      )}

      {/* How it works */}
      {!showDiscovery && confirmed.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold text-white mb-4">{c.howTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {c.howSteps.map(({ title, desc }, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-7 w-7 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                  {i + 1}
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
