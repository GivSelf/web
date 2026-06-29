"use client";

import { TopBar } from "@/components/dashboard/top-bar";

/**
 * Shared themed page chrome: full-bleed themed background → centered .app card
 * with the TopBar. Every route renders inside this so the three themes apply
 * consistently. `connected` comes from the page's own useLiveData() so we don't
 * open a second WebSocket here.
 */
export function AppShell({
  connected,
  children,
}: {
  connected: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="dashroot">
      <div className="app">
        <TopBar connected={connected} />
        {children}
      </div>
    </div>
  );
}
