"use client";

interface Props {
  selected: string;
  onChange: (period: string) => void;
}

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
];

export function PeriodSelector({ selected, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selected === p.key
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function periodToRange(period: string): { from: Date; to: Date; resolution: "hourly" | "daily" } {
  const now = new Date();
  const to = now;
  switch (period) {
    case "7d":
      return { from: new Date(now.getTime() - 7 * 86_400_000), to, resolution: "hourly" };
    case "30d":
      return { from: new Date(now.getTime() - 30 * 86_400_000), to, resolution: "daily" };
    default: // today
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return { from: startOfDay, to, resolution: "hourly" };
  }
}
