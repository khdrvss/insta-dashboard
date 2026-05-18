"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Lightbulb, Instagram, Users, Wand2, BookOpen, Loader2,
} from "lucide-react";
import { useLang } from "@/lib/i18n/context";
import { useScripts } from "@/lib/scripts-context";

export function MobileNav() {
  const pathname = usePathname();
  const { T } = useLang();
  const { loading: scriptsLoading } = useScripts();

  const NAV_ITEMS = [
    { href: "/dashboard",             label: T.nav.profile,      icon: Instagram, exact: true },
    { href: "/dashboard/competitors", label: T.nav.competitors,  icon: Users },
    { href: "/dashboard/analysis",    label: T.nav.analysis,     icon: BarChart3 },
    { href: "/dashboard/insights",    label: T.nav.insights,     icon: Lightbulb },
    { href: "/dashboard/hooks",       label: T.nav.hooks,        icon: BookOpen },
    { href: "/dashboard/scripts",     label: T.nav.scripts,      icon: Wand2, highlight: true },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d1117] border-t border-white/10 flex items-center justify-around px-1 py-2 safe-area-pb">
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact, highlight }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-0 flex-1 ${
              active ? "text-violet-400" : "text-white/40"
            }`}
          >
            <div className="relative">
              <Icon size={20} className={active ? "text-violet-400" : highlight ? "text-pink-400" : "text-white/40"} />
              {highlight && !active && scriptsLoading && (
                <Loader2 size={8} className="absolute -top-1 -right-1 text-pink-400 animate-spin" />
              )}
              {highlight && !active && !scriptsLoading && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-pink-500" />
              )}
            </div>
            <span className="text-[9px] font-medium leading-none truncate w-full text-center">{label}</span>
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-violet-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
