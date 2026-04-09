"use client";

import { ThemeToggle } from "./theme-toggle";

interface Props {
  connected: boolean;
}

export function Header({ connected }: Props) {
  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>
      <ThemeToggle />
    </header>
  );
}
