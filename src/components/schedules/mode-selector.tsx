"use client";

const MODES = [
  { value: 1, label: "ECO", description: "Discharge to match demand only" },
  { value: 2, label: "Timed Demand", description: "Discharge during scheduled slots" },
  { value: 3, label: "Timed Export", description: "Export excess to grid" },
];

interface Props {
  value: number;
  onChange: (mode: number) => void;
}

export function ModeSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Battery Mode</label>
      <div className="grid grid-cols-3 gap-2">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={`p-3 rounded-lg border text-left transition-colors ${
              value === mode.value
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <p className="font-medium text-sm">{mode.label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{mode.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
