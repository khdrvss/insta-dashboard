"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Sparkles, ArrowRight, Loader2, Instagram, MapPin, Users, Briefcase } from "lucide-react";

const BRAND_VOICE_OPTIONS = [
  { value: "formal", label: "Formal", desc: "Professional, authoritative" },
  { value: "friendly", label: "Friendly", desc: "Warm, approachable" },
  { value: "bold", label: "Bold", desc: "Direct, confident, punchy" },
  { value: "educational", label: "Educational", desc: "Informative, expert-driven" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    instagramHandle: "",
    niche: "",
    location: "",
    targetAudience: "",
    brandVoice: "friendly",
    productsServices: "",
  });

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch {
      console.error("Onboarding failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="text-white/50">
            Tell us about your business so we can find your competitors and generate
            winning content.
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? "gradient-brand" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Instagram + Niche */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-400" />
              Your Instagram Presence
            </h2>

            <div>
              <label className="block text-sm text-white/70 mb-1.5">
                Instagram Handle
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-medium">
                  @
                </span>
                <input
                  type="text"
                  placeholder="yourhandle"
                  value={form.instagramHandle}
                  onChange={(e) => update("instagramHandle", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1.5">
                Your Niche / Industry
              </label>
              <input
                type="text"
                placeholder='e.g. "construction Tashkent", "fitness coaching", "bakery NYC"'
                value={form.niche}
                onChange={(e) => update("niche", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
              />
              <p className="text-xs text-white/30 mt-1.5">
                Be specific — the more context, the better AI performs
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.niche.trim()}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2: Location + Audience */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-400" />
              Your Market
            </h2>

            <div>
              <label className="block text-sm text-white/70 mb-1.5">
                Location / Target Market
              </label>
              <input
                type="text"
                placeholder='e.g. "Tashkent, Uzbekistan", "United States", "Southeast Asia"'
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1.5">
                Target Audience Description
              </label>
              <textarea
                rows={3}
                placeholder='e.g. "Homeowners aged 30-55 looking to renovate their homes in Tashkent, budget-conscious but quality-driven"'
                value={form.targetAudience}
                onChange={(e) => update("targetAudience", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-white/20 text-white/70 hover:text-white font-medium py-3.5 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.location.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Brand Voice + Products */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-violet-400" />
              Your Brand
            </h2>

            <div>
              <label className="block text-sm text-white/70 mb-3">
                Brand Voice
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BRAND_VOICE_OPTIONS.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => update("brandVoice", value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.brandVoice === value
                        ? "border-violet-500 bg-violet-500/20"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="font-medium text-white text-sm">{label}</div>
                    <div className="text-white/40 text-xs mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1.5 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Products / Services Offered
              </label>
              <textarea
                rows={3}
                placeholder='e.g. "Construction, renovation, interior design, project management for residential buildings"'
                value={form.productsServices}
                onChange={(e) => update("productsServices", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-white/20 text-white/70 hover:text-white font-medium py-3.5 rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Launch Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
