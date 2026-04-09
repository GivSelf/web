"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { FlowBar, ForecastPoint } from "@/hooks/use-energy-flows";

interface Props {
  data: FlowBar[];
  perspective: string;
  grouping?: string;
  forecast?: ForecastPoint[];
}

function formatTime(timeStr: string, grouping?: string): string {
  if (!timeStr) return "";
  const d = new Date(timeStr.includes("T") ? timeStr : timeStr + "Z");
  if (isNaN(d.getTime())) {
    const parts = timeStr.split(" ");
    return parts[1] || parts[0];
  }
  if (grouping === "monthly") {
    return d.toLocaleDateString("en-GB", { month: "short" });
  }
  if (grouping === "daily") {
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
  }
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const FLOW_DEFS = {
  pvToHome: { name: "Solar to Home", color: "#FBBF24" },
  pvToBattery: { name: "Solar to Battery", color: "#A3E635" },
  pvToGrid: { name: "Solar to Grid", color: "#FB923C" },
  gridToHome: { name: "Grid to Home", color: "#EF4444" },
  gridToBattery: { name: "Grid to Battery", color: "#60A5FA" },
  batteryToHome: { name: "Battery to Home", color: "#22C55E" },
  batteryToGrid: { name: "Battery to Grid", color: "#14B8A6" },
} as const;

type FlowKey = keyof typeof FLOW_DEFS;

const PERSPECTIVES: Record<string, FlowKey[]> = {
  home: ["pvToHome", "gridToHome", "batteryToHome"],
  solar: ["pvToHome", "pvToBattery", "pvToGrid"],
  battery: ["pvToBattery", "gridToBattery", "batteryToHome", "batteryToGrid"],
  all: Object.keys(FLOW_DEFS) as FlowKey[],
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; dataKey?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-lg text-sm">
      <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      {payload.filter(e => e.value > 0).map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-medium">
            {entry.dataKey === "forecastKwh"
              ? `${entry.value.toFixed(2)} kW (forecast)`
              : `${entry.value.toFixed(2)} kWh`}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Build a forecast lookup map: HH:MM → kWh value */
function buildForecastMap(forecast: ForecastPoint[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const f of forecast) {
    // Extract HH:MM directly from string — no Date parsing needed
    // Forecast: "2026-04-09 08:00:00+00" → "08:00"
    // Both forecast and bars use the same local hour in the string
    const spaceIdx = f.periodEnd.indexOf(" ");
    if (spaceIdx < 0) continue;
    const hhmm = f.periodEnd.slice(spaceIdx + 1, spaceIdx + 6);
    map.set(hhmm, f.pvEstimateKw);
    if (hhmm.endsWith(":00")) {
      map.set(hhmm.replace(":00", ":30"), f.pvEstimateKw);
    }
  }
  return map;
}

/** Extract HH:MM from a bar's start time (local time, no timezone) */
function barToHHMM(startTime: string): string {
  // Bar times are local: "2026-04-09 14:00" or "2026-04-09T14:00:00.000Z"
  // For plain format, just extract the time part directly
  const spaceIdx = startTime.indexOf(" ");
  if (spaceIdx >= 0) return startTime.slice(spaceIdx + 1, spaceIdx + 6);
  const tIdx = startTime.indexOf("T");
  if (tIdx >= 0) return startTime.slice(tIdx + 1, tIdx + 6);
  return startTime.slice(0, 5);
}

export function EnergyFlowsChart({ data, perspective, grouping, forecast = [] }: Props) {
  const visibleFlows = PERSPECTIVES[perspective] || PERSPECTIVES.home;
  const forecastMap = buildForecastMap(forecast);
  const hasForecast = forecast.length > 0 && grouping === "half-hourly";

  // Build data points from actual bars
  const formatted = data.map((d) => {
    const label = formatTime(d.start, grouping);
    const hhmm = barToHHMM(d.start);
    const forecastKw = hasForecast ? (forecastMap.get(hhmm) ?? null) : null;
    return {
      ...d,
      label,
      forecastKwh: forecastKw !== null ? forecastKw / 2 : null,
    };
  });

  // Pad to full 48 half-hour slots if half-hourly and we have forecast data
  if (hasForecast && grouping === "half-hourly" && formatted.length < 48) {
    const existingLabels = new Set(formatted.map((f) => f.label));
    for (let i = 0; i < 48; i++) {
      const hh = Math.floor(i / 2).toString().padStart(2, "0");
      const mm = (i % 2) * 30 === 0 ? "00" : "30";
      const label = `${hh}:${mm}`;
      if (!existingLabels.has(label)) {
        const hhmm = `${hh}:${mm}`;
        const forecastKw = forecastMap.get(hhmm) ?? null;
        formatted.push({
          start: "", end: "",
          pvToHome: 0, pvToBattery: 0, pvToGrid: 0,
          gridToHome: 0, gridToBattery: 0,
          batteryToHome: 0, batteryToGrid: 0,
          label,
          forecastKwh: forecastKw !== null ? forecastKw / 2 : null,
        });
      }
    }
    // Sort by label to maintain time order
    formatted.sort((a, b) => a.label.localeCompare(b.label));
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={formatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "var(--chart-axis)" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--chart-axis)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v.toFixed(1)}`}
          width={50}
          label={{ value: "kWh", angle: -90, position: "insideLeft", style: { fill: "var(--chart-axis)", fontSize: 12 } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
        {visibleFlows.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            name={FLOW_DEFS[key].name}
            stackId="stack"
            fill={FLOW_DEFS[key].color}
          />
        ))}
        {hasForecast && (
          <Line
            dataKey="forecastKwh"
            name="Solar Forecast"
            type="monotone"
            stroke="#FBBF24"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            connectNulls
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
