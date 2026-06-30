"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { scoringConfig } from "@/src/lib/scoring/config";

export function RadarScoreChart({ data, label }: { data: { name: string; score: number }[]; label: string }) {
  return (
    <div className="h-72 w-full" aria-label={label}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#D8E5FA" />
          <PolarAngleAxis dataKey="name" tick={{ fill: "#11213F", fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, scoringConfig.maxScore]} tick={{ fill: "#6B7B96", fontSize: 10 }} />
          <Radar dataKey="score" stroke="#1558D6" fill="#2467E8" fillOpacity={0.18} strokeWidth={3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
