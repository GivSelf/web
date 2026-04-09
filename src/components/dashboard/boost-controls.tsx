"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import type { BoostState } from "@/hooks/use-live-data";

interface Props {
  boostState: BoostState | null;
}

const DURATIONS = [15, 30, 60];

export function BoostControls({ boostState }: Props) {
  const [loading, setLoading] = useState(false);

  const startBoost = async (kind: "charge" | "export", minutes: number) => {
    setLoading(true);
    try {
      await apiPost(`/api/control/boost/${kind}`, { durationMinutes: minutes });
    } catch (err) {
      console.error("Boost failed:", err);
    }
    setLoading(false);
  };

  const cancelBoost = async () => {
    setLoading(true);
    try {
      await apiPost("/api/control/boost/cancel");
    } catch (err) {
      console.error("Cancel failed:", err);
    }
    setLoading(false);
  };

  const formatRemaining = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (boostState?.active) {
    return (
      <div className="rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-500">
              Force {boostState.kind === "charge" ? "Charge" : "Export"} Active
            </p>
            <p className="text-2xl font-bold text-yellow-400">
              {formatRemaining(boostState.remainingSeconds)}
            </p>
          </div>
          <button
            onClick={cancelBoost}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
      <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Force Charge</p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={`charge-${d}`}
                onClick={() => startBoost("charge", d)}
                disabled={loading}
                className="flex-1 px-2 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium disabled:opacity-50"
              >
                {d}m
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Force Export</p>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={`export-${d}`}
                onClick={() => startBoost("export", d)}
                disabled={loading}
                className="flex-1 px-2 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium disabled:opacity-50"
              >
                {d}m
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
