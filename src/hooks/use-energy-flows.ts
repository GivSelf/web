"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";

export interface FlowBar {
  start: string;
  end: string;
  pvToHome: number;
  pvToBattery: number;
  pvToGrid: number;
  gridToHome: number;
  gridToBattery: number;
  batteryToHome: number;
  batteryToGrid: number;
}

export interface FlowSummary {
  pvToHome: number;
  pvToBattery: number;
  pvToGrid: number;
  gridToHome: number;
  gridToBattery: number;
  batteryToHome: number;
  batteryToGrid: number;
  total: number;
}

export interface ForecastPoint {
  periodEnd: string;
  pvEstimateKw: number;
}

export function useEnergyFlows(date: string, grouping: string) {
  const [data, setData] = useState<FlowBar[]>([]);
  const [summary, setSummary] = useState<FlowSummary | null>(null);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiFetch<FlowBar[]>(`/api/energy/flows?date=${date}&grouping=${grouping}`),
      apiFetch<FlowSummary>(`/api/energy/flows/summary?date=${date}`),
      apiFetch<ForecastPoint[]>(`/api/forecast/solar?date=${date}`).catch(() => [] as ForecastPoint[]),
    ])
      .then(([bars, sum, fc]) => {
        setData(bars);
        setSummary(sum);
        setForecast(fc);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [date, grouping]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, summary, forecast, loading, error, refetch: fetchData };
}
