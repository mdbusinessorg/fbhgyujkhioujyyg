"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export type MetricPoint = { date: string; value: number; secondary?: number | null };

export function MetricsChart({
  data,
  label,
  color = "#0A74DA",
  secondaryLabel,
}: {
  data: MetricPoint[];
  label: string;
  color?: string;
  secondaryLabel?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-surface text-sm text-body">
        Sem registos de {label.toLowerCase()}.
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7280" }} />
          <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
          />
          <Line type="monotone" dataKey="value" name={label} stroke={color} strokeWidth={2.5} dot={{ r: 3 }} />
          {secondaryLabel && (
            <Line type="monotone" dataKey="secondary" name={secondaryLabel} stroke="#00C48C" strokeWidth={2.5} dot={{ r: 3 }} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
