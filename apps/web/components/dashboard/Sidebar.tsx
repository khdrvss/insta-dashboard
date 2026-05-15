"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Brain, Lightbulb, Sparkles, Users, Wand2,
  ChevronRight, Instagram
} from "lucide-react";
import { useLang } from "@/lib/i18n/context";

export function Sidebar() {
  const pathname = usePathname();
  const { T } = useLang();

  const NAV_ITEMS = [
    { href: "/dashboard",             label: T.nav.profile,     icon: Instagram, exact: true },
    { href: "/dashboard/competitors", label: T.nav.competitors, icon: Users },
    { href: "/dashboard/analysis",    label: T.nav.analysis,    icon: BarChart3 },
    { href: "/dashboard/insights",    label: T.nav.insights,    icon: Lightbulb },
    { href: "/dashboard/scripts",     label: T.nav.scripts,     icon: Wand2, highlight: true },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-white/10 bg-[#0d1117] flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg">InstaIntel</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact, highlight }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-violet-600/20 text-white border border-violet-500/30"
                  : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon
                className={`h-4.5 w-4.5 flex-shrink-0 transition-colors ${
                  active
                    ? "text-violet-400"
                    : highlight
                    ? "text-pink-400"
                    : "text-white/40 group-hover:text-white/60"
                }`}
                size={18}
              />
              <span className="flex-1">{label}</span>
              {active && (
                <ChevronRight className="h-3.5 w-3.5 text-violet-400 opacity-70" />
              )}
              {highlight && !active && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-medium">
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Brain className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-medium text-white">{T.sidebar.freePlan}</span>
          </div>
          <p className="text-xs text-white/40 mb-2">{T.sidebar.scriptQuota}</p>
          <Link
            href="/upgrade"
            className="block text-center text-xs font-medium gradient-brand text-white py-1.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            {T.sidebar.upgradeCta}
          </Link>
        </div>
      </div>
    </aside>
  );
}
