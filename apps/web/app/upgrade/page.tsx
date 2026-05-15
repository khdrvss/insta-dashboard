"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/context";

export default function UpgradePage() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);
  const { T } = useLang();
  const u = T.upgrade;

  async function checkout() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: billingInterval }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">{u.pageTitle}</h1>
          <p className="text-white/50 text-lg">{u.pageSubtitle}</p>

          {/* Interval toggle */}
          <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mt-6">
            {(["monthly", "annual"] as const).map((i) => (
              <button
                key={i}
                onClick={() => setBillingInterval(i)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingInterval === i ? "gradient-brand text-white" : "text-white/50 hover:text-white"
                }`}
              >
                {i === "monthly" ? u.monthly : u.annual}
                {i === "annual" && (
                  <span className="text-xs ml-1 text-green-400">{u.save30}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <div className="mb-6">
              <div className="text-white/50 text-sm font-medium mb-1">{u.freeTitle}</div>
              <div className="text-4xl font-bold text-white">$0</div>
              <div className="text-white/30 text-sm mt-1">{u.forever}</div>
            </div>
            <ul className="space-y-3 mb-8">
              {u.featsFree.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                  <Check className="h-4 w-4 text-white/30 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              className="block text-center border border-white/20 text-white/60 py-3 rounded-xl text-sm hover:border-white/40 hover:text-white transition-colors"
            >
              {u.continueWithFree}
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-violet-500/50 bg-violet-500/10 p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="text-xs font-semibold px-2.5 py-1 gradient-brand text-white rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {u.mostPopular}
              </span>
            </div>
            <div className="mb-6">
              <div className="text-violet-300 text-sm font-medium mb-1">Pro</div>
              <div className="text-4xl font-bold text-white">
                {billingInterval === "monthly" ? "$29" : "$20"}
              </div>
              <div className="text-white/30 text-sm mt-1">
                {billingInterval === "monthly" ? u.perMonth : u.perMonthAnnual}
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {u.featsPro.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white">
                  <Check className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={checkout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 gradient-brand text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
              {loading ? u.redirecting : u.upgradeBtn}
            </button>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-8">{u.footer}</p>
      </div>
    </div>
  );
}
