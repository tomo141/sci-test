"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ScoreHistoryChart() {
  const data = [
    { date: "4/10", score: 520 },
    { date: "4/17", score: 610 },
    { date: "4/24", score: 580 },
    { date: "5/1", score: 625 },
    { date: "5/8", score: 700 },
    { date: "5/22", score: 730 },
    { date: "6/12", score: 763 }
  ];
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 0, right: 16, top: 16, bottom: 0 }}>
          <CartesianGrid stroke="#D8E5FA" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: "#334765", fontSize: 12 }} />
          <YAxis domain={[0, 1000]} tick={{ fill: "#334765", fontSize: 12 }} />
          <Tooltip />
          <Line dataKey="score" stroke="#1558D6" strokeWidth={3} dot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
