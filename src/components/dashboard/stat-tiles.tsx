"use client";

import type { LiveEnergy } from "@/hooks/use-live-data";
import type { FlowSummary } from "@/hooks/use-dashboard";

interface TileSpec {
  cls: string;
  label: string;
  today: number;
  // comparable yesterday total derived from the flow summary
  yesterday: number | null;
}

function Delta({ today, yesterday }: { today: number; yesterday: number | null }) {
  if (yesterday == null || yesterday <= 0.05) return <span className="tdelta dn">—</span>;
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  const up = pct >= 0;
  return (
    <span className={`tdelta${up ? "" : " dn"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

export function StatTiles({
  energy,
  yesterday,
}: {
  energy: LiveEnergy | null;
  yesterday: FlowSummary | null;
}) {
  const e = energy;
  const y = yesterday;

  const tiles: TileSpec[] = [
    {
      cls: "tsolar",
      label: "Solar today",
      today: e?.pvGenerationKwh ?? 0,
      yesterday: y ? y.pvToHome + y.pvToBattery + y.pvToGrid : null,
    },
    {
      cls: "thome",
      label: "Home use",
      today: e?.consumptionKwh ?? 0,
      yesterday: y ? y.total : null,
    },
    {
      cls: "texp",
      label: "Exported",
      today: e?.gridExportKwh ?? 0,
      yesterday: y ? y.pvToGrid + y.batteryToGrid : null,
    },
    {
      cls: "timp",
      label: "Imported",
      today: e?.gridImportKwh ?? 0,
      yesterday: y ? y.gridToHome + y.gridToBattery : null,
    },
  ];

  return (
    <div className="stats">
      {tiles.map((t) => (
        <div key={t.label} className={`tile ${t.cls}`}>
          <div className="thead">
            <div className="tdot">
              <div className="tdoti" />
            </div>
            <Delta today={t.today} yesterday={t.yesterday} />
          </div>
          <div className="tlabel">{t.label}</div>
          <div>
            <span className="tnum num">{t.today.toFixed(1)}</span>
            <span className="tunit">kWh</span>
          </div>
        </div>
      ))}
    </div>
  );
}
