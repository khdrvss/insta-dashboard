"use client";

import { Bell, Sparkles, User } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLang } from "@/lib/i18n/context";

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const USE_CLERK = CLERK_KEY.startsWith("pk_") && !CLERK_KEY.includes("placeholder");

// Only load Clerk's UserButton when real Clerk keys are configured
const ClerkUserButton = USE_CLERK
  ? dynamic(
      () =>
        import("@clerk/nextjs").then((mod) => {
          const { UserButton } = mod;
          return function ClerkBtn() {
            return (
              <UserButton
                appearance={{ elements: { avatarBox: "h-8 w-8" } }}
              />
            );
          };
        }),
      { ssr: false, loading: () => <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" /> }
    )
  : null;

export function Header() {
  const { lang, setLang } = useLang();

  return (
    <header className="flex items-center justify-between px-6 py-3 flex-shrink-0"
      style={{ background: "#0a0b0c", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Mobile logo */}
      <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
        <div className="h-7 w-7 rounded-lg gradient-brand flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="font-bold text-white">InstaIntel</span>
      </Link>

      {/* Desktop breadcrumb area */}
      <div className="hidden md:block" />

      {/* Right side */}
      <div className="flex items-center gap-3">

        {/* Language toggle */}
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
        >
          {(["uz", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase transition-all"
              style={
                lang === l
                  ? { background: "rgba(109,104,255,0.2)", color: "#a5a3ff" }
                  : { color: "#62666d" }
              }
            >
              {l}
            </button>
          ))}
        </div>

        <button
          className="relative h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#62666d" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#d0d6e0"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#62666d"; }}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {ClerkUserButton ? (
          <ClerkUserButton />
        ) : (
          <div className="h-8 w-8 rounded-full gradient-brand flex items-center justify-center text-white">
            <User className="h-4 w-4" />
          </div>
        )}
      </div>
    </header>
  );
}
