"use client";

import type { LivePower } from "@/hooks/use-live-data";
import { formatPower } from "@/lib/formatters";

interface Props {
  data: LivePower;
}

interface FlowDef {
  id: string;
  path: string;
  color: string;
  getValue: (flows: LivePower["flows"]) => number;
}

const FLOWS: FlowDef[] = [
  {
    id: "solar-house",
    path: "M200,85 C200,120 200,135 200,170",
    color: "#FBBF24",
    getValue: (f) => f.solarToHouseW,
  },
  {
    id: "solar-battery",
    path: "M165,75 C130,100 110,130 80,170",
    color: "#FBBF24",
    getValue: (f) => f.solarToBatteryW,
  },
  {
    id: "solar-grid",
    path: "M235,75 C270,100 290,130 320,170",
    color: "#FBBF24",
    getValue: (f) => f.solarToGridW,
  },
  {
    id: "battery-house",
    path: "M105,220 C130,220 145,215 160,210",
    color: "#22C55E",
    getValue: (f) => f.batteryToHouseW,
  },
  {
    id: "grid-house",
    path: "M295,220 C270,220 255,215 240,210",
    color: "#6B7280",
    getValue: (f) => f.gridToHouseW,
  },
  {
    id: "grid-battery",
    path: "M300,240 C250,260 150,260 100,240",
    color: "#6B7280",
    getValue: (f) => f.gridToBatteryW,
  },
  {
    id: "battery-grid",
    path: "M100,250 C150,270 250,270 300,250",
    color: "#22C55E",
    getValue: (f) => f.batteryToGridW,
  },
];

function AnimatedDots({ pathId, color, watts }: { pathId: string; color: string; watts: number }) {
  // Faster dots for higher power
  const dur = Math.max(1.2, 3.5 - (watts / 2000));
  return (
    <>
      {[0, dur / 3, (dur * 2) / 3].map((delay, i) => (
        <circle key={i} r="4" fill={color} opacity="0.9">
          <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite">
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      ))}
    </>
  );
}

export function PowerFlow({ data }: Props) {
  const { flows } = data;

  return (
    <div className="relative w-full max-w-lg mx-auto aspect-square">
      <svg viewBox="0 0 400 320" className="w-full h-full">
        <defs>
          {FLOWS.map((f) => (
            <path key={f.id} id={f.id} d={f.path} />
          ))}
        </defs>

        {/* Flow paths + animated dots */}
        {FLOWS.map((f) => {
          const watts = f.getValue(flows);
          if (watts <= 0) return null;
          return (
            <g key={f.id}>
              <use href={`#${f.id}`} stroke={f.color} strokeWidth="2" fill="none" opacity="0.4" />
              <AnimatedDots pathId={f.id} color={f.color} watts={watts} />
            </g>
          );
        })}

        {/* Solar (top center) */}
        <g transform="translate(200, 40)">
          <circle r="42" fill="#FBBF24" opacity="0.15" />
          <circle r="35" fill="#FBBF24" />
          <text textAnchor="middle" y="5" fill="white" fontSize="13" fontWeight="bold">
            {formatPower(data.pvPowerW)}
          </text>
          <text textAnchor="middle" y="-50" className="fill-current" fontSize="12" fontWeight="500">Solar</text>
        </g>

        {/* Battery (bottom left) */}
        <g transform="translate(65, 220)">
          <rect x="-38" y="-28" width="76" height="56" rx="10" fill="#22C55E" opacity="0.15" />
          <rect x="-32" y="-22" width="64" height="44" rx="8" fill="#22C55E" />
          <text textAnchor="middle" y="-4" fill="white" fontSize="12" fontWeight="bold">
            {data.batterySoc}%
          </text>
          <text textAnchor="middle" y="12" fill="white" fontSize="9" opacity="0.9">
            {formatPower(data.batteryPowerW)}
          </text>
          <text textAnchor="middle" y="-38" className="fill-current" fontSize="12" fontWeight="500">Battery</text>
        </g>

        {/* House (bottom center) */}
        <g transform="translate(200, 210)">
          <rect x="-38" y="-28" width="76" height="56" rx="10" fill="#3B82F6" opacity="0.15" />
          <rect x="-32" y="-22" width="64" height="44" rx="8" fill="#3B82F6" />
          <text textAnchor="middle" y="5" fill="white" fontSize="13" fontWeight="bold">
            {formatPower(data.loadPowerW)}
          </text>
          <text textAnchor="middle" y="-38" className="fill-current" fontSize="12" fontWeight="500">House</text>
        </g>

        {/* Grid (bottom right) */}
        <g transform="translate(335, 220)">
          <rect x="-38" y="-28" width="76" height="56" rx="10" fill="#6B7280" opacity="0.15" />
          <rect x="-32" y="-22" width="64" height="44" rx="8" fill="#6B7280" />
          <text textAnchor="middle" y="5" fill="white" fontSize="13" fontWeight="bold">
            {formatPower(Math.abs(data.gridPowerW))}
          </text>
          <text textAnchor="middle" y="-38" className="fill-current" fontSize="12" fontWeight="500">Grid</text>
        </g>
      </svg>
    </div>
  );
}
