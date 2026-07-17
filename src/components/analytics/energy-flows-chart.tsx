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

function CustomTooltip({ active, payload, label, unit = "kWh" }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; dataKey?: string }>; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="charttip">
      <p className="muted" style={{ marginBottom: 4 }}>{label}</p>
      {payload.filter(e => e.value > 0).map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="num" style={{ fontWeight: 600, marginLeft: 16 }}>
            {entry.dataKey?.startsWith("fc")
              ? `${entry.value.toFixed(2)} kW`
              : `${entry.value.toFixed(2)} ${unit}`}
          </span>
        </div>
      ))}
    </div>
  );
}

// One line per forecast source. Preferred order + colours; unknown sources fall
// back to a neutral grey.
const FORECAST_SOURCES: Record<string, { name: string; color: string }> = {
  solcast: { name: "Solcast", color: "#F59E0B" },
  "forecast.solar": { name: "Forecast.Solar", color: "#8B5CF6" },
};
const SOURCE_ORDER = ["solcast", "forecast.solar"];
const sourceMeta = (src: string) => FORECAST_SOURCES[src] ?? { name: src, color: "#9CA3AF" };

/** Map HH:MM → kW for a single source's points (no cross-slot fill; gaps are
 *  bridged by the line's connectNulls). */
function buildForecastMap(points: ForecastPoint[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const f of points) {
    const spaceIdx = f.periodEnd.indexOf(" ");
    if (spaceIdx < 0) continue;
    map.set(f.periodEnd.slice(spaceIdx + 1, spaceIdx + 6), f.pvEstimateKw);
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

type Row = Record<string, string | number | null>;

export function EnergyFlowsChart({ data, perspective, grouping, forecast = [] }: Props) {
  const visibleFlows = PERSPECTIVES[perspective] || PERSPECTIVES.home;
  const hasForecast = forecast.length > 0 && grouping === "half-hourly";

  // One series per source, so the two providers draw separate lines instead of
  // interleaving slot-by-slot into a zig-zag. Preferred order first.
  const sources = hasForecast
    ? Array.from(new Set(forecast.map((f) => f.source))).sort(
        (a, b) => ((SOURCE_ORDER.indexOf(a) + 1) || 99) - ((SOURCE_ORDER.indexOf(b) + 1) || 99),
      )
    : [];
  const sourceMaps = sources.map((src) => buildForecastMap(forecast.filter((f) => f.source === src)));

  // Half-hourly shows average POWER (kW), like the GivEnergy app: a 30-min bucket
  // holding X kWh averaged over 0.5 h is 2·X kW. Daily/monthly stay kWh totals
  // (an average power over a whole day/month wouldn't be meaningful here).
  const isPower = grouping === "half-hourly";
  const scale = isPower ? 2 : 1;
  const unit = isPower ? "kW" : "kWh";
  const scaleBar = (d: FlowBar) => ({
    pvToHome: d.pvToHome * scale,
    pvToBattery: d.pvToBattery * scale,
    pvToGrid: d.pvToGrid * scale,
    gridToHome: d.gridToHome * scale,
    gridToBattery: d.gridToBattery * scale,
    batteryToHome: d.batteryToHome * scale,
    batteryToGrid: d.batteryToGrid * scale,
  });
  // Forecast values are already in kW and only overlay the half-hourly (kW) view.
  const forecastAt = (hhmm: string): Row => {
    const row: Row = {};
    sourceMaps.forEach((m, i) => { row[`fc${i}`] = m.get(hhmm) ?? null; });
    return row;
  };

  const formatted: Row[] = data.map((d) => ({
    start: d.start, end: d.end, label: formatTime(d.start, grouping),
    ...scaleBar(d), ...forecastAt(barToHHMM(d.start)),
  }));

  // Pad to full 48 half-hour slots if half-hourly and we have forecast data
  if (hasForecast && grouping === "half-hourly" && formatted.length < 48) {
    const existingLabels = new Set(formatted.map((f) => f.label));
    const zeroBar = scaleBar({ start: "", end: "", pvToHome: 0, pvToBattery: 0, pvToGrid: 0, gridToHome: 0, gridToBattery: 0, batteryToHome: 0, batteryToGrid: 0 });
    for (let i = 0; i < 48; i++) {
      const hh = Math.floor(i / 2).toString().padStart(2, "0");
      const mm = (i % 2) * 30 === 0 ? "00" : "30";
      const label = `${hh}:${mm}`;
      if (!existingLabels.has(label)) {
        formatted.push({ start: "", end: "", label, ...zeroBar, ...forecastAt(label) });
      }
    }
    formatted.sort((a, b) => String(a.label).localeCompare(String(b.label)));
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
          label={{ value: unit, angle: -90, position: "insideLeft", style: { fill: "var(--chart-axis)", fontSize: 12 } }}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
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
        {sources.map((src, i) => (
          <Line
            key={src}
            dataKey={`fc${i}`}
            name={`${sourceMeta(src).name} forecast`}
            type="monotone"
            stroke={sourceMeta(src).color}
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            connectNulls
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
