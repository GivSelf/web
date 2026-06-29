"use client";

import { useEffect, useState } from "react";
import { useLiveData } from "@/hooks/use-live-data";
import { useDashboardData } from "@/hooks/use-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { LiveFlow } from "@/components/dashboard/live-flow";
import { BatteryCard } from "@/components/dashboard/battery-card";
import { StatTiles } from "@/components/dashboard/stat-tiles";
import { ForecastCard } from "@/components/dashboard/forecast-card";
import { QuickControls } from "@/components/dashboard/quick-controls";
import { QuickstartWizard } from "@/components/setup/QuickstartWizard";
import { apiFetch } from "@/lib/api-client";

export default function DashboardPage() {
  const { power, energy, boostState, connected } = useLiveData();
  const { forecast, actual, schedules, yesterday, reloadSchedules } = useDashboardData();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    apiFetch<{ required: boolean }>("/api/settings/setup-required")
      .then(({ required }) => setShowSetup(required))
      .catch(() => {});
  }, []);

  return (
    <>
      {showSetup && (
        <QuickstartWizard
          onComplete={() => {
            setShowSetup(false);
            window.location.reload();
          }}
        />
      )}
      <AppShell connected={connected}>
        <div className="hero">
          <LiveFlow power={power} />
          <BatteryCard power={power} reserveSoc={schedules?.batteryReserveSoc ?? null} />
        </div>

        <StatTiles energy={energy} yesterday={yesterday} />

        <div className="fcrow">
          <ForecastCard forecast={forecast} actual={actual} nowKw={(power?.pvPowerW ?? 0) / 1000} />
          <QuickControls schedules={schedules} boostState={boostState} onChanged={reloadSchedules} />
        </div>
      </AppShell>
    </>
  );
}
