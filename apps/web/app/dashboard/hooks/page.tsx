"use client";

import { useEffect, useState, useCallback } from "react";
import { BookOpen, Copy, CheckCircle, ChevronDown, ChevronUp, Flame, Search, Eye, Heart } from "lucide-react";
import { useLang } from "@/lib/i18n/context";
import { formatNumber } from "@/lib/utils";

interface Hook {
  id: string;
  hookText: string;
  hookType: string;
  competitorHandle: string;
  competitorName: string | null;
  caption: string | null;
  postedAt: string | null;
  likesEst: number | null;
  viewsEst: number | null;
  contentFormat: string | null;
  ctaText: string | null;
  sentiment: string | null;
}

type SortKey = "likes" | "new" | "az";

const HOOK_TYPE_COLORS: Record<string, string> = {
  question: "bg-blue-500/20 text-blue-300 border-blue-500/20",
  shock:    "bg-red-500/20 text-red-300 border-red-500/20",
  promise:  "bg-green-500/20 text-green-300 border-green-500/20",
  story:    "bg-violet-500/20 text-violet-300 border-violet-500/20",
  educational: "bg-cyan-500/20 text-cyan-300 border-cyan-500/20",
  stat:     "bg-orange-500/20 text-orange-300 border-orange-500/20",
};

const HOOK_TYPE_UZ: Record<string, string> = {
  question:    "Savol",
  shock:       "Shok",
  promise:     "Va'da",
  story:       "Hikoya",
  educational: "Ta'lim",
  stat:        "Stat",
};

const HOOK_TYPES = [
  { value: "all",         label_uz: "Barchasi",   label_en: "All" },
  { value: "question",    label_uz: "Savol",       label_en: "Question" },
  { value: "shock",       label_uz: "Shok",        label_en: "Shock" },
  { value: "promise",     label_uz: "Va'da",       label_en: "Promise" },
  { value: "story",       label_uz: "Hikoya",      label_en: "Story" },
  { value: "educational", label_uz: "Ta'lim",      label_en: "Educational" },
];

function HookCard({ hook, lang }: { hook: Hook; lang: "uz" | "en" }) {
  const [copied, setCopied] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const labelCopy = lang === "uz" ? "Hook nusxalash" : "Copy hook";
  const labelCopied = lang === "uz" ? "Nusxalandi!" : "Copied!";
  const labelView = lang === "uz" ? "Sarlavhani ko'rish" : "View caption";
  const labelHide = lang === "uz" ? "Yopish" : "Hide";

  const typeColor = HOOK_TYPE_COLORS[hook.hookType] ?? "bg-white/10 text-white/40 border-white/10";
  const typeLabelUz = HOOK_TYPE_UZ[hook.hookType] ?? hook.hookType;

  function copyHook() {
    navigator.clipboard.writeText(hook.hookText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4 hover:border-white/20 transition-colors">
      {/* Top row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${typeColor}`}>
          {lang === "uz" ? typeLabelUz : hook.hookType}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40">
          @{hook.competitorHandle}
        </span>
        {hook.contentFormat && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/30">
            {hook.contentFormat}
          </span>
        )}
      </div>

      {/* Hook text */}
      <div className="flex gap-2">
        <span className="text-3xl text-violet-500/50 font-serif leading-none mt-0.5 flex-shrink-0">"</span>
        <p className="text-lg font-semibold text-white leading-snug">{hook.hookText}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        {hook.likesEst != null && (
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3 text-pink-400" />
            {formatNumber(hook.likesEst)}
          </span>
        )}
        {hook.viewsEst != null && (
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-violet-400" />
            {formatNumber(hook.viewsEst)}
          </span>
        )}
        {hook.sentiment && (
          <span className="ml-auto text-xs text-white/30">{hook.sentiment}</span>
        )}
      </div>

      {/* Caption */}
      {captionOpen && hook.caption && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <p className="text-xs text-white/50 leading-relaxed">{hook.caption.slice(0, 500)}{hook.caption.length > 500 ? "…" : ""}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={copyHook}
          className="flex-1 flex items-center justify-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          {copied ? (
            <><CheckCircle className="h-4 w-4 text-green-400" />{labelCopied}</>
          ) : (
            <><Copy className="h-4 w-4" />{labelCopy}</>
          )}
        </button>
        {hook.caption && (
          <button
            onClick={() => setCaptionOpen(!captionOpen)}
            className="flex items-center justify-center gap-1.5 border border-white/20 text-white/50 hover:text-white hover:border-white/40 px-3 py-2.5 rounded-xl text-sm transition-colors"
          >
            {captionOpen ? (
              <><ChevronUp className="h-4 w-4" />{labelHide}</>
            ) : (
              <><ChevronDown className="h-4 w-4" />{labelView}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 animate-pulse h-52" />
  );
}

export default function HooksPage() {
  const { T, lang } = useLang();
  const h = T.hooks;

  const [hooks, setHooks] = useState<Hook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [sort, setSort] = useState<SortKey>("likes");

  const fetchHooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeType !== "all") params.set("type", activeType);
      if (search) params.set("search", search);
      const res = await fetch(`/api/hooks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHooks(data.hooks ?? []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [activeType, search]);

  useEffect(() => {
    const timer = setTimeout(fetchHooks, 300);
    return () => clearTimeout(timer);
  }, [fetchHooks]);

  const sorted = [...hooks].sort((a, b) => {
    if (sort === "likes") return (b.likesEst ?? 0) - (a.likesEst ?? 0);
    if (sort === "new") return new Date(b.postedAt ?? 0).getTime() - new Date(a.postedAt ?? 0).getTime();
    if (sort === "az") return a.hookText.localeCompare(b.hookText);
    return 0;
  });

  const sortOptions: { value: SortKey; label: string }[] = [
    { value: "likes", label: h.sortLikes },
    { value: "new",   label: h.sortNew },
    { value: "az",    label: h.sortAz },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{h.pageTitle}</h1>
        <p className="text-white/50 mt-1">{h.pageSubtitle}</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={h.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>

        {/* Type pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {HOOK_TYPES.map(({ value, label_uz, label_en }) => (
            <button
              key={value}
              onClick={() => setActiveType(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeType === value
                  ? "gradient-brand text-white"
                  : "border border-white/20 text-white/50 hover:border-white/40 hover:text-white"
              }`}
            >
              {lang === "uz" ? label_uz : label_en}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm focus:outline-none focus:border-violet-500/50 cursor-pointer"
        >
          {sortOptions.map(({ value, label }) => (
            <option key={value} value={value} className="bg-[#0d1117]">{label}</option>
          ))}
        </select>
      </div>

      {/* Count */}
      {!loading && hooks.length > 0 && (
        <p className="text-xs text-white/30">{sorted.length} {h.hooks}</p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-16 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-4">
            <Flame className="h-7 w-7 text-violet-400" />
          </div>
          <h3 className="font-semibold text-white mb-2">{h.noHooks}</h3>
          <p className="text-white/40 text-sm max-w-md mx-auto">{h.noHooksDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((hook) => (
            <HookCard key={hook.id} hook={hook} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
