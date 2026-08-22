"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

type Datum = { label: string; count: number };

export function DistortionsChart({ data }: { data: Datum[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#263149" strokeDasharray="3 4" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={150}
          tick={{ fill: "#9aa7bd", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(95,143,240,0.08)" }}
          contentStyle={{
            background: "#16213a",
            border: "1px solid #263149",
            borderRadius: 10,
            fontSize: 12,
            color: "#eef2f8",
          }}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
          {data.map((_, i) => (
            <Cell key={i} fill="#5f8ff0" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
