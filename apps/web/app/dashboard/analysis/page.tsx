import { BarChart3, AlertCircle, PlayCircle } from "lucide-react";

export const metadata = { title: "Analysis" };

export default function AnalysisPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Content Analysis</h1>
        <p className="text-white/50 mt-1">
          Deep dive into competitor performance — engagement trends, formats, and
          winning hooks
        </p>
      </div>

      {/* Compliance badge */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
        <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-200/70">
          <span className="font-medium text-blue-300">AI-estimated data: </span>
          All engagement metrics shown below are estimated by AI analysis of publicly
          available signals. They are not official Instagram statistics and should be
          used for directional insight only.
        </p>
      </div>

      {/* Placeholder panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Competitor comparison table placeholder */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold text-white mb-1">Competitor Comparison</h2>
          <p className="text-white/40 text-sm mb-6">
            Side-by-side metrics across all confirmed competitors
          </p>
          <EmptyAnalysisPlaceholder
            icon={BarChart3}
            title="No analysis data yet"
            desc="Confirm competitors and run the content analysis engine to see engagement comparisons."
          />
        </div>

        {/* AI Summary card placeholder */}
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6">
          <h2 className="font-semibold text-white mb-1">AI Niche Summary</h2>
          <p className="text-white/40 text-sm mb-6">
            Top 5 winning patterns in your niche
          </p>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
          <p className="text-white/20 text-xs mt-4 text-center">
            Run analysis to unlock
          </p>
        </div>
      </div>

      {/* Charts row placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartPlaceholder title="Engagement Trend Over Time" />
        <ChartPlaceholder title="Content Format Breakdown" />
      </div>

      {/* Top content gallery */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold text-white mb-1">Top Performing Content</h2>
        <p className="text-white/40 text-sm mb-6">
          Highest-engagement posts across all tracked competitors
        </p>
        <EmptyAnalysisPlaceholder
          icon={PlayCircle}
          title="No content analyzed yet"
          desc="Confirm competitors then run content analysis. We'll identify the top 10% of posts by engagement score."
        />
      </div>
    </div>
  );
}

function EmptyAnalysisPlaceholder({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-white/20" />
      </div>
      <p className="text-white/50 font-medium text-sm">{title}</p>
      <p className="text-white/25 text-xs mt-1 max-w-xs">{desc}</p>
    </div>
  );
}

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="font-semibold text-white mb-4">{title}</h3>
      <div className="h-48 flex items-end gap-2 px-2">
        {[40, 65, 45, 80, 55, 90, 70, 50, 75, 60, 85, 45].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-white/5"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <p className="text-white/20 text-xs mt-4 text-center">
        Run analysis to populate chart
      </p>
    </div>
  );
}
