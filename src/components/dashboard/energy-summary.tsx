"use client";

import type { LiveEnergy } from "@/hooks/use-live-data";
import { formatEnergy } from "@/lib/formatters";

interface Props {
  data: LiveEnergy;
}

export function EnergySummary({ data }: Props) {
  const items = [
    { label: "Solar Generation", value: data.pvGenerationKwh, color: "text-yellow-500" },
    { label: "Grid Import", value: data.gridImportKwh, color: "text-red-500" },
    { label: "Grid Export", value: data.gridExportKwh, color: "text-green-500" },
    { label: "Battery Charge", value: data.batteryChargeKwh, color: "text-blue-500" },
    { label: "Battery Discharge", value: data.batteryDischargeKwh, color: "text-orange-500" },
    { label: "Consumption", value: data.consumptionKwh, color: "text-purple-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
          <p className={`text-lg font-semibold ${item.color}`}>{formatEnergy(item.value)}</p>
        </div>
      ))}
    </div>
  );
}
