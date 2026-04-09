"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { HistoryPoint } from "@/hooks/use-energy-query";
import { formatPower } from "@/lib/formatters";

interface Props {
  data: HistoryPoint[];
  resolution: "hourly" | "daily";
}

function formatTime(isoString: string, resolution: "hourly" | "daily"): string {
  const d = new Date(isoString);
  if (resolution === "daily") {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-lg text-sm">
      <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-medium">{formatPower(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function EnergyChart({ data, resolution }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatTime(d.time, resolution),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={formatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.3} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "var(--chart-axis)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--chart-axis)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatPower(v)}
          width={70}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
        />
        <Area
          type="monotone"
          dataKey="pvPowerW"
          name="Solar"
          stackId="1"
          stroke="#FBBF24"
          fill="#FBBF24"
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="loadPowerW"
          name="House"
          stackId="2"
          stroke="#3B82F6"
          fill="#3B82F6"
          fillOpacity={0.4}
        />
        <Area
          type="monotone"
          dataKey="batteryPowerW"
          name="Battery"
          stackId="3"
          stroke="#22C55E"
          fill="#22C55E"
          fillOpacity={0.4}
        />
        <Area
          type="monotone"
          dataKey="gridPowerW"
          name="Grid"
          stackId="4"
          stroke="#6B7280"
          fill="#6B7280"
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
