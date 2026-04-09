"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ScheduleEditor } from "@/components/schedules/schedule-editor";
import { useLiveData } from "@/hooks/use-live-data";

export default function SchedulesPage() {
  const { connected } = useLiveData();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header connected={connected} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <h1 className="text-2xl font-bold mb-6">Schedules</h1>
          <ScheduleEditor />
        </main>
      </div>
    </div>
  );
}
