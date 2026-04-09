"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { FlowSummary } from "@/hooks/use-energy-flows";

interface Props {
  summary: FlowSummary;
  perspective: string;
}

const FLOW_COLORS: Record<string, { label: string; color: string }> = {
  pvToHome: { label: "Solar to Home", color: "#FBBF24" },
  pvToBattery: { label: "Solar to Battery", color: "#A3E635" },
  pvToGrid: { label: "Solar to Grid", color: "#FB923C" },
  gridToHome: { label: "Grid to Home", color: "#EF4444" },
  gridToBattery: { label: "Grid to Battery", color: "#60A5FA" },
  batteryToHome: { label: "Battery to Home", color: "#22C55E" },
  batteryToGrid: { label: "Battery to Grid", color: "#14B8A6" },
};

const PERSPECTIVES: Record<string, string[]> = {
  home: ["pvToHome", "gridToHome", "batteryToHome"],
  solar: ["pvToHome", "pvToBattery", "pvToGrid"],
  battery: ["pvToBattery", "gridToBattery", "batteryToHome", "batteryToGrid"],
  all: Object.keys(FLOW_COLORS),
};

export function EnergyPieChart({ summary, perspective }: Props) {
  const keys = PERSPECTIVES[perspective] || PERSPECTIVES.home;
  const entries = keys
    .map((key) => ({
      name: FLOW_COLORS[key].label,
      value: Math.round((summary[key as keyof FlowSummary] as number) * 100) / 100,
      color: FLOW_COLORS[key].color,
    }))
    .filter((e) => e.value > 0);

  const total = entries.reduce((sum, e) => sum + e.value, 0);

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={entries}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
            paddingAngle={2}
          >
            {entries.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `${Number(value).toFixed(2)} kWh`}
            contentStyle={{
              backgroundColor: "var(--tooltip-bg, rgba(17,24,39,0.95))",
              border: "1px solid var(--tooltip-border, #374151)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--tooltip-text, #F8FAFC)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center total */}
      <div className="-mt-[165px] mb-[115px] text-center pointer-events-none">
        <p className="text-2xl font-bold">{total.toFixed(1)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">kWh</p>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs mt-2">
        {entries.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
            <span className="font-medium ml-auto">{entry.value.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
