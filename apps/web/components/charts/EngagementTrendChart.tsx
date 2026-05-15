"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface DataPoint {
  week: string;
  avg_engagement: number;
  top_competitor?: number;
}

interface Props {
  data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1117]/95 backdrop-blur-sm p-3 text-sm shadow-xl">
      <p className="text-white/50 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="font-semibold text-white">{p.value?.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

export function EngagementTrendChart({ data }: Props) {
  const hasTopCompetitor = data.some((d) => d.top_competitor !== undefined);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="week"
          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        {hasTopCompetitor && (
          <Legend
            wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}
          />
        )}
        <Line
          type="monotone"
          dataKey="avg_engagement"
          name="Avg competitor ER"
          stroke="#7C3AED"
          strokeWidth={2}
          dot={{ fill: "#7C3AED", r: 3 }}
          activeDot={{ r: 5 }}
        />
        {hasTopCompetitor && (
          <Line
            type="monotone"
            dataKey="top_competitor"
            name="Top competitor ER"
            stroke="#EC4899"
            strokeWidth={2}
            strokeDasharray="4 2"
            dot={{ fill: "#EC4899", r: 3 }}
            activeDot={{ r: 5 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
