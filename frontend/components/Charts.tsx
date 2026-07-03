"use client";

// components/Charts.tsx
// Dashboard charts: Status Pie Chart + Revenue Bar Chart using Recharts.

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DashboardStats } from "@/types";
import { formatUSD } from "@/lib/utils";

const STATUS_COLORS = {
  Pending: "#f59e0b",
  Processing: "#3b82f6",
  Completed: "#10b981",
  Cancelled: "#ef4444",
};

interface ChartsProps {
  stats: DashboardStats;
}

export function StatusPieChart({ stats }: ChartsProps) {
  const data = [
    { name: "Pending", value: stats.pending, color: STATUS_COLORS.Pending },
    { name: "Processing", value: stats.processing, color: STATUS_COLORS.Processing },
    { name: "Completed", value: stats.completed, color: STATUS_COLORS.Completed },
    { name: "Cancelled", value: stats.cancelled, color: STATUS_COLORS.Cancelled },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No order data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={entry.color}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#1f2937",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "12px",
          }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: "#9ca3af", fontSize: 12 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RevenueBarChart({ stats }: ChartsProps) {
  const data = [
    {
      name: "Revenue (INR)",
      value: stats.total_revenue_inr,
      fill: "#8b5cf6",
    },
    {
      name: "Revenue (USD)",
      value: stats.total_revenue_usd,
      fill: "#06b6d4",
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={40}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="name"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
          }
        />
        <Tooltip
          contentStyle={{
            background: "#1f2937",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "12px",
          }}
          formatter={(value) => [
            typeof value === "number"
              ? value.toLocaleString("en-IN", { maximumFractionDigits: 2 })
              : String(value),
            "",
          ]}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
