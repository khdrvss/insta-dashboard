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
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-[#0d1117] flex-shrink-0">
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
        <div className="flex items-center rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          <button
            onClick={() => setLang("uz")}
            className={`px-2.5 py-1 text-xs font-semibold transition-all ${
              lang === "uz"
                ? "gradient-brand text-white"
                : "text-white/40 hover:text-white"
            }`}
          >
            UZ
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-2.5 py-1 text-xs font-semibold transition-all ${
              lang === "en"
                ? "gradient-brand text-white"
                : "text-white/40 hover:text-white"
            }`}
          >
            EN
          </button>
        </div>

        <button
          className="relative h-8 w-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-colors"
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
