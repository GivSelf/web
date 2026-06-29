"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

export interface ForecastPoint {
  periodEnd: string;
  pvEstimateKw: number;
  source: string;
}

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

export interface ScheduleState {
  batteryMode: number;
  batteryReserveSoc: number;
  chargeEnabled: boolean;
  dischargeEnabled: boolean;
}

/** Local YYYY-MM-DD for an offset number of days from today. */
function dateStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useDashboardData() {
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [actual, setActual] = useState<FlowBar[]>([]);
  const [schedules, setSchedules] = useState<ScheduleState | null>(null);
  const [today, setToday] = useState<FlowSummary | null>(null);
  const [yesterday, setYesterday] = useState<FlowSummary | null>(null);

  const loadSchedules = useCallback(() => {
    apiFetch<ScheduleState>("/api/schedules").then(setSchedules).catch(() => {});
  }, []);

  useEffect(() => {
    const t = dateStr(0);
    apiFetch<ForecastPoint[]>(`/api/forecast/solar?date=${t}`).then(setForecast).catch(() => {});
    apiFetch<FlowBar[]>(`/api/energy/flows?date=${t}&grouping=half-hourly`).then(setActual).catch(() => {});
    apiFetch<FlowSummary>(`/api/energy/flows/summary?date=${t}`).then(setToday).catch(() => {});
    apiFetch<FlowSummary>(`/api/energy/flows/summary?date=${dateStr(-1)}`).then(setYesterday).catch(() => {});
    loadSchedules();
  }, [loadSchedules]);

  return { forecast, actual, schedules, today, yesterday, reloadSchedules: loadSchedules };
}
