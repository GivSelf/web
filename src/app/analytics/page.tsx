"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
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
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header connected={connected} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Analytics</h1>
              <div className="flex gap-1">
                {PERSPECTIVES.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPerspective(p.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      perspective === p.key
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <DateNavigator
              date={date}
              onDateChange={setDate}
              grouping={grouping}
              onGroupingChange={setGrouping}
            />

            {loading ? (
              <div className="flex items-center justify-center h-[500px]">
                <p className="text-gray-500 dark:text-gray-400">Loading energy flows...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-[500px]">
                <p className="text-red-500">{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Bar chart — main content */}
                <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
                  <h2 className="text-lg font-semibold mb-2">Energy Flows</h2>
                  {data.length === 0 && forecast.length === 0 ? (
                    <div className="flex items-center justify-center h-[400px]">
                      <p className="text-gray-500 dark:text-gray-400">No data for this date</p>
                    </div>
                  ) : (
                    <EnergyFlowsChart data={data} perspective={perspective} grouping={grouping} forecast={forecast} />
                  )}
                </div>

                {/* Pie chart + summary — sidebar */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
                  <h2 className="text-lg font-semibold mb-2">Breakdown</h2>
                  {summary && <EnergyPieChart summary={summary} perspective={perspective} />}

                  {/* Summary totals */}
                  {summary && (
                    <div className="mt-4 space-y-2 border-t border-gray-200 dark:border-gray-800 pt-4">
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
                          <SummaryRow label="Total Generation" value={summary.pvToHome + summary.pvToBattery + summary.pvToGrid} bold />
                        </>
                      )}
                      {(perspective === "all" || perspective === "battery") && (
                        <>
                          <SummaryRow label="Total" value={summary.total} bold />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, color, bold }: { label: string; value: number; color?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
        {color && <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: color }} />}
        {label}
      </span>
      <span className={bold ? "font-bold" : "font-medium"}>{value.toFixed(2)} kWh</span>
    </div>
  );
}
