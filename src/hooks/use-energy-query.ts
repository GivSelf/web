"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";

export interface HistoryPoint {
  time: string;
  pvPowerW: number;
  batteryPowerW: number;
  gridPowerW: number;
  loadPowerW: number;
  batterySoc: number;
}

interface UseEnergyQueryResult {
  data: HistoryPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEnergyQuery(
  from: Date,
  to: Date,
  resolution: "hourly" | "daily" = "hourly",
): UseEnergyQueryResult {
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      resolution,
    });
    apiFetch<HistoryPoint[]>(`/api/energy/history?${params}`)
      .then(setData)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [from.getTime(), to.getTime(), resolution]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
