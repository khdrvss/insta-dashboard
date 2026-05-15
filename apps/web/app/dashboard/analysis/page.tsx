"use client";

import { useEffect, useState } from "react";
import { BarChart3, AlertCircle, PlayCircle, RefreshCw, Loader2 } from "lucide-react";
import { AnalysisJobStatus } from "@/components/dashboard/analysis/AnalysisJobStatus";
import { CompetitorTable } from "@/components/dashboard/analysis/CompetitorTable";
import { NicheSummaryCard } from "@/components/dashboard/analysis/NicheSummaryCard";
import { TopPostsGallery } from "@/components/dashboard/analysis/TopPostsGallery";
import { EngagementTrendChart } from "@/components/charts/EngagementTrendChart";
import { ContentFormatPie } from "@/components/charts/ContentFormatPie";
import { useLang } from "@/lib/i18n/context";

interface AnalysisResults {
  competitors: any[];
  top_posts: any[];
  engagement_trend: any[];
  content_format_breakdown?: any[];
  niche_summary: any;
  mock?: boolean;
}

export default function AnalysisPage() {
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { T } = useLang();
  const a = T.analysis;

  useEffect(() => { loadResults(); }, []);

  async function loadResults() {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze/results");
      if (res.ok) {
        const data = await res.json();
        if (data.competitors?.length > 0) setResults(data);
      }
    } catch { /* silent */ }
    setLoading(false);
  }

  async function startAnalysis() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to start"); setStarting(false); return; }
      if (data.status === "done") { await loadResults(); setStarting(false); }
      else setJobId(data.job_id);
    } catch {
      setError("Network error — please try again");
      setStarting(false);
    }
  }

  async function handleJobComplete() {
    setJobId(null);
    setStarting(false);
    await loadResults();
  }

  // ── Job running ─────────────────────────────────────────────────────────────
  if (jobId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">{a.pageTitle}</h1>
          <p className="text-white/50 mt-1">{a.runningSubtitle}</p>
        </div>
        <AnalysisJobStatus jobId={jobId} onComplete={handleJobComplete} />
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!results) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">{a.pageTitle}</h1>
          <p className="text-white/50 mt-1">{a.pageSubtitle}</p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200/70">
            <span className="font-medium text-amber-300">{a.aiEstimated} </span>
            {a.aiEstimatedText}
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-white/15 p-16 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-4">
            <BarChart3 className="h-7 w-7 text-violet-400" />
          </div>
          <h3 className="font-semibold text-white text-lg mb-2">{a.noDataTitle}</h3>
          <p className="text-white/40 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            {a.noDataDesc}
          </p>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            onClick={startAnalysis}
            disabled={starting}
            className="inline-flex items-center gap-2 gradient-brand text-white px-8 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />}
            {starting ? a.runningBtn : a.runAnalysis}
          </button>
          <p className="text-white/20 text-xs mt-3">{a.timeEst}</p>
        </div>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  const formatData = results.content_format_breakdown ?? [
    { name: "Reels / Video", value: 52, color: "#7C3AED" },
    { name: "Photos", value: 28, color: "#EC4899" },
    { name: "Carousels", value: 20, color: "#F97316" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{a.pageTitle}</h1>
          <p className="text-white/50 mt-1">
            {results.competitors.length} competitors analyzed ·{" "}
            {results.top_posts.length} top posts surfaced
          </p>
        </div>
        <div className="flex items-center gap-3">
          {results.mock && (
            <span className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-300">
              {a.mockBadge}
            </span>
          )}
          <button
            onClick={startAnalysis}
            disabled={starting}
            className="flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${starting ? "animate-spin" : ""}`} />
            {a.reAnalyze}
          </button>
        </div>
      </div>

      {/* Compliance note */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3.5">
        <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-200/70">
          All competitor metrics are <span className="font-medium text-blue-300">AI-estimated</span> based on publicly available signals. Not affiliated with Meta or Instagram.
        </p>
      </div>

      {/* Competitor comparison table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold text-white mb-4">{a.competitorComp}</h2>
        <CompetitorTable competitors={results.competitors} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold text-white mb-4">{a.engagementTrend}</h2>
          <EngagementTrendChart data={results.engagement_trend} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold text-white mb-4">{a.contentFormat}</h2>
          <ContentFormatPie data={formatData} />
        </div>
      </div>

      {/* Niche summary + Top posts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold text-white mb-4">{a.nicheIntel}</h2>
          {results.niche_summary ? (
            <NicheSummaryCard summary={results.niche_summary} />
          ) : (
            <div className="py-8 text-center text-white/30 text-sm">
              {a.nichePending}
            </div>
          )}
        </div>
        <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold text-white mb-4">
            {a.topPosts}
            <span className="text-white/30 font-normal text-sm ml-2">{a.topPostsSub}</span>
          </h2>
          <TopPostsGallery posts={results.top_posts} />
        </div>
      </div>
    </div>
  );
}
