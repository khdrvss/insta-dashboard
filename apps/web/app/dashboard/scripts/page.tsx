"use client";

import { useState } from "react";
import {
  Wand2, Copy, Download, RefreshCw, Loader2,
  Target, Mic, Monitor, Clock, CheckCircle
} from "lucide-react";

type Goal = "brand_awareness" | "direct_sales" | "lead_generation";
type Platform = "reels" | "ads";
type Length = 15 | 30 | 60;
type Tone = "formal" | "friendly" | "bold" | "educational";

interface ScriptScene {
  timecode: string;
  visual: string;
  on_screen_text: string | null;
  audio: string;
}

interface Script {
  variation: number;
  concept_title: string;
  hook_type: string;
  borrowed_pattern: string;
  scenes: ScriptScene[];
  suggested_audio_style: string;
  caption: string;
  hashtags: string[];
  thumbnail_idea: string;
  predicted_strength: "hook" | "retention" | "cta" | "balanced";
}

const GOALS: { value: Goal; label: string; icon: string }[] = [
  { value: "brand_awareness", label: "Brand Awareness", icon: "🎯" },
  { value: "direct_sales", label: "Direct Sales", icon: "💰" },
  { value: "lead_generation", label: "Lead Generation", icon: "📩" },
];

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "reels", label: "Instagram Reels" },
  { value: "ads", label: "Meta Ads" },
];

const LENGTHS: { value: Length; label: string }[] = [
  { value: 15, label: "15 sec" },
  { value: 30, label: "30 sec" },
  { value: 60, label: "60 sec" },
];

const TONES: { value: Tone; label: string }[] = [
  { value: "formal", label: "Formal" },
  { value: "friendly", label: "Friendly" },
  { value: "bold", label: "Bold" },
  { value: "educational", label: "Educational" },
];

const STRENGTH_COLORS = {
  hook: "text-violet-400 bg-violet-500/20",
  retention: "text-pink-400 bg-pink-500/20",
  cta: "text-orange-400 bg-orange-500/20",
  balanced: "text-green-400 bg-green-500/20",
};

export default function ScriptsPage() {
  const [goal, setGoal] = useState<Goal>("brand_awareness");
  const [platform, setPlatform] = useState<Platform>("reels");
  const [length, setLength] = useState<Length>(30);
  const [tone, setTone] = useState<Tone>("friendly");
  const [loading, setLoading] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function generateScripts() {
    setLoading(true);
    setScripts([]);
    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, platform, lengthSecs: length, tone }),
      });
      const data = await res.json();
      if (data.scripts) setScripts(data.scripts);
    } catch (err) {
      console.error("Script generation failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function copyScript(script: Script, idx: number) {
    const text = [
      `# ${script.concept_title}`,
      `Platform: ${platform} | Length: ${length}s | Hook: ${script.hook_type}`,
      `Why it works: ${script.borrowed_pattern}`,
      "",
      "## SCRIPT",
      ...script.scenes.map(
        (s) =>
          `[${s.timecode}]\nVisual: ${s.visual}${s.on_screen_text ? `\nOn-Screen: ${s.on_screen_text}` : ""}\nAudio: "${s.audio}"`
      ),
      "",
      `## CAPTION\n${script.caption}`,
      "",
      `## HASHTAGS\n#${script.hashtags.join(" #")}`,
      "",
      `## THUMBNAIL\n${script.thumbnail_idea}`,
      "",
      `## AUDIO STYLE\n${script.suggested_audio_style}`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Script Generator</h1>
        <p className="text-white/50 mt-1">
          Generate 3 original, high-converting video scripts based on winning patterns
          in your niche
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
        {/* Goal */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-3">
            <Target className="h-4 w-4" />
            Campaign Goal
          </label>
          <div className="flex flex-wrap gap-2">
            {GOALS.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setGoal(value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  goal === value
                    ? "gradient-brand text-white"
                    : "border border-white/20 text-white/60 hover:border-white/40 hover:text-white"
                }`}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Platform */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-3">
              <Monitor className="h-4 w-4" />
              Platform
            </label>
            <div className="flex gap-2">
              {PLATFORMS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setPlatform(value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    platform === value
                      ? "bg-violet-600 text-white"
                      : "border border-white/20 text-white/50 hover:border-white/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-3">
              <Clock className="h-4 w-4" />
              Length
            </label>
            <div className="flex gap-2">
              {LENGTHS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setLength(value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    length === value
                      ? "bg-violet-600 text-white"
                      : "border border-white/20 text-white/50 hover:border-white/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-3">
              <Mic className="h-4 w-4" />
              Tone
            </label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTone(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tone === value
                      ? "bg-violet-600 text-white"
                      : "border border-white/20 text-white/50 hover:border-white/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generateScripts}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 gradient-brand text-white py-3.5 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Writing high-converting scripts...
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5" />
              Generate 3 Script Variations
            </>
          )}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="h-6 bg-white/10 rounded-lg animate-pulse w-3/4" />
              <div className="h-4 bg-white/5 rounded animate-pulse w-1/2" />
              <div className="space-y-2 pt-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scripts output */}
      {scripts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">
              Generated Scripts — {scripts.length} variations
            </h2>
            <button
              onClick={generateScripts}
              className="flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-4 py-2 rounded-xl text-sm transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {scripts.map((script, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 flex flex-col"
              >
                {/* Script header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white text-sm leading-snug">
                      {script.concept_title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        STRENGTH_COLORS[script.predicted_strength]
                      }`}
                    >
                      Strong {script.predicted_strength}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">
                    {script.borrowed_pattern}
                  </p>
                </div>

                {/* Scenes */}
                <div className="flex-1 space-y-2">
                  {script.scenes.map((scene, si) => (
                    <div
                      key={si}
                      className="rounded-lg bg-white/5 border border-white/5 p-3 space-y-1"
                    >
                      <span className="text-xs font-mono text-violet-400">
                        {scene.timecode}
                      </span>
                      <p className="text-xs text-white/50">
                        <span className="text-white/30">Visual: </span>
                        {scene.visual}
                      </p>
                      {scene.on_screen_text && (
                        <p className="text-xs text-white/50">
                          <span className="text-white/30">Text: </span>
                          {scene.on_screen_text}
                        </p>
                      )}
                      <p className="text-xs text-white font-medium">
                        &ldquo;{scene.audio}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>

                {/* Caption & hashtags */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <p className="text-xs text-white/50 leading-relaxed">
                    <span className="text-white/30 font-medium">Caption: </span>
                    {script.caption}
                  </p>
                  <p className="text-xs text-violet-400/70">
                    #{script.hashtags.join(" #")}
                  </p>
                  <p className="text-xs text-white/30">
                    🎵 {script.suggested_audio_style}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => copyScript(script, idx)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-white/20 text-white/60 hover:text-white hover:border-white/40 py-2 rounded-lg text-xs transition-colors"
                  >
                    {copiedIdx === idx ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(script, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `script-v${script.variation}.json`;
                      a.click();
                    }}
                    className="flex items-center justify-center gap-1.5 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-3 py-2 rounded-lg text-xs transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state (no scripts yet) */}
      {!loading && scripts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 p-16 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-4">
            <Wand2 className="h-7 w-7 text-violet-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">No scripts yet</h3>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            Select your goal, platform, and tone above, then hit Generate. Scripts are
            powered by RAG — they use winning patterns from your niche to create
            original content.
          </p>
        </div>
      )}
    </div>
  );
}
