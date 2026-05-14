import { LucideIcon } from "lucide-react";

type Color = "violet" | "pink" | "orange" | "green" | "blue";

const COLOR_MAP: Record<Color, { icon: string; bg: string; border: string }> = {
  violet: {
    icon: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  pink: {
    icon: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
  },
  orange: {
    icon: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  green: {
    icon: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  blue: {
    icon: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
};

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color: Color;
  trend?: { value: number; positive: boolean };
}

export function StatCard({ label, value, subtext, icon: Icon, color, trend }: StatCardProps) {
  const colors = COLOR_MAP[color];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`h-9 w-9 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}
        >
          <Icon className={`h-4.5 w-4.5 ${colors.icon}`} size={18} />
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trend.positive
                ? "text-green-400 bg-green-500/10"
                : "text-red-400 bg-red-500/10"
            }`}
          >
            {trend.positive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/50">{label}</div>
      {subtext && <div className="text-xs text-white/25 mt-0.5">{subtext}</div>}
    </div>
  );
}
