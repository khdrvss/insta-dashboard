"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, Zap } from "lucide-react";

interface Props {
  jobId: string;
  onComplete: () => void;
}

const STEPS = [
  "Fetching competitor posts...",
  "Transcribing video audio...",
  "Analyzing hooks and pacing...",
  "Extracting winning patterns...",
  "Building niche intelligence...",
];

export function AnalysisJobStatus({ jobId, onComplete }: Props) {
  const [status, setStatus] = useState<"pending" | "running" | "done" | "failed">("pending");
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId === "mock-job-001") {
      // Simulate progress for mock
      let p = 0;
      const interval = setInterval(() => {
        p += 20;
        setProgress(p);
        setStepIndex(Math.min(Math.floor(p / 20), STEPS.length - 1));
        if (p >= 100) {
          clearInterval(interval);
          setStatus("done");
          setTimeout(onComplete, 800);
        }
      }, 500);
      return () => clearInterval(interval);
    }

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/analyze/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data.status);
        setProgress(data.progress ?? 0);
        if (data.error) setError(data.error);
        if (data.status === "done") {
          clearInterval(poll);
          setTimeout(onComplete, 800);
        }
        if (data.status === "failed") clearInterval(poll);
      } catch {
        // silent fail on network error, will retry
      }
    }, 3000);

    return () => clearInterval(poll);
  }, [jobId, onComplete]);

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center">
        <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
        <h3 className="font-semibold text-white">Analysis complete!</h3>
        <p className="text-white/40 text-sm mt-1">Loading results...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <h3 className="font-semibold text-white">Analysis failed</h3>
        <p className="text-white/40 text-sm mt-1">{error ?? "Please try again"}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-violet-400 animate-spin" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Analyzing competitor content</h3>
          <p className="text-white/40 text-sm">This takes 1–3 minutes</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10 rounded-full mb-6">
        <div
          className="h-full rounded-full gradient-brand transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map((step, i) => (
          <div key={step} className={`flex items-center gap-2.5 text-sm transition-colors ${
            i < stepIndex ? "text-white/20" : i === stepIndex ? "text-white" : "text-white/20"
          }`}>
            {i < stepIndex ? (
              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
            ) : i === stepIndex ? (
              <Zap className="h-4 w-4 text-violet-400 flex-shrink-0 animate-pulse" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-white/10 flex-shrink-0" />
            )}
            {step}
          </div>
        ))}
      </div>

      <p className="text-xs text-white/20 mt-6 text-center">
        All metrics are AI-estimated based on publicly available signals
      </p>
    </div>
  );
}
