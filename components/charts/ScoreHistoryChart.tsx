"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { scoringConfig } from "@/src/lib/scoring/config";

type Props = {
  data: { date: string; score: number }[];
};

export function ScoreHistoryChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="grid h-72 place-items-center rounded-2xl bg-[var(--color-primary-50)] p-4 text-center text-sm font-bold leading-7 text-[var(--color-ink-soft)]">
        結果を保存すると、スコア履歴がここに表示されます。
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 0, right: 16, top: 16, bottom: 0 }}>
          <CartesianGrid stroke="#D8E5FA" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: "#334765", fontSize: 12 }} />
          <YAxis domain={[0, scoringConfig.maxScore]} tick={{ fill: "#334765", fontSize: 12 }} />
          <Tooltip />
          <Line dataKey="score" stroke="#1558D6" strokeWidth={3} dot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
