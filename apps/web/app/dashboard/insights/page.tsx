import { Lightbulb, AlertCircle, Music, Hash, Zap, Clock } from "lucide-react";

export const metadata = { title: "Content Insights" };

const MOCK_POWER_PHRASES = [
  "Before & After", "Watch till the end", "Swipe to see",
  "POV:", "This changed everything", "Nobody talks about this",
  "Day in the life", "Real talk:", "Finally figured out",
];

export default function InsightsPage() {
  const useMockData = process.env.USE_MOCK_DATA === "true";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Content Insights</h1>
        <p className="text-white/50 mt-1">
          Extracted patterns, power words, and winning formulas from your niche
        </p>
      </div>

      {/* Compliance note */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
        <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200/70">
          <span className="font-medium text-amber-300">AI-estimated metrics: </span>
          All patterns and insights are derived by AI analysis of publicly available
          content. These are directional signals, not official platform data.
        </p>
      </div>

      {/* Mock data sample (visible when USE_MOCK_DATA=true) */}
      {useMockData && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-sm text-green-300 inline-flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Mock data mode — sample insights shown
        </div>
      )}

      {/* Insights grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hook patterns */}
        <InsightCard
          icon={Zap}
          title="Hook Patterns"
          color="violet"
          empty={!useMockData}
          emptyText="Run competitor analysis to unlock hook intelligence"
        >
          {useMockData && (
            <div className="space-y-3">
              {[
                { type: "Question Hook", score: 87, example: '"Did you know your renovation could cost 40% less?"' },
                { type: "Shock/Stat Hook", score: 82, example: '"90% of clients regret not doing this first"' },
                { type: "Promise Hook", score: 78, example: '"I\'ll show you how to build for half the price"' },
                { type: "Story Hook", score: 71, example: '"We almost lost this project on day 3..."' },
              ].map(({ type, score, example }) => (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white font-medium">{type}</span>
                    <span className="text-violet-400">{score}/100</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full">
                    <div
                      className="h-full rounded-full gradient-brand"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/30">{example}</p>
                </div>
              ))}
            </div>
          )}
        </InsightCard>

        {/* Pacing styles */}
        <InsightCard
          icon={Clock}
          title="Best Pacing Styles"
          color="pink"
          empty={!useMockData}
          emptyText="Run competitor analysis to see pacing breakdown"
        >
          {useMockData && (
            <div className="space-y-3">
              {[
                { style: "Talking Head", pct: 45, desc: "Direct to camera, builds trust" },
                { style: "B-Roll + VO", pct: 30, desc: "Visuals with voiceover narration" },
                { style: "Fast Cut", pct: 15, desc: "High-energy, < 2s per clip" },
                { style: "Text Only", pct: 10, desc: "Minimal, message-first" },
              ].map(({ style, pct, desc }) => (
                <div key={style} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-xs font-bold text-pink-300 flex-shrink-0">
                    {pct}%
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{style}</div>
                    <div className="text-xs text-white/30">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </InsightCard>

        {/* Power words */}
        <InsightCard
          icon={Hash}
          title="Power Words & Phrases"
          color="orange"
          empty={!useMockData}
          emptyText="Analyze competitors to extract their most engaging phrases"
        >
          {useMockData && (
            <div className="flex flex-wrap gap-2">
              {MOCK_POWER_PHRASES.map((phrase) => (
                <span
                  key={phrase}
                  className="px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-300 text-sm"
                >
                  {phrase}
                </span>
              ))}
            </div>
          )}
        </InsightCard>

        {/* Trending audio */}
        <InsightCard
          icon={Music}
          title="Trending Audio Categories"
          color="green"
          empty={!useMockData}
          emptyText="Run video analysis to detect trending audio patterns"
        >
          {useMockData && (
            <div className="space-y-2">
              {[
                { name: "Upbeat instrumental", freq: "38% of top posts" },
                { name: "Trending viral sounds", freq: "27% of top posts" },
                { name: "Voiceover only", freq: "20% of top posts" },
                { name: "Motivational speech clips", freq: "15% of top posts" },
              ].map(({ name, freq }) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Music className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-sm text-white">{name}</span>
                  </div>
                  <span className="text-xs text-white/40">{freq}</span>
                </div>
              ))}
            </div>
          )}
        </InsightCard>
      </div>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  color,
  children,
  empty,
  emptyText,
}: {
  icon: React.ElementType;
  title: string;
  color: "violet" | "pink" | "orange" | "green";
  children?: React.ReactNode;
  empty?: boolean;
  emptyText?: string;
}) {
  const colorMap = {
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    pink: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className={`h-8 w-8 rounded-lg ${colorMap[color]} flex items-center justify-center`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      {empty ? (
        <div className="py-8 text-center">
          <Lightbulb className="h-8 w-8 text-white/10 mx-auto mb-3" />
          <p className="text-white/25 text-sm">{emptyText}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
