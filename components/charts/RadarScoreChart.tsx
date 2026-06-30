"use client";

import type { ComponentProps } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { scoringConfig } from "@/src/lib/scoring/config";

const defaultGridTicks = [25, 50, 75, scoringConfig.domainMaxScore];

export function RadarScoreChart({
  data,
  label,
  maxScore = scoringConfig.maxScore,
  gridTicks = defaultGridTicks
}: {
  data: { name: string; score: number }[];
  label: string;
  maxScore?: number;
  gridTicks?: number[];
}) {
  const ticks = gridTicks.filter((tick) => tick > 0 && tick <= maxScore);

  return (
    <div className="h-72 w-full" aria-label={label}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#D8E5FA" gridType="polygon" />
          <PolarAngleAxis dataKey="name" tick={{ fill: "#11213F", fontSize: 12 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxScore]}
            // Recharts types require TickItem, but runtime accepts numeric tick values.
            ticks={ticks as unknown as ComponentProps<typeof PolarRadiusAxis>["ticks"]}
            allowDecimals={false}
            tick={{ fill: "#6B7B96", fontSize: 10 }}
          />
          <Radar dataKey="score" stroke="#1558D6" fill="#2467E8" fillOpacity={0.18} strokeWidth={3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
