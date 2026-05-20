import { LucideIcon } from "lucide-react";

type Color = "violet" | "pink" | "orange" | "green" | "blue";

const COLOR_MAP: Record<Color, { icon: string; glow: string; bg: string; border: string }> = {
  violet: { icon: "#a5a3ff", glow: "rgba(109,104,255,0.15)", bg: "rgba(109,104,255,0.1)",  border: "rgba(109,104,255,0.2)" },
  pink:   { icon: "#f472b6", glow: "rgba(236,72,153,0.15)",  bg: "rgba(236,72,153,0.1)",   border: "rgba(236,72,153,0.2)" },
  orange: { icon: "#fb923c", glow: "rgba(249,115,22,0.15)",  bg: "rgba(249,115,22,0.1)",   border: "rgba(249,115,22,0.2)" },
  green:  { icon: "#34d399", glow: "rgba(16,185,129,0.15)",  bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.2)" },
  blue:   { icon: "#60a5fa", glow: "rgba(59,130,246,0.15)",  bg: "rgba(59,130,246,0.1)",   border: "rgba(59,130,246,0.2)" },
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
  const c = COLOR_MAP[color];
  return (
    <div
      className="rounded-xl p-5 transition-all duration-200 group"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "rgba(0,0,0,0.2) 0px 0px 0px 1px inset, rgba(0,0,0,0.08) 0px 2px 8px",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.035)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
      }}
    >
      <div className="flex items-start justify-between mb-4">
        {/* Icon bubble */}
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            boxShadow: `0 0 12px ${c.glow}`,
          }}
        >
          <Icon size={15} style={{ color: c.icon }} />
        </div>

        {trend && (
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={
              trend.positive
                ? { color: "#34d399", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }
                : { color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }
            }
          >
            {trend.positive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>

      {/* Value */}
      <div
        className="text-2xl font-bold mb-1"
        style={{ color: "#f7f8f8", letterSpacing: "-0.03em" }}
      >
        {value}
      </div>

      {/* Label */}
      <div className="text-[13px]" style={{ color: "#8a8f98" }}>{label}</div>

      {/* Subtext */}
      {subtext && (
        <div className="text-[11px] mt-0.5" style={{ color: "#62666d" }}>{subtext}</div>
      )}
    </div>
  );
}
