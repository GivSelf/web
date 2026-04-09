"use client";

import { useState, useCallback, useEffect } from "react";
import { useWebSocket } from "./use-websocket";
import { apiFetch } from "@/lib/api-client";

interface PowerFlows {
  solarToHouseW: number;
  solarToBatteryW: number;
  solarToGridW: number;
  batteryToHouseW: number;
  batteryToGridW: number;
  gridToHouseW: number;
  gridToBatteryW: number;
}

export interface LivePower {
  pvPowerW: number;
  pv1PowerW: number;
  pv2PowerW: number;
  pv1VoltageV: number;
  pv2VoltageV: number;
  batterySoc: number;
  batterySocKwh: number;
  batteryPowerW: number;
  batteryVoltageV: number;
  batteryTemperatureC: number;
  gridPowerW: number;
  gridVoltageV: number;
  gridCurrentA: number;
  gridFrequencyHz: number;
  loadPowerW: number;
  flows: PowerFlows;
}

export interface LiveEnergy {
  pvGenerationKwh: number;
  gridImportKwh: number;
  gridExportKwh: number;
  batteryChargeKwh: number;
  batteryDischargeKwh: number;
  consumptionKwh: number;
  selfConsumptionKwh: number;
}

export interface ImportStatus {
  running: boolean;
  fromDate: string;
  toDate: string;
  currentDate: string;
  daysTotal: number;
  daysCompleted: number;
  barsImported: number;
  error: string | null;
}

interface WsMessage {
  livePower?: LivePower;
  liveEnergy?: LiveEnergy;
  systemStatus?: { connected: boolean; adapter: string };
  boostState?: { active: boolean; kind: string; remainingSeconds: number };
  importStatus?: ImportStatus;
}

export interface BoostState {
  active: boolean;
  kind: string;
  remainingSeconds: number;
}

export function useLiveData() {
  const [power, setPower] = useState<LivePower | null>(null);
  const [energy, setEnergy] = useState<LiveEnergy | null>(null);
  const [systemStatus, setSystemStatus] = useState<{ connected: boolean; adapter: string } | null>(null);
  const [boostState, setBoostState] = useState<BoostState | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);

  const onMessage = useCallback((data: unknown) => {
    const msg = data as WsMessage;
    if (msg.livePower) setPower(msg.livePower);
    if (msg.liveEnergy) setEnergy(msg.liveEnergy);
    if (msg.systemStatus) setSystemStatus(msg.systemStatus);
    if (msg.boostState) setBoostState(msg.boostState);
    if (msg.importStatus) setImportStatus(msg.importStatus);
  }, []);

  const { connected } = useWebSocket(onMessage);

  // Hydrate immediately on mount — don't wait for first WebSocket broadcast
  useEffect(() => {
    apiFetch<LivePower>("/api/live").then(setPower).catch(() => {});
    apiFetch<LiveEnergy>("/api/energy/today").then(setEnergy).catch(() => {});
    apiFetch<BoostState>("/api/control/boost").then(setBoostState).catch(() => {});
  }, []);

  return { power, energy, systemStatus, boostState, importStatus, connected };
}
