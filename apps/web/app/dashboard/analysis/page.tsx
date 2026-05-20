"use client";

import { useEffect, useState } from "react";
import {
  BarChart3, AlertCircle, PlayCircle, RefreshCw, Loader2,
  Hash, Zap, TrendingUp, MessageCircle, Heart, Eye,
  Clock, Brain, Target, ChevronDown, ChevronUp, Flame, Instagram,
} from "lucide-react";
import { ContentFormatPie } from "@/components/charts/ContentFormatPie";
import { EngagementTrendChart } from "@/components/charts/EngagementTrendChart";
import { NicheSummaryCard } from "@/components/dashboard/analysis/NicheSummaryCard";
import { formatNumber } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface HeatMapCell {
  slot: string;
  count: number;
  avgEng: number;
}
interface HeatMapRow {
  day: string;
  slots: HeatMapCell[];
}
interface AnalysisData {
  competitors: any[];
  top_posts: any[];
  engagement_trend: any[];
  content_format_breakdown: any[];
  sentiment_breakdown: any[];
  pacing_breakdown: any[];
  hashtag_cloud: { tag: string; count: number }[];
  hook_breakdown: { type: string; type_uz: string; count: number; pct: number }[];
  top_ctas: { text: string; count: number }[];
  power_words: { word: string; count: number }[];
  niche_summary: any;
  posting_heat_map?: HeatMapRow[];
  total_posts_analyzed: number;
  mock?: boolean;
}

const HOOK_COLORS: Record<string, string> = {
  question: "bg-blue-500/20 text-blue-300 border-blue-500/20",
  shock:    "bg-red-500/20 text-red-300 border-red-500/20",
  promise:  "bg-violet-500/20 text-violet-300 border-violet-500/20",
  story:    "bg-pink-500/20 text-pink-300 border-pink-500/20",
  stat:     "bg-orange-500/20 text-orange-300 border-orange-500/20",
  pov:      "bg-cyan-500/20 text-cyan-300 border-cyan-500/20",
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-green-500/20 text-green-300",
  neutral:  "bg-white/10 text-white/40",
  urgent:   "bg-red-500/20 text-red-300",
};

const FORMAT_LABELS_UZ: Record<string, string> = {
  educational:    "Ta'limiy",
  testimonial:    "Guvohnoma",
  transformation: "O'zgarish",
  behind_scenes:  "Sahna ortida",
  promotional:    "Reklama",
  entertainment:  "Ko'ngilochar",
};

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, subtitle, icon: Icon, children, color = "violet" }: {
  title: string; subtitle?: string;
  icon: React.ElementType; children: React.ReactNode; color?: string;
}) {
  const colorMap: Record<string, string> = {
    violet: "text-violet-400 bg-violet-500/10",
    pink:   "text-pink-400 bg-pink-500/10",
    orange: "text-orange-400 bg-orange-500/10",
    green:  "text-green-400 bg-green-500/10",
    cyan:   "text-cyan-400 bg-cyan-500/10",
    blue:   "text-blue-400 bg-blue-500/10",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-semibold text-white leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Competitor card ───────────────────────────────────────────────────────────
function CompetitorCard({ c }: { c: any }) {
  const [open, setOpen] = useState(false);
  const erColor = c.avg_engagement_rate >= 7
    ? "text-green-400" : c.avg_engagement_rate >= 3
    ? "text-yellow-400" : "text-orange-400";

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-pink-500/30 border border-white/10 flex items-center justify-center flex-shrink-0 text-lg">
          🏠
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{c.display_name || `@${c.handle}`}</span>
            <span className="text-white/30 text-xs">@{c.handle}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-white/40">
            {c.followers_est && <span>~{formatNumber(c.followers_est)} obunachilar</span>}
            <span>{c.posts_analyzed} post tahlil qilindi</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-lg font-bold ${erColor}`}>{c.avg_engagement_rate}%</div>
          <div className="text-xs text-white/30">jalb koeff.</div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-white/30 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-white/30 flex-shrink-0" />}
      </div>

      {open && (
        <div className="border-t border-white/10 p-4 space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <Heart className="h-3.5 w-3.5 text-pink-400 mx-auto mb-1" />
              <div className="text-sm font-semibold text-white">{formatNumber(c.avg_likes)}</div>
              <div className="text-xs text-white/30">o'rtacha layk</div>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <MessageCircle className="h-3.5 w-3.5 text-blue-400 mx-auto mb-1" />
              <div className="text-sm font-semibold text-white">{formatNumber(c.avg_comments)}</div>
              <div className="text-xs text-white/30">o'rtacha izoh</div>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <Eye className="h-3.5 w-3.5 text-violet-400 mx-auto mb-1" />
              <div className="text-sm font-semibold text-white">{c.avg_views_est ? formatNumber(c.avg_views_est) : "—"}</div>
              <div className="text-xs text-white/30">o'rtacha ko'rishlar</div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300">
              <Target className="h-3.5 w-3.5" />
              {FORMAT_LABELS_UZ[c.top_format] ?? c.top_format}
            </div>
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border capitalize ${HOOK_COLORS[c.top_hook_type] ?? "bg-white/5 text-white/40 border-white/10"}`}>
              <Zap className="h-3.5 w-3.5" />
              {c.top_hook_type} hook
            </div>
            {Object.entries(c.sentiment_breakdown ?? {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 1).map(([s]) => (
              <div key={s} className={`text-xs px-3 py-1.5 rounded-lg ${SENTIMENT_COLORS[s] ?? "bg-white/5 text-white/40"}`}>
                {s === "positive" ? "Ijobiy 😊" : s === "urgent" ? "Shoshilinch 🔥" : "Neytral 😐"}
              </div>
            ))}
          </div>

          {/* Hook examples */}
          {c.hook_examples?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wide">Hook misollari (real captionlardan)</p>
              <div className="space-y-2">
                {c.hook_examples.map((h: any, i: number) => (
                  <div key={i} className="flex gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 border ${HOOK_COLORS[h.type] ?? "bg-white/5 text-white/40 border-white/10"}`}>{h.type}</span>
                    <p className="text-xs text-white/60 italic leading-relaxed">"{h.hook}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Value props */}
          {c.value_prop_examples?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wide">Asosiy qiymat taklifi (Value prop)</p>
              <div className="space-y-1">
                {c.value_prop_examples.map((v: string, i: number) => (
                  <p key={i} className="text-xs text-white/60 flex gap-2">
                    <span className="text-violet-400 flex-shrink-0">›</span>{v}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Top hashtags */}
          {c.top_hashtags?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wide">Eng ko'p ishlatiladigan hashtaglar</p>
              <div className="flex flex-wrap gap-1.5">
                {c.top_hashtags.map((tag: string) => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50">#{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Top posts ─────────────────────────────────────────────────────────────────
// ── Rank medal config ─────────────────────────────────────────────────────────
const RANK_CONFIG = [
  { bg: "rgba(234,179,8,0.12)",   border: "rgba(234,179,8,0.3)",   text: "#fbbf24", emoji: "🥇" },
  { bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.25)", text: "#cbd5e1", emoji: "🥈" },
  { bg: "rgba(234,138,50,0.10)",  border: "rgba(234,138,50,0.25)",  text: "#fb923c", emoji: "🥉" },
];

function erColor(score: number) {
  return score >= 8 ? "#34d399" : score >= 4 ? "#a5a3ff" : score >= 2 ? "#fbbf24" : "#f87171";
}

function TopPostsList({ posts }: { posts: any[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {posts.map((p, i) => {
        const isOpen = expanded === p.id;
        const rank   = RANK_CONFIG[i];
        const color  = erColor(p.engagement_score);
        const hookColor = HOOK_COLORS[p.hook_type] ?? "bg-white/5 text-white/50 border-white/10";

        // Use hook_text if available, otherwise first 120 chars of caption
        const headline = p.hook_text
          ? `"${p.hook_text}"`
          : p.caption
            ? p.caption.slice(0, 120) + (p.caption.length > 120 ? "…" : "")
            : null;
        // Only show full caption in expanded if it's longer than what's shown above
        const showFullCaption = p.caption && (!p.hook_text ? p.caption.length > 120 : true);

        return (
          <div
            key={p.id}
            className="rounded-2xl overflow-hidden transition-all duration-150"
            style={{
              background: isOpen ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isOpen ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            {/* ── Main card ── */}
            <div className="p-5 sm:p-6 cursor-pointer" onClick={() => setExpanded(isOpen ? null : p.id)}>
              {/* Top row: thumbnail + rank + text + ER score */}
              <div className="flex items-start gap-4 mb-4">

                {/* Thumbnail or rank badge */}
                <div className="flex-shrink-0 relative" style={{ width: 64, height: 64 }}>
                  {p.thumbnail_url ? (
                    <>
                      <img
                        src={p.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover rounded-xl"
                        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                      {/* Rank badge overlay */}
                      <div
                        className="absolute -top-2 -left-2 flex items-center justify-center rounded-lg"
                        style={{
                          width: 26, height: 26,
                          background: rank?.bg ?? "rgba(255,255,255,0.1)",
                          border: `1px solid ${rank?.border ?? "rgba(255,255,255,0.15)"}`,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                        }}
                      >
                        {i < 3
                          ? <span style={{ fontSize: 14, lineHeight: 1 }}>{rank!.emoji}</span>
                          : <span className="font-bold tabular-nums" style={{ fontSize: 11, color: "#8a8f98" }}>{i + 1}</span>
                        }
                      </div>
                      {/* Open in Instagram button */}
                      {p.post_url && (
                        <a
                          href={p.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute inset-0 flex items-center justify-center rounded-xl opacity-0 hover:opacity-100 transition-opacity"
                          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
                          title="Instagramda ochish"
                        >
                          <Instagram size={22} style={{ color: "#fff" }} />
                        </a>
                      )}
                    </>
                  ) : (
                    /* No thumbnail — show rank badge */
                    <div
                      className="w-full h-full flex items-center justify-center rounded-xl"
                      style={{
                        background: rank?.bg ?? "rgba(255,255,255,0.05)",
                        border: `1px solid ${rank?.border ?? "rgba(255,255,255,0.1)"}`,
                      }}
                    >
                      {i < 3
                        ? <span style={{ fontSize: 28, lineHeight: 1 }}>{rank!.emoji}</span>
                        : <span className="font-bold tabular-nums" style={{ fontSize: 22, color: "#8a8f98" }}>{i + 1}</span>
                      }
                    </div>
                  )}
                </div>

                {/* Headline text */}
                <div className="flex-1 min-w-0 pt-0.5">
                  {headline ? (
                    <p className="font-semibold leading-snug" style={{ color: "#f7f8f8", fontSize: 15, letterSpacing: "-0.02em" }}>
                      {headline}
                    </p>
                  ) : (
                    <p style={{ color: "#62666d", fontSize: 14, fontStyle: "italic" }}>Matn mavjud emas</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="font-medium" style={{ color: "#8a8f98", fontSize: 13 }}>
                      @{p.competitor_handle}
                    </p>
                    {p.post_url && (
                      <a
                        href={p.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors hover:opacity-80"
                        style={{ background: "rgba(165,163,255,0.12)", border: "1px solid rgba(165,163,255,0.2)", color: "#a5a3ff", fontSize: 11, fontWeight: 600 }}
                      >
                        <Instagram size={11} />
                        Ko'rish
                      </a>
                    )}
                  </div>
                </div>

                {/* ER score — big & bold */}
                <div className="flex-shrink-0 text-right">
                  <div className="font-bold tabular-nums leading-none" style={{ fontSize: 28, color, letterSpacing: "-0.04em" }}>
                    {p.engagement_score.toFixed(2)}
                  </div>
                  <div className="font-semibold mt-0.5" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>
                    ER SCORE
                  </div>
                </div>
              </div>

              {/* Tags row */}
              <div className="flex flex-wrap gap-2 mb-4">
                {p.hook_type && (
                  <span className={`text-sm px-3 py-1 rounded-lg border font-medium capitalize ${hookColor}`}>
                    {p.hook_type === "promise" ? "Va'da" : p.hook_type === "question" ? "Savol" : p.hook_type === "shock" ? "Shok" : p.hook_type === "story" ? "Hikoya" : p.hook_type}
                  </span>
                )}
                {p.content_format && (
                  <span className="text-sm px-3 py-1 rounded-lg border font-medium"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#d0d6e0", borderColor: "rgba(255,255,255,0.1)" }}>
                    {FORMAT_LABELS_UZ[p.content_format] ?? p.content_format}
                  </span>
                )}
                {p.sentiment && (
                  <span className={`text-sm px-3 py-1 rounded-lg font-medium ${SENTIMENT_COLORS[p.sentiment] ?? "bg-white/5 text-white/40"}`}>
                    {p.sentiment === "positive" ? "Ijobiy" : p.sentiment === "urgent" ? "Shoshilinch" : "Neytral"}
                  </span>
                )}
                {p.pacing_style && (
                  <span className="text-sm px-3 py-1 rounded-lg border"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#8a8f98", borderColor: "rgba(255,255,255,0.08)" }}>
                    {p.pacing_style === "fast" ? "Tez ⚡" : p.pacing_style === "slow" ? "Sekin 🐢" : "O'rta"}
                  </span>
                )}
              </div>

              {/* Stats row — big numbers */}
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))" }}
              >
                {p.likes_est != null && (
                  <div className="flex flex-col gap-1 rounded-xl p-3"
                    style={{ background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.18)" }}>
                    <Heart size={16} style={{ color: "#f472b6" }} />
                    <span className="font-bold tabular-nums" style={{ fontSize: 20, color: "#f7f8f8", letterSpacing: "-0.03em" }}>
                      {formatNumber(p.likes_est)}
                    </span>
                    <span style={{ fontSize: 11, color: "#f472b6", fontWeight: 600, letterSpacing: "0.04em" }}>LAYK</span>
                  </div>
                )}
                {p.comments_est != null && (
                  <div className="flex flex-col gap-1 rounded-xl p-3"
                    style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.18)" }}>
                    <MessageCircle size={16} style={{ color: "#60a5fa" }} />
                    <span className="font-bold tabular-nums" style={{ fontSize: 20, color: "#f7f8f8", letterSpacing: "-0.03em" }}>
                      {formatNumber(p.comments_est)}
                    </span>
                    <span style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600, letterSpacing: "0.04em" }}>IZOH</span>
                  </div>
                )}
                {p.views_est != null && (
                  <div className="flex flex-col gap-1 rounded-xl p-3"
                    style={{ background: "rgba(165,163,255,0.08)", border: "1px solid rgba(165,163,255,0.18)" }}>
                    <Eye size={16} style={{ color: "#a5a3ff" }} />
                    <span className="font-bold tabular-nums" style={{ fontSize: 20, color: "#f7f8f8", letterSpacing: "-0.03em" }}>
                      {formatNumber(p.views_est)}
                    </span>
                    <span style={{ fontSize: 11, color: "#a5a3ff", fontWeight: 600, letterSpacing: "0.04em" }}>KO'RISHLAR</span>
                  </div>
                )}
                {/* ER tile */}
                <div className="flex flex-col gap-1 rounded-xl p-3"
                  style={{ background: `${color}14`, border: `1px solid ${color}30` }}>
                  <TrendingUp size={16} style={{ color }} />
                  <span className="font-bold tabular-nums" style={{ fontSize: 20, color: "#f7f8f8", letterSpacing: "-0.03em" }}>
                    {p.engagement_score.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 11, color, fontWeight: 600, letterSpacing: "0.04em" }}>ER SCORE</span>
                </div>
              </div>

              {/* Expand hint */}
              <div className="flex items-center justify-center mt-4 gap-1.5" style={{ color: "#62666d" }}>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span style={{ fontSize: 12 }}>{isOpen ? "Yopish" : "Batafsil ko'rish"}</span>
              </div>
            </div>

            {/* ── Expanded detail ── */}
            {isOpen && (
              <div
                className="px-5 pb-5 space-y-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {p.value_prop && (
                    <div className="rounded-xl p-3.5" style={{ background: "rgba(165,163,255,0.06)", border: "1px solid rgba(165,163,255,0.12)" }}>
                      <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#a5a3ff" }}>
                        Qiymat taklifi
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: "#d0d6e0" }}>{p.value_prop}</p>
                    </div>
                  )}
                  {p.cta_text && (
                    <div className="rounded-xl p-3.5" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
                      <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#34d399" }}>
                        Harakat chaqiruvi (CTA)
                      </p>
                      <p className="text-sm font-medium" style={{ color: "#d0d6e0" }}>{p.cta_text}</p>
                    </div>
                  )}
                </div>

                {p.power_words?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#fb923c" }}>
                      Kuchli so'zlar
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.power_words.map((w: string) => (
                        <span key={w} className="text-xs px-2.5 py-1 rounded-lg font-medium"
                          style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)", color: "#fb923c" }}>
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {p.hashtags?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#8a8f98" }}>
                      Hashtaglar
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.hashtags.map((h: string) => (
                        <span key={h} className="text-xs px-2 py-0.5 rounded-md"
                          style={{ background: "rgba(165,163,255,0.08)", color: "#a5a3ff" }}>
                          #{h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {showFullCaption && (
                  <div>
                    <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#8a8f98" }}>
                      To'liq caption
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "#62666d" }}>
                      {p.caption!.slice(0, 500)}{p.caption!.length > 500 ? "…" : ""}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Heat Map ──────────────────────────────────────────────────────────────────
function PostingHeatMap({ data }: { data: HeatMapRow[] }) {
  const [tooltip, setTooltip] = useState<{ row: number; col: number } | null>(null);
  const allAvgEng = data.flatMap((row) => row.slots.map((s) => s.avgEng));
  const maxEng = Math.max(...allAvgEng, 0.1);
  const SLOTS = data[0]?.slots.map((s) => s.slot) ?? [];

  return (
    <div className="overflow-x-auto">
      {/* Column headers */}
      <div className="flex mb-1 pl-10">
        {SLOTS.map((slot) => (
          <div key={slot} className="flex-1 text-center text-xs text-white/40 font-medium px-1">
            {slot}
          </div>
        ))}
      </div>
      {/* Rows */}
      <div className="space-y-1">
        {data.map((row, ri) => (
          <div key={row.day} className="flex items-center gap-1">
            <div className="w-9 text-xs text-white/40 font-medium text-right pr-2 flex-shrink-0">{row.day}</div>
            {row.slots.map((cell, ci) => {
              const intensity = cell.count > 0 ? Math.max(0.05, Math.min(1, cell.avgEng / maxEng)) : 0.03;
              const isHovered = tooltip?.row === ri && tooltip?.col === ci;
              return (
                <div
                  key={cell.slot}
                  className="relative flex-1 h-9 rounded-md cursor-pointer transition-transform hover:scale-110"
                  style={{ backgroundColor: `rgba(139, 92, 246, ${intensity})` }}
                  onMouseEnter={() => setTooltip({ row: ri, col: ci })}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {cell.count > 0 && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white/70 font-medium leading-none pointer-events-none">
                      {cell.count}
                    </span>
                  )}
                  {isHovered && cell.count > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 whitespace-nowrap bg-[#1a1f2e] border border-white/20 text-xs text-white/80 px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none">
                      {cell.count} ta post · avg ER: {cell.avgEng.toFixed(1)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-xs text-white/30">Kam</span>
        {[0.05, 0.2, 0.4, 0.65, 1].map((v) => (
          <div key={v} className="h-3 w-5 rounded-sm" style={{ backgroundColor: `rgba(139, 92, 246, ${v})` }} />
        ))}
        <span className="text-xs text-white/30">Ko'p</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadResults(); }, []);

  async function loadResults() {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze/results");
      if (res.ok) {
        const d = await res.json();
        if (d.competitors?.length > 0) setData(d);
      }
    } catch { /* silent */ }
    setLoading(false);
  }

  async function startAnalysis() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze/scrape", { method: "POST" });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Xatolik yuz berdi"); setStarting(false); return; }
      await loadResults();
    } catch { setError("Tarmoq xatosi — qayta urinib ko'ring"); }
    finally { setStarting(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Kontent tahlili</h1>
        <p className="text-white/50 mt-1">Raqobatchilarning eng yaxshi postlarini o'rganing</p>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
        <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200/70">
          <span className="font-medium text-amber-300">Muhim: </span>
          Barcha ko'rsatkichlar AI tomonidan baholangan. Instagram bilan rasmiy aloqa yo'q.
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-white/15 p-16 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-4">
          <BarChart3 className="h-7 w-7 text-violet-400" />
        </div>
        <h3 className="font-semibold text-white text-lg mb-2">Ma'lumot yo'q</h3>
        <p className="text-white/40 text-sm max-w-md mx-auto mb-6 leading-relaxed">
          Raqobatchilar tahlilini boshlash uchun quyidagi tugmani bosing.
        </p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button onClick={startAnalysis} disabled={starting}
          className="inline-flex items-center gap-2 gradient-brand text-white px-8 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
          {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />}
          {starting ? "Tahlil qilinmoqda…" : "Tahlilni boshlash"}
        </button>
        <p className="text-white/20 text-xs mt-3">Taxminan 2-5 daqiqa</p>
      </div>
    </div>
  );

  const avgER = data.competitors.reduce((s, c) => s + (c.avg_engagement_rate ?? 0), 0) / Math.max(data.competitors.length, 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Kontent tahlili</h1>
          <p className="text-white/50 mt-1">
            {data.competitors.length} raqobatchi · {data.total_posts_analyzed} post tahlil qilindi
            <span className="text-white/25 ml-1">(Competitor analysis)</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data.mock && <span className="text-xs px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-300">Demo</span>}
          <button onClick={startAnalysis} disabled={starting}
            className="flex items-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-40">
            <RefreshCw className={`h-4 w-4 ${starting ? "animate-spin" : ""}`} />
            Qayta tahlil
          </button>
        </div>
      </div>

      {/* Compliance */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3.5">
        <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-200/70">
          Barcha ko'rsatkichlar <span className="font-medium text-blue-300">AI tomonidan baholangan</span> — ommaviy signallar asosida.
          <span className="text-blue-400/40 ml-1">(AI-estimated from public signals, not affiliated with Meta)</span>
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Raqobatchilar", sub: "Competitors", value: data.competitors.length, icon: Target, color: "violet" },
          { label: "Tahlil qilingan postlar", sub: "Posts analyzed", value: data.total_posts_analyzed, icon: BarChart3, color: "pink" },
          { label: "O'rtacha jalb koeff.", sub: "Avg engagement rate", value: avgER.toFixed(1) + "%", icon: TrendingUp, color: "green" },
          { label: "Unique hashtaglar", sub: "Unique hashtags", value: data.hashtag_cloud.length, icon: Hash, color: "orange" },
        ].map(({ label, sub, value, icon: Icon, color }) => {
          const cm: Record<string, string> = { violet: "text-violet-400 bg-violet-500/10", pink: "text-pink-400 bg-pink-500/10", green: "text-green-400 bg-green-500/10", orange: "text-orange-400 bg-orange-500/10" };
          return (
            <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className={`h-7 w-7 rounded-lg ${cm[color]} flex items-center justify-center mb-2`}><Icon className="h-3.5 w-3.5" /></div>
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-sm text-white/50 leading-tight">{label}</div>
              <div className="text-xs text-white/20">{sub}</div>
            </div>
          );
        })}
      </div>

      {/* Competitor cards */}
      <Section title="Raqobatchilar tahlili" subtitle="Har birini bosib batafsil ko'ring — Competitor analysis" icon={Target} color="violet">
        <div className="space-y-3">
          {[...data.competitors].sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate).map((c) => (
            <CompetitorCard key={c.handle} c={c} />
          ))}
        </div>
      </Section>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Jalb darajasi trendi" subtitle="Engagement rate trend over time" icon={TrendingUp} color="violet">
          <EngagementTrendChart data={data.engagement_trend} />
        </Section>
        <Section title="Kontent formati taqsimoti" subtitle="Content format breakdown" icon={BarChart3} color="pink">
          {data.content_format_breakdown.length > 0 ? (
            <>
              <ContentFormatPie data={data.content_format_breakdown} />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {data.content_format_breakdown.map((f) => (
                  <div key={f.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: f.color }} />
                    <span className="text-white/70 font-medium">{f.name_uz}</span>
                    <span className="text-white/30 ml-auto">{f.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-white/30 py-8 text-center">Ma'lumot yo'q — tahlilni boshlang</p>
          )}
        </Section>
      </div>

      {/* Hook + Sentiment + Pacing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Section title="Hook turlari" subtitle="Hook type distribution" icon={Zap} color="violet">
          <div className="space-y-3">
            {data.hook_breakdown.length > 0 ? data.hook_breakdown.map((h) => (
              <div key={h.type}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-lg border capitalize ${HOOK_COLORS[h.type] ?? "bg-white/5 text-white/40 border-white/10"}`}>
                    {h.type_uz} <span className="text-white/25">({h.type})</span>
                  </span>
                  <span className="text-xs text-white/40">{h.pct}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full">
                  <div className="h-full rounded-full gradient-brand" style={{ width: `${h.pct}%` }} />
                </div>
                <p className="text-xs text-white/25 mt-0.5">{h.count} ta post</p>
              </div>
            )) : <p className="text-xs text-white/30 py-4 text-center">Ma'lumot yo'q</p>}
          </div>
        </Section>

        <Section title="Ton tahlili" subtitle="Sentiment analysis" icon={Brain} color="green">
          <div className="space-y-3">
            {data.sentiment_breakdown.length > 0 ? data.sentiment_breakdown.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-lg ${SENTIMENT_COLORS[s.name] ?? "bg-white/5 text-white/30"}`}>
                    {s.name_uz} <span className="opacity-40">({s.name})</span>
                  </span>
                  <span className="text-xs text-white/40">{s.pct}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full">
                  <div className={`h-full rounded-full ${s.name === "positive" ? "bg-green-500" : s.name === "urgent" ? "bg-red-500" : "bg-white/30"}`} style={{ width: `${s.pct}%` }} />
                </div>
                <p className="text-xs text-white/25 mt-0.5">{s.count} ta post</p>
              </div>
            )) : <p className="text-xs text-white/30 py-4 text-center">Ma'lumot yo'q</p>}
          </div>
        </Section>

        <Section title="Tezlik tahlili" subtitle="Pacing style (fast / medium / slow)" icon={Clock} color="orange">
          <div className="space-y-3">
            {data.pacing_breakdown.length > 0 ? data.pacing_breakdown.map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/70">
                    {p.name_uz} <span className="text-white/25">({p.name})</span>
                    {p.name === "fast" ? " ⚡" : p.name === "slow" ? " 🐢" : " ➡️"}
                  </span>
                  <span className="text-xs text-white/40">{p.pct}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full">
                  <div className={`h-full rounded-full ${p.name === "fast" ? "bg-orange-500" : p.name === "medium" ? "bg-violet-500" : "bg-blue-500"}`} style={{ width: `${p.pct}%` }} />
                </div>
                <p className="text-xs text-white/25 mt-0.5">{p.count} ta post</p>
              </div>
            )) : <p className="text-xs text-white/30 py-4 text-center">Ma'lumot yo'q</p>}
          </div>
        </Section>
      </div>

      {/* Hashtag cloud + Power words */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Hashtag buluti" subtitle="Top hashtags across all competitors" icon={Hash} color="cyan">
          {data.hashtag_cloud.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.hashtag_cloud.map(({ tag, count }, i) => {
                const size = i < 3 ? "text-base font-semibold" : i < 8 ? "text-sm font-medium" : "text-xs";
                const style = i < 3 ? "text-violet-300 border-violet-500/30 bg-violet-500/10" : i < 8 ? "text-white/70 border-white/15 bg-white/5" : "text-white/40 border-white/10 bg-white/3";
                return (
                  <span key={tag} className={`px-2.5 py-1 rounded-lg border ${size} ${style}`}>
                    #{tag}<span className="text-white/20 ml-1 text-xs font-normal">{count}</span>
                  </span>
                );
              })}
            </div>
          ) : <p className="text-xs text-white/30 py-4 text-center">Ma'lumot yo'q — postlar tahlil qilinmagan</p>}
        </Section>

        <div className="space-y-4">
          <Section title="Kuchli so'zlar" subtitle="Power words used most by competitors" icon={Flame} color="orange">
            {data.power_words.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.power_words.map(({ word, count }) => (
                  <span key={word} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300">
                    {word}<span className="text-orange-500/40">{count}</span>
                  </span>
                ))}
              </div>
            ) : <p className="text-xs text-white/30 py-4 text-center">Ma'lumot yo'q</p>}
          </Section>

          {data.top_ctas.length > 0 && (
            <Section title="Eng ko'p CTA matni" subtitle="Top call-to-action phrases" icon={Target} color="green">
              <div className="space-y-2">
                {data.top_ctas.map(({ text, count }) => (
                  <div key={text} className="flex items-center justify-between rounded-lg bg-green-500/5 border border-green-500/10 px-3 py-2">
                    <span className="text-sm text-white/70">"{text}"</span>
                    <span className="text-xs text-white/30 flex-shrink-0 ml-2">{count}x</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Posting heat map */}
      {data.posting_heat_map && data.posting_heat_map.length > 0 && (
        <Section title="Postlash vaqti xaritasi" subtitle="Qaysi kun va soatda post eng ko'p jalb qiladi — Posting time heat map" icon={Clock} color="cyan">
          <PostingHeatMap data={data.posting_heat_map} />
        </Section>
      )}

      {/* Top posts */}
      <Section title="Eng yuqori postlar" subtitle={`Top ${data.top_posts.length} ta — hook, teglar va to'liq tahlil uchun bosing`} icon={TrendingUp} color="pink">
        <TopPostsList posts={data.top_posts} />
      </Section>

      {/* Niche summary */}
      {data.niche_summary && (
        <Section title="Nisha xulosasi" subtitle="G'olib namunalar va eng yaxshi vaqtlar — AI-powered niche summary" icon={Brain} color="violet">
          <NicheSummaryCard summary={data.niche_summary} />
        </Section>
      )}
    </div>
  );
}
