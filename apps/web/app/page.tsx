import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, BarChart3, Brain, Sparkles, TrendingUp, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">InstaIntel</span>
          </div>
          <div className="flex items-center gap-3">
            <SignedOut>
              <Link
                href="/sign-in"
                className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Get started free
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Go to Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 mb-8">
          <Zap className="h-3.5 w-3.5" />
          Powered by Claude AI + Gemini + Whisper
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          <span className="gradient-brand-text">Tell me your niche.</span>
          <br />
          <span className="text-white">I'll find who's winning.</span>
        </h1>

        <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          Automatically discover competitors, deeply analyze their top-performing content,
          extract winning creative frameworks, and generate original, high-converting
          scripts for Reels and Meta Ads.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <SignedOut>
            <Link
              href="/sign-up"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-xl transition-colors font-semibold text-lg"
            >
              Start for free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/sign-in"
              className="text-white/60 hover:text-white px-8 py-4 transition-colors"
            >
              Already have an account?
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-xl transition-colors font-semibold text-lg"
            >
              Open Dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>
          </SignedIn>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: TrendingUp,
              title: "Competitor Discovery",
              description:
                "Automatically finds 10–20 competitors in your niche using hashtag search and Meta Ad Library. AI scores their relevance so you focus on what matters.",
              color: "text-violet-400",
              bg: "bg-violet-500/10 border-violet-500/20",
            },
            {
              icon: Brain,
              title: "Deep Content Analysis",
              description:
                "Whisper transcribes competitor Reels, Gemini analyzes visual pacing and hooks, Claude extracts winning patterns. All AI-estimated and clearly labeled.",
              color: "text-pink-400",
              bg: "bg-pink-500/10 border-pink-500/20",
            },
            {
              icon: BarChart3,
              title: "Script Generation",
              description:
                "RAG pipeline retrieves top-performing patterns for your niche and generates 3 original script variations per request, ready for immediate production.",
              color: "text-orange-400",
              bg: "bg-orange-500/10 border-orange-500/20",
            },
          ].map(({ icon: Icon, title, description, color, bg }) => (
            <div
              key={title}
              className={`rounded-2xl border p-6 ${bg} backdrop-blur-sm`}
            >
              <div className={`mb-4 ${color}`}>
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-white">{title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-white/30">
        <p>
          All competitor metrics are AI-estimated based on public signals. Not affiliated
          with Meta or Instagram. &copy; {new Date().getFullYear()} InstaIntel.
        </p>
      </footer>
    </div>
  );
}
