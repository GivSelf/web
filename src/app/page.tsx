"use client";

import { useState, useEffect } from "react";
import { useLiveData } from "@/hooks/use-live-data";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PowerFlow } from "@/components/dashboard/power-flow";
import { SocGauge } from "@/components/dashboard/soc-gauge";
import { PowerBar } from "@/components/dashboard/power-bar";
import { EnergySummary } from "@/components/dashboard/energy-summary";
import { BoostControls } from "@/components/dashboard/boost-controls";
import { StatusBanner } from "@/components/dashboard/status-banner";
import { QuickstartWizard } from "@/components/setup/QuickstartWizard";
import { apiFetch } from "@/lib/api-client";

export default function DashboardPage() {
  const { power, energy, boostState, connected } = useLiveData();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    apiFetch<{ required: boolean }>("/api/settings/setup-required")
      .then(({ required }) => setShowSetup(required))
      .catch(() => {}); // server not available — don't show wizard
  }, []);

  return (
    <>
      {showSetup && <QuickstartWizard onComplete={() => { setShowSetup(false); window.location.reload(); }} />}
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header connected={connected} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {!power ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">Waiting for data...</p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Status Banner */}
              <StatusBanner power={power} energy={energy} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Power Flow Diagram */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
                  <h2 className="text-lg font-semibold mb-4">Power Flow</h2>
                  <PowerFlow data={power} />
                </div>

                {/* Battery & Power Bars */}
                <div className="space-y-6">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 flex justify-center">
                    <SocGauge soc={power.batterySoc} capacityKwh={power.batterySocKwh} />
                  </div>

                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
                    <h2 className="text-lg font-semibold">Power</h2>
                    <PowerBar label="Solar" value={power.pvPowerW} max={5000} color="bg-yellow-400" />
                    <PowerBar label="Battery" value={power.batteryPowerW} max={3600} color="bg-green-500" />
                    <PowerBar label="Grid" value={power.gridPowerW} max={7000} color="bg-gray-500" />
                    <PowerBar label="House" value={power.loadPowerW} max={5000} color="bg-blue-500" />
                  </div>
                </div>
              </div>

              {/* Boost Controls */}
              <BoostControls boostState={boostState} />

              {/* Energy Summary */}
              {energy && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
                  <h2 className="text-lg font-semibold mb-4">Today&apos;s Energy</h2>
                  <EnergySummary data={energy} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
    </>
  );
}
