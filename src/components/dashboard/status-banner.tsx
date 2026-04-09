"use client";

import type { LivePower, LiveEnergy } from "@/hooks/use-live-data";
import { formatPower, formatEnergy } from "@/lib/formatters";

interface Props {
  power: LivePower;
  energy: LiveEnergy | null;
}

interface StatusCard {
  label: string;
  power: number;
  status: string;
  daily: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

function getCards(power: LivePower, energy: LiveEnergy | null): StatusCard[] {
  const solarStatus = power.pvPowerW > 10 ? "Generating" : "Idle";
  const batteryStatus =
    power.batteryPowerW > 50 ? `Charging ${power.batterySoc}%` :
    power.batteryPowerW < -50 ? `Discharging ${power.batterySoc}%` :
    `Idle ${power.batterySoc}%`;
  const gridStatus =
    power.gridPowerW > 50 ? "Importing" :
    power.gridPowerW < -50 ? "Exporting" :
    "Idle";

  return [
    {
      label: "Solar",
      power: power.pvPowerW,
      status: solarStatus,
      daily: energy ? formatEnergy(energy.pvGenerationKwh) : "--",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
    },
    {
      label: "House",
      power: power.loadPowerW,
      status: "Consuming",
      daily: energy ? formatEnergy(energy.consumptionKwh) : "--",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
    {
      label: "Battery",
      power: Math.abs(power.batteryPowerW),
      status: batteryStatus,
      daily: energy ? `+${formatEnergy(energy.batteryChargeKwh)} / -${formatEnergy(energy.batteryDischargeKwh)}` : "--",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    {
      label: "Grid",
      power: Math.abs(power.gridPowerW),
      status: gridStatus,
      daily: energy ? `${formatEnergy(energy.gridImportKwh)} in / ${formatEnergy(energy.gridExportKwh)} out` : "--",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    },
  ];
}

// Simple SVG icons
function SolarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}

function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12l9-9 9 9" /><path d="M5 10v10h14V10" /><path d="M9 21v-6h6v6" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="18" height="12" rx="2" /><path d="M22 11v4" /><rect x="4" y="9" width="6" height="8" rx="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L8 10h8l-4 12" fill="currentColor" opacity="0.3" /><path d="M12 2L8 10h8l-4 12" />
    </svg>
  );
}

const ICONS = [SolarIcon, HouseIcon, BatteryIcon, GridIcon];

export function StatusBanner({ power, energy }: Props) {
  const cards = getCards(power, energy);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => {
        const Icon = ICONS[i];
        return (
          <div
            key={card.label}
            className={`rounded-xl border ${card.borderColor} ${card.bgColor} p-4 flex flex-col items-center text-center gap-1`}
          >
            <div className={card.color}>
              <Icon />
            </div>
            <span className={`text-2xl font-bold ${card.color}`}>
              {formatPower(card.power)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {card.status}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {card.daily}
            </span>
          </div>
        );
      })}
    </div>
  );
}
