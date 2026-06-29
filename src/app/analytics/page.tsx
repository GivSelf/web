"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useLiveData } from "@/hooks/use-live-data";
import { useEnergyFlows } from "@/hooks/use-energy-flows";
import { DateNavigator } from "@/components/analytics/date-navigator";
import { EnergyFlowsChart } from "@/components/analytics/energy-flows-chart";
import { EnergyPieChart } from "@/components/analytics/energy-pie-chart";

const PERSPECTIVES = [
  { key: "home", label: "Home" },
  { key: "solar", label: "Solar" },
  { key: "battery", label: "Battery" },
  { key: "all", label: "All Flows" },
];

export default function AnalyticsPage() {
  const { connected } = useLiveData();
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [grouping, setGrouping] = useState("half-hourly");
  const [perspective, setPerspective] = useState("home");
  const { data, summary, forecast, loading, error } = useEnergyFlows(date, grouping);

  return (
    <AppShell connected={connected}>
      <div className="toolbar" style={{ justifyContent: "space-between" }}>
        <h1 className="h1">Analytics</h1>
        <div className="seg perspseg">
          {PERSPECTIVES.map((p) => (
            <button
              key={p.key}
              onClick={() => setPerspective(p.key)}
              className={`segb${perspective === p.key ? " active" : ""}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <DateNavigator date={date} onDateChange={setDate} grouping={grouping} onGroupingChange={setGrouping} />

      {loading ? (
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 500 }}>
          <p className="muted">Loading energy flows…</p>
        </div>
      ) : error ? (
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 500 }}>
          <p className="note err">{error}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }} className="anlgrid">
          <div className="card">
            <div className="cardh">Energy Flows</div>
            {data.length === 0 && forecast.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}>
                <p className="muted">No data for this date</p>
              </div>
            ) : (
              <EnergyFlowsChart data={data} perspective={perspective} grouping={grouping} forecast={forecast} />
            )}
          </div>

          <div className="card">
            <div className="cardh">Breakdown</div>
            {summary && <EnergyPieChart summary={summary} perspective={perspective} />}

            {summary && (
              <div className="divider" style={{ marginTop: 16, paddingTop: 16 }}>
                {perspective === "home" && (
                  <>
                    <SummaryRow label="Solar to Home" value={summary.pvToHome} color="#FBBF24" />
                    <SummaryRow label="Grid to Home" value={summary.gridToHome} color="#EF4444" />
                    <SummaryRow label="Battery to Home" value={summary.batteryToHome} color="#22C55E" />
                    <SummaryRow label="Total Consumption" value={summary.total} bold />
                  </>
                )}
                {perspective === "solar" && (
                  <>
                    <SummaryRow label="Solar to Home" value={summary.pvToHome} color="#FBBF24" />
                    <SummaryRow label="Solar to Battery" value={summary.pvToBattery} color="#A3E635" />
                    <SummaryRow label="Solar to Grid" value={summary.pvToGrid} color="#FB923C" />
                    <SummaryRow
                      label="Total Generation"
                      value={summary.pvToHome + summary.pvToBattery + summary.pvToGrid}
                      bold
                    />
                  </>
                )}
                {(perspective === "all" || perspective === "battery") && (
                  <SummaryRow label="Total" value={summary.total} bold />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function SummaryRow({ label, value, color, bold }: { label: string; value: number; color?: string; bold?: boolean }) {
  return (
    <div className="srow">
      <span className="muted" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {color && <span className="swatch" style={{ backgroundColor: color }} />}
        {label}
      </span>
      <span className="num" style={{ fontWeight: bold ? 800 : 600, color: "var(--text)" }}>
        {value.toFixed(2)} kWh
      </span>
    </div>
  );
}
