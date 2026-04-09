"use client";

import { formatPower } from "@/lib/formatters";

interface Props {
  label: string;
  value: number;
  max: number;
  color: string;
}

export function PowerBar({ label, value, max, color }: Props) {
  const pct = Math.min(100, (Math.abs(value) / max) * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium">{formatPower(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
