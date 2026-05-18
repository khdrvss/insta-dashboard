"use client";

import { useState } from "react";
import {
  Wand2, Copy, Download, RefreshCw, Loader2,
  Target, Mic, Monitor, Clock, CheckCircle,
  History, ChevronDown, ChevronUp, BookOpen,
} from "lucide-react";
import { downloadScriptAsDocx } from "@/lib/export-script-docx";
import { useLang } from "@/lib/i18n/context";
import { useScripts, type GeneratedScript } from "@/lib/scripts-context";

type Goal = "brand_awareness" | "direct_sales" | "lead_generation";
type Platform = "reels" | "ads";
type Length = 15 | 30 | 60;
type Tone = "formal" | "friendly" | "bold" | "educational";

const LENGTHS: { value: Length; label: string }[] = [
  { value: 15, label: "15 sec" },
  { value: 30, label: "30 sec" },
  { value: 60, label: "60 sec" },
];

const STRENGTH_COLORS = {
  hook:      "text-violet-400 bg-violet-500/20",
  retention: "text-pink-400 bg-pink-500/20",
  cta:       "text-orange-400 bg-orange-500/20",
  balanced:  "text-green-400 bg-green-500/20",
};

// ── History types ──────────────────────────────────────────────────────────────
interface HistoryEntry {
  id: string;
  goal: string;
  platform: string;
  lengthSecs: number;
  tone: string;
  scripts: GeneratedScript[];
  createdAt: string;
}

// ── History tab ────────────────────────────────────────────────────────────────
function HistoryTab({ h }: { h: any }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  async function loadHistory() {
    if (loaded) return;
    setLoading(true);
    try {
      const res = await fetch("/api/scripts/history");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.history ?? []);
      }
    } catch { /* silent */ }
    setLoading(false);
    setLoaded(true);
  }

  // Load on first render of this tab
  useState(() => { loadHistory(); });

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function formatDate(isoStr: string): string {
    return new Date(isoStr).toLocaleString("uz-UZ", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  const GOAL_LABELS: Record<string, string> = {
    brand_awareness: "Brend tanilishi",
    direct_sales: "Savdo",
    lead_generation: "Lead",
  };
  const PLATFORM_LABELS: Record<string, string> = { reels: "Reels", ads: "Ads" };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-16 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-4">
          <BookOpen className="h-7 w-7 text-violet-400" />
        </div>
        <h3 className="font-semibold text-white mb-2">{h.noHistory}</h3>
        <p className="text-white/40 text-sm max-w-md mx-auto">{h.noHistoryDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const isOpen = expandedIds.has(entry.id);
        const firstScript = entry.scripts[0];
        return (
          <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-white/10">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs text-white/30 mb-2">{formatDate(entry.createdAt)}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/20">
                      {GOAL_LABELS[entry.goal] ?? entry.goal}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white/60 border border-white/10">
                      {PLATFORM_LABELS[entry.platform] ?? entry.platform}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white/60 border border-white/10">
                      {entry.lengthSecs}s
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white/50 border border-white/10">
                      {entry.tone}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {firstScript && (
                    <button
                      onClick={() => downloadScriptAsDocx(firstScript, { platform: entry.platform, lengthSecs: entry.lengthSecs, tone: entry.tone })}
                      className="flex items-center gap-1.5 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-3 py-1.5 rounded-xl text-xs transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      .docx
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpand(entry.id)}
                    className="flex items-center gap-1.5 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-3 py-1.5 rounded-xl text-xs transition-colors"
                  >
                    {isOpen ? (
                      <><ChevronUp className="h-3.5 w-3.5" />{h.collapse}</>
                    ) : (
                      <><ChevronDown className="h-3.5 w-3.5" />{h.expand}</>
                    )}
                  </button>
                </div>
              </div>
              {/* Preview */}
              {firstScript && (
                <p className="mt-3 text-sm text-white/70 leading-snug">
                  {firstScript.concept_title}
                  <span className="text-white/30 ml-2">— {entry.scripts.length} {h.variations}</span>
                </p>
              )}
            </div>

            {/* Expanded scripts */}
            {isOpen && (
              <div className="p-5 space-y-5">
                {entry.scripts.map((script, idx) => (
                  <HistoryScriptCard
                    key={idx}
                    script={script}
                    idx={idx}
                    platform={entry.platform}
                    lengthSecs={entry.lengthSecs}
                    tone={entry.tone}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HistoryScriptCard({
  script, idx, platform, lengthSecs, tone,
}: {
  script: GeneratedScript;
  idx: number;
  platform: string;
  lengthSecs: number;
  tone: string;
}) {
  const [copiedIdx, setCopiedIdx] = useState<boolean>(false);

  function copyScript() {
    const text = [
      `# ${script.concept_title}`,
      `Platform: ${platform} | Length: ${lengthSecs}s`,
      "",
      "## SCRIPT",
      ...script.scenes.map(
        (sc) => `[${sc.timecode}]\nVisual: ${sc.visual}${sc.on_screen_text ? `\nOn-Screen: ${sc.on_screen_text}` : ""}`
      ),
      "",
      `## CAPTION\n${script.caption}`,
      "",
      `## HASHTAGS\n#${script.hashtags.join(" #")}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopiedIdx(true);
    setTimeout(() => setCopiedIdx(false), 2000);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 p-4 pb-3 border-b border-white/10">
        <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm leading-snug truncate">{script.concept_title}</h3>
          <p className="text-xs text-white/30 mt-0.5 truncate">{script.borrowed_pattern}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${(STRENGTH_COLORS as any)[script.predicted_strength] ?? "text-white/40 bg-white/10"}`}>
          {script.predicted_strength}
        </span>
      </div>

      {/* Scenes */}
      <div className="p-4 space-y-2">
        {script.scenes.map((scene, si) => (
          <div key={si} className="flex gap-3 rounded-lg bg-white/5 p-3">
            <span className="text-xs font-mono font-bold text-violet-400 w-16 flex-shrink-0 pt-0.5">{scene.timecode}</span>
            <div className="min-w-0">
              <p className="text-sm text-white/70 leading-relaxed">{scene.visual}</p>
              {scene.on_screen_text && (
                <p className="text-sm font-semibold text-white mt-1 border-l-2 border-violet-500 pl-2">{scene.on_screen_text}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Caption + hashtags */}
      <div className="px-4 pb-3 space-y-2 border-t border-white/10 pt-3">
        <p className="text-xs text-white/50 leading-relaxed">{script.caption}</p>
        <div className="flex flex-wrap gap-1.5">
          {script.hashtags.map((tag: string) => (
            <span key={tag} className="text-xs text-violet-400/70 bg-violet-500/10 px-2 py-0.5 rounded-lg">#{tag}</span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4 pt-2">
        <button
          onClick={copyScript}
          className="flex-1 flex items-center justify-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 py-2 rounded-xl text-sm transition-colors"
        >
          {copiedIdx ? (
            <><CheckCircle className="h-4 w-4 text-green-400" />Nusxalandi!</>
          ) : (
            <><Copy className="h-4 w-4" />Nusxalash</>
          )}
        </button>
        <button
          onClick={() => downloadScriptAsDocx(script, { platform, lengthSecs, tone })}
          className="flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Download className="h-4 w-4" />.docx
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ScriptsPage() {
  const {
    scripts, loading, error,
    goal, platform, lengthSecs: length, tone,
    setGoal, setPlatform, setLengthSecs: setLength, setTone,
    generate: generateScripts,
  } = useScripts();

  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "history">("generate");
  const { T } = useLang();
  const s = T.scripts;
  const h = T.history;

  const GOALS: { value: Goal; label: string; icon: string }[] = [
    { value: "brand_awareness", label: s.goals.brand_awareness, icon: "🎯" },
    { value: "direct_sales",    label: s.goals.direct_sales,    icon: "💰" },
    { value: "lead_generation", label: s.goals.lead_generation, icon: "📩" },
  ];

  const PLATFORMS: { value: Platform; label: string }[] = [
    { value: "reels", label: s.platforms.reels },
    { value: "ads",   label: s.platforms.ads },
  ];

  const TONES: { value: Tone; label: string }[] = [
    { value: "formal",      label: s.tones.formal },
    { value: "friendly",    label: s.tones.friendly },
    { value: "bold",        label: s.tones.bold },
    { value: "educational", label: s.tones.educational },
  ];

  function copyScript(script: GeneratedScript, idx: number) {
    const text = [
      `# ${script.concept_title}`,
      `Platform: ${platform} | Length: ${length}s | Hook: ${script.hook_type}`,
      `Why it works: ${script.borrowed_pattern}`,
      "",
      "## SCRIPT",
      ...script.scenes.map(
        (sc: { timecode: string; visual: string; on_screen_text: string | null }) =>
          `[${sc.timecode}]\nVisual: ${sc.visual}${sc.on_screen_text ? `\nOn-Screen: ${sc.on_screen_text}` : ""}`
      ),
      "",
      `## CAPTION\n${script.caption}`,
      "",
      `## HASHTAGS\n#${script.hashtags.join(" #")}`,
      "",
      `## THUMBNAIL\n${script.thumbnail_idea}`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{s.pageTitle}</h1>
        <p className="text-white/50 mt-1">{s.pageSubtitle}</p>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab("generate")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "generate" ? "gradient-brand text-white" : "text-white/50 hover:text-white"
          }`}
        >
          <Wand2 className="h-4 w-4" />
          {h.generate}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "history" ? "gradient-brand text-white" : "text-white/50 hover:text-white"
          }`}
        >
          <History className="h-4 w-4" />
          {h.tab}
        </button>
      </div>

      {/* History tab */}
      {activeTab === "history" && <HistoryTab h={h} />}

      {/* Generate tab */}
      {activeTab === "generate" && (
        <>
          {/* Controls */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
            {/* Goal */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-3">
                <Target className="h-4 w-4" />
                {s.campaignGoal}
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
                  {s.platform}
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
                  {s.length}
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
                  {s.tone}
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
                  {s.generating}
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  {s.generateBtn}
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5 flex items-center gap-4">
              <Loader2 className="h-6 w-6 text-violet-400 animate-spin flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Skriptlar yaratilmoqda…</p>
                <p className="text-white/40 text-sm mt-0.5">
                  Boshqa sahifalarga o'tishingiz mumkin — jarayon fonda davom etadi.
                  <span className="text-white/25 ml-1">(Generation continues in background)</span>
                </p>
              </div>
            </div>
          )}

          {/* Scripts output */}
          {scripts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">
                  {s.generatedH2} {scripts.length} {s.variations}
                </h2>
                <button
                  onClick={generateScripts}
                  className="flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  {s.regenerate}
                </button>
              </div>

              <div className="space-y-6">
                {scripts.map((script, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg leading-snug">
                            {script.concept_title}
                          </h3>
                          <p className="text-sm text-white/40 mt-0.5 leading-relaxed">
                            {script.borrowed_pattern}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm px-3 py-1 rounded-full font-semibold flex-shrink-0 ${STRENGTH_COLORS[script.predicted_strength]}`}>
                        {s.strongPrefix} {script.predicted_strength}
                      </span>
                    </div>

                    {/* Scenes */}
                    <div className="p-6 space-y-3">
                      <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Sahnalar / Scenes</p>
                      {script.scenes.map((scene, si) => (
                        <div key={si} className="flex gap-4 rounded-xl bg-white/5 border border-white/8 p-4">
                          <span className="text-sm font-mono font-bold text-violet-400 flex-shrink-0 w-20 pt-0.5">
                            {scene.timecode}
                          </span>
                          <div className="space-y-2 flex-1 min-w-0">
                            <p className="text-base text-white/80 leading-relaxed">
                              <span className="text-white/40 text-sm font-medium">{s.visual} </span>
                              {scene.visual}
                            </p>
                            {scene.on_screen_text && (
                              <p className="text-base font-semibold text-white leading-relaxed border-l-2 border-violet-500 pl-3">
                                <span className="text-violet-400 text-sm font-medium block mb-0.5">{s.text}</span>
                                {scene.on_screen_text}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Caption & hashtags */}
                    <div className="px-6 pb-4 space-y-3 border-t border-white/10 pt-4">
                      <div>
                        <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">{s.captionLabel}</p>
                        <p className="text-base text-white/70 leading-relaxed">{script.caption}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {script.hashtags.map((tag: string) => (
                          <span key={tag} className="text-sm text-violet-400/80 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-lg">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      {script.thumbnail_idea && (
                        <p className="text-sm text-white/40 italic border-l-2 border-white/10 pl-3">
                          📸 {script.thumbnail_idea}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 px-6 pb-6 pt-2">
                      <button
                        onClick={() => copyScript(script, idx)}
                        className="flex-1 flex items-center justify-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 py-3 rounded-xl text-base font-medium transition-colors"
                      >
                        {copiedIdx === idx ? (
                          <><CheckCircle className="h-4 w-4 text-green-400" />{s.copied}</>
                        ) : (
                          <><Copy className="h-4 w-4" />{s.copy}</>
                        )}
                      </button>
                      <button
                        onClick={() => downloadScriptAsDocx(script, { platform, lengthSecs: length, tone })}
                        title="Download as Word document (.docx)"
                        className="flex items-center justify-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 px-5 py-3 rounded-xl text-base font-medium transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        .docx
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && scripts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 p-16 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-4">
                <Wand2 className="h-7 w-7 text-violet-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{s.noScripts}</h3>
              <p className="text-white/40 text-sm max-w-md mx-auto">
                {s.noScriptsDesc}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
