"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatDate } from "@/lib/utils";

type Point = { mood_score: number; created_at: string };

export function MoodTrendChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--fg-muted)]">Sem check-ins registrados ainda.</p>;
  }

  const chartData = data.map((d) => ({
    date: d.created_at,
    label: formatDate(d.created_at),
    score: d.mood_score,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6be675" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#6be675" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#263149" strokeDasharray="3 4" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#9aa7bd", fontSize: 11 }}
          axisLine={{ stroke: "#263149" }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fill: "#9aa7bd", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={24}
        />
        <Tooltip
          contentStyle={{
            background: "#16213a",
            border: "1px solid #263149",
            borderRadius: 10,
            fontSize: 12,
            color: "#eef2f8",
          }}
          labelStyle={{ color: "#9aa7bd" }}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#6be675"
          strokeWidth={2}
          fill="url(#moodFill)"
          dot={{ r: 3, fill: "#6be675", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
