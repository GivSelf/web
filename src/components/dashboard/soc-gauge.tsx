"use client";

interface Props {
  soc: number;
  capacityKwh?: number;
}

export function SocGauge({ soc, capacityKwh }: Props) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = (soc / 100) * circumference;
  const color = soc > 50 ? "text-green-500" : soc > 20 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle
          cx="80" cy="80" r={radius}
          fill="none" strokeWidth="12"
          className="stroke-gray-200 dark:stroke-gray-700"
        />
        <circle
          cx="80" cy="80" r={radius}
          fill="none" strokeWidth="12"
          className={`${color} stroke-current`}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          transform="rotate(-90 80 80)"
        />
        <text x="80" y="75" textAnchor="middle" className="fill-current text-2xl font-bold">
          {Math.round(soc)}%
        </text>
        {capacityKwh !== undefined && (
          <text x="80" y="95" textAnchor="middle" className="fill-gray-500 text-xs">
            {capacityKwh.toFixed(1)} kWh
          </text>
        )}
      </svg>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Battery</span>
    </div>
  );
}
