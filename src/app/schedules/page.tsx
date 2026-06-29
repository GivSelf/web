"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ScheduleEditor } from "@/components/schedules/schedule-editor";
import { useLiveData } from "@/hooks/use-live-data";

export default function SchedulesPage() {
  const { connected } = useLiveData();

  return (
    <AppShell connected={connected}>
      <h1 className="h1">Schedules</h1>
      <ScheduleEditor />
    </AppShell>
  );
}
