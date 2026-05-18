"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import { CandidateCard, Candidate } from "./CandidateCard";

const DISCOVERY_STEPS = [
  "Scanning hashtags in your niche...",
  "Querying Meta Ad Library...",
  "Filtering candidates with AI...",
  "Ranking by relevance score...",
];

export interface ConfirmedResult {
  handle: string;
  displayName?: string;
  relevanceScore: number;
  followersEst?: number;
  discoverySource: string;
  id?: string;
  confirmed?: boolean;
  _count?: { posts: number };
}

interface Props {
  onConfirmed: (results: ConfirmedResult[]) => void;
}

export function DiscoveryPanel({ onConfirmed }: Props) {
  const [phase, setPhase] = useState<
    "idle" | "setup" | "discovering" | "review" | "confirming" | "done"
  >("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [totalScanned, setTotalScanned] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [manualHandle, setManualHandle] = useState("");
  const [manualAdding, setManualAdding] = useState(false);
  const [setupNiche, setSetupNiche] = useState("Premium real estate, real estate, Toshkent, Tashkent");
  const [setupLocation, setSetupLocation] = useState("Toshkent, O'zbekiston");
  const [setupSaving, setSetupSaving] = useState(false);

  // On mount: load cached results from DB without triggering Apify
  useEffect(() => {
    fetch("/api/competitors")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const all = data.competitors ?? [];
        if (all.length === 0) return;
        // Map DB rows to the candidate shape the review panel expects
        const mapped = all.map((c: any) => ({
          handle: c.handle,
          relevance_score: c.relevanceScore ?? 0,
          reasoning: c.relevanceReason ?? "",
          source: c.discoverySource ?? "hashtag_search",
          followers_est: c.followersEst,
          confirmed: c.confirmed,
        }));
        setCandidates(mapped);
        setSelected(new Set(mapped.filter((c: any) => c.confirmed).map((c: any) => c.handle)));
        setTotalScanned(mapped.length);
        setPhase("review");
      })
      .catch(() => {/* no cached data, stay idle */});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveSetup() {
    if (!setupNiche.trim() || !setupLocation.trim()) return;
    setSetupSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: setupNiche, location: setupLocation }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save profile");
        setSetupSaving(false);
        return;
      }
      // Profile saved — clear spinner before discovery changes phase
      setSetupSaving(false);
      await runDiscovery();
    } catch {
      setError("Failed to save profile — please try again");
      setSetupSaving(false);
    }
  }

  async function runDiscovery(force = false) {
    setPhase("discovering");
    setError(null);
    setStepIndex(0);

    // Step animation — each step shows for ~600ms
    const stepInterval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, DISCOVERY_STEPS.length - 1));
    }, 600);

    try {
      const url = force ? "/api/competitors/discover?force=true" : "/api/competitors/discover";
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      clearInterval(stepInterval);

      if (!res.ok) {
        if (data.error?.includes("niche") || data.error?.includes("location") || data.error?.includes("profile")) {
          setPhase("setup");
        } else {
          setError(data.error ?? "Discovery failed");
          setPhase("idle");
        }
        return;
      }

      setCandidates(data.candidates);
      setTotalScanned(data.total_scanned);
      // Pre-select all with score >= 70
      setSelected(
        new Set(
          data.candidates
            .filter((c: Candidate) => c.relevance_score >= 70)
            .map((c: Candidate) => c.handle),
        ),
      );
      setPhase("review");
    } catch (e) {
      clearInterval(stepInterval);
      setError("Network error — please try again");
      setPhase("idle");
    }
  }

  function toggle(handle: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(handle) ? next.delete(handle) : next.add(handle);
      return next;
    });
  }

  async function addManual() {
    const handle = manualHandle.replace("@", "").trim().toLowerCase();
    if (!handle) return;
    if (candidates.find((c) => c.handle === handle)) {
      setManualHandle("");
      return;
    }
    setManualAdding(true);
    const manual: Candidate = {
      handle,
      display_name: handle,
      relevance_score: 75,
      reasoning: "Manually added by you",
      source: "manual",
    };
    setCandidates((prev) => [manual, ...prev]);
    setSelected((prev) => new Set([...prev, handle]));
    setManualHandle("");
    setManualAdding(false);
  }

  async function confirmSelection() {
    if (!selected.size) return;
    setPhase("confirming");

    const toConfirm = candidates
      .filter((c) => selected.has(c.handle))
      .map((c) => ({
        handle: c.handle,
        ...(c.display_name != null ? { displayName: c.display_name } : {}),
        relevanceScore: c.relevance_score ?? 0,
        ...(c.reasoning ? { relevanceReason: c.reasoning } : {}),
        ...(c.followers_est != null ? { followersEst: c.followers_est } : {}),
        discoverySource: (c.source as "hashtag_search" | "ad_library" | "manual") ?? "hashtag_search",
      }));

    try {
      const res = await fetch("/api/competitors/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitors: toConfirm }),
      });

      let confirmedData: ConfirmedResult[] = [];
      if (res.ok) {
        const json = await res.json();
        confirmedData = (json.competitors ?? json.confirmed ?? []).map(
          (c: any) => ({
            handle: c.handle,
            displayName: c.displayName ?? c.display_name,
            relevanceScore: c.relevanceScore ?? c.relevance_score,
            followersEst: c.followersEst ?? c.followers_est,
            discoverySource: c.discoverySource ?? c.source,
            id: c.id ?? c.handle,
            confirmed: true,
            _count: { posts: 0 },
          }),
        );
        setPhase("done");
        setTimeout(() => {
          onConfirmed(confirmedData);
          setPhase("idle");
          setCandidates([]);
          setSelected(new Set());
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error ?? "Confirm failed");
        setPhase("review");
      }
    } catch {
      setError("Network error — please try again");
      setPhase("review");
    }
  }

  // ── Setup (niche + location missing) ────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 max-w-md mx-auto">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Search className="h-6 w-6 text-violet-400" />
          </div>
          <h3 className="text-white font-semibold text-lg">Quick setup</h3>
          <p className="text-white/40 text-sm mt-1">
            Tell us your niche and location so we can find relevant competitors
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Your niche / industry</label>
            <input
              type="text"
              placeholder="e.g. Premium real estate, Toshkent"
              value={setupNiche}
              onChange={(e) => setSetupNiche(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Location / market</label>
            <input
              type="text"
              placeholder="e.g. Toshkent, O'zbekiston"
              value={setupLocation}
              onChange={(e) => setSetupLocation(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <button
            onClick={saveSetup}
            disabled={!setupNiche.trim() || !setupLocation.trim() || setupSaving}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {setupSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {setupSaving ? "Saving & searching…" : "Save & start discovery"}
          </button>
        </div>
      </div>
    );
  }

  // ── Idle state ──────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/3 p-10 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-violet-500/20 flex items-center justify-center">
          <Search className="h-7 w-7 text-violet-400" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">
          Discover your competitors
        </h3>
        <p className="text-white/40 text-sm max-w-md mx-auto mb-6 leading-relaxed">
          AI scans Instagram hashtags and Meta Ad Library to find the top
          business accounts in your niche, then scores each one for relevance.
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 justify-center text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <button
          onClick={() => runDiscovery(false)}
          className="inline-flex items-center gap-2 gradient-brand text-white px-8 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          <Search className="h-4 w-4" />
          Start discovery
        </button>
        <p className="text-white/20 text-xs mt-3">
          ~30–60 seconds · uses AI analysis
        </p>
        <button
          onClick={() => runDiscovery(true)}
          className="mt-2 text-xs text-white/20 hover:text-white/40 transition-colors underline underline-offset-2"
        >
          Force re-discover (uses Apify credits)
        </button>
      </div>
    );
  }

  // ── Discovering ─────────────────────────────────────────────────────────────
  if (phase === "discovering") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
        <div className="mx-auto mb-6 h-14 w-14 rounded-2xl bg-violet-500/20 flex items-center justify-center">
          <Loader2 className="h-7 w-7 text-violet-400 animate-spin" />
        </div>
        <div className="space-y-2 max-w-xs mx-auto">
          {DISCOVERY_STEPS.map((step, i) => (
            <div
              key={step}
              className={`flex items-center gap-2 text-sm transition-all duration-300 ${
                i < stepIndex
                  ? "text-white/20 line-through"
                  : i === stepIndex
                    ? "text-white font-medium"
                    : "text-white/20"
              }`}
            >
              {i < stepIndex ? (
                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
              ) : i === stepIndex ? (
                <Loader2 className="h-4 w-4 text-violet-400 animate-spin flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-white/10 flex-shrink-0" />
              )}
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Done / confirming ────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-10 text-center">
        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-white font-semibold text-lg">
          {selected.size} competitors confirmed!
        </h3>
        <p className="text-white/40 text-sm mt-2">
          Ready to analyze their content. Head to the Analysis tab to start.
        </p>
      </div>
    );
  }

  // ── Review candidates ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-white">
            {candidates.length} candidates found
          </h3>
          <p className="text-white/40 text-sm mt-0.5">
            Scanned {totalScanned} accounts · select who to track
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setSelected(new Set(candidates.map((c) => c.handle)))
            }
            className="text-xs text-white/50 hover:text-white transition-colors px-3 py-1.5 border border-white/10 rounded-lg"
          >
            Select all
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-white/50 hover:text-white transition-colors px-3 py-1.5 border border-white/10 rounded-lg"
          >
            Deselect all
          </button>
        </div>
      </div>

      {/* Manual add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
            @
          </span>
          <input
            type="text"
            value={manualHandle}
            onChange={(e) => setManualHandle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addManual()}
            placeholder="Add a handle manually..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40"
          />
        </div>
        <button
          onClick={addManual}
          disabled={!manualHandle.trim() || manualAdding}
          className="flex items-center gap-1.5 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Candidate grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.handle}
            candidate={candidate}
            selected={selected.has(candidate.handle)}
            onToggle={() => toggle(candidate.handle)}
          />
        ))}
      </div>

      {/* Confirm bar (sticky at bottom) */}
      <div className="sticky bottom-0 bg-[#0d1117]/90 backdrop-blur-sm border-t border-white/10 -mx-6 px-6 py-4 flex items-center justify-between gap-4">
        <div className="text-sm text-white/50">
          <span className="text-white font-medium">{selected.size}</span> of{" "}
          {candidates.length} selected
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPhase("idle");
              setCandidates([]);
              setSelected(new Set());
            }}
            className="border border-white/20 text-white/50 hover:text-white px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmSelection}
            disabled={selected.size === 0 || phase === "confirming"}
            className="flex items-center gap-2 gradient-brand text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {phase === "confirming" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Confirm {selected.size} competitor
                {selected.size !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
