"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Brain, Lightbulb, Sparkles, Users, Wand2,
  ChevronRight, Instagram, Loader2, BookOpen, Settings,
} from "lucide-react";
import { useLang } from "@/lib/i18n/context";
import { useScripts } from "@/lib/scripts-context";

export function Sidebar() {
  const pathname = usePathname();
  const { T } = useLang();
  const { loading: scriptsLoading } = useScripts();

  const NAV_ITEMS = [
    { href: "/dashboard",             label: T.nav.profile,     icon: Instagram, exact: true },
    { href: "/dashboard/competitors", label: T.nav.competitors, icon: Users },
    { href: "/dashboard/analysis",    label: T.nav.analysis,    icon: BarChart3 },
    { href: "/dashboard/insights",    label: T.nav.insights,    icon: Lightbulb },
    { href: "/dashboard/hooks",       label: T.nav.hooks,       icon: BookOpen },
    { href: "/dashboard/scripts",     label: T.nav.scripts,     icon: Wand2, highlight: true },
    { href: "/dashboard/settings",    label: T.nav.settings,    icon: Settings },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden md:flex w-56 flex-col flex-shrink-0"
      style={{
        background: "#0a0b0c",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-7 w-7 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0 shadow-glow">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span
            className="font-semibold text-base tracking-tight"
            style={{ color: "#f7f8f8", letterSpacing: "-0.02em" }}
          >
            InstaIntel
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact, highlight }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
              style={
                active
                  ? {
                      background: "rgba(109,104,255,0.12)",
                      color: "#f7f8f8",
                      border: "1px solid rgba(109,104,255,0.2)",
                      boxShadow: "inset 0 0 12px rgba(109,104,255,0.06)",
                    }
                  : {
                      background: "transparent",
                      color: "#8a8f98",
                      border: "1px solid transparent",
                    }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.color = "#d0d6e0";
                  (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.06)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#8a8f98";
                  (e.currentTarget as HTMLElement).style.border = "1px solid transparent";
                }
              }}
            >
              <Icon
                size={15}
                className="flex-shrink-0 transition-colors"
                style={{
                  color: active ? "#a5a3ff" : highlight ? "#e879f9" : undefined,
                  opacity: active ? 1 : 0.7,
                }}
              />
              <span className="flex-1 truncate">{label}</span>

              {active && (
                <ChevronRight size={12} style={{ color: "#a5a3ff", opacity: 0.6 }} />
              )}

              {highlight && !active && (
                scriptsLoading
                  ? <Loader2 size={11} className="animate-spin flex-shrink-0" style={{ color: "#e879f9" }} />
                  : <span
                      className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold flex-shrink-0"
                      style={{
                        background: "rgba(232,121,249,0.12)",
                        color: "#e879f9",
                        border: "1px solid rgba(232,121,249,0.2)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      AI
                    </span>
              )}
              {highlight && active && scriptsLoading && (
                <Loader2 size={11} className="animate-spin flex-shrink-0" style={{ color: "#a5a3ff" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          className="rounded-xl p-3"
          style={{
            background: "rgba(109,104,255,0.07)",
            border: "1px solid rgba(109,104,255,0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Brain size={13} style={{ color: "#a5a3ff" }} />
            <span className="text-xs font-semibold" style={{ color: "#f7f8f8", letterSpacing: "-0.01em" }}>
              {T.sidebar.freePlan}
            </span>
          </div>
          <p className="text-[11px] mb-2.5" style={{ color: "#62666d" }}>
            {T.sidebar.scriptQuota}
          </p>
          <Link
            href="/upgrade"
            className="block text-center text-[11px] font-semibold gradient-brand text-white py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            style={{ letterSpacing: "-0.01em" }}
          >
            {T.sidebar.upgradeCta}
          </Link>
        </div>
      </div>
    </aside>
  );
}
