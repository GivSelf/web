"use client";

import { useEffect, useRef, useState } from "react";
import { apiPost, apiPut } from "@/lib/api-client";
import type { BoostState } from "@/hooks/use-live-data";
import type { ScheduleState } from "@/hooks/use-dashboard";

const MODES = [
  { value: 1, label: "Eco" },
  { value: 2, label: "Timed demand" },
  { value: 3, label: "Timed export" },
];
const BOOST_MIN = 30;

export function QuickControls({
  schedules,
  boostState,
  onChanged,
}: {
  schedules: ScheduleState | null;
  boostState: BoostState | null;
  onChanged: () => void;
}) {
  const [mode, setMode] = useState<number>(schedules?.batteryMode ?? 1);
  const [reserve, setReserve] = useState<number>(schedules?.batteryReserveSoc ?? 20);
  const [busy, setBusy] = useState(false);

  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCommitted = useRef<number | null>(null);

  // Keep local state in sync when server data (re)loads.
  useEffect(() => {
    if (schedules) {
      setMode(schedules.batteryMode);
      setReserve(schedules.batteryReserveSoc);
      lastCommitted.current = schedules.batteryReserveSoc;
    }
  }, [schedules]);

  const pickMode = async (m: number) => {
    setMode(m);
    try {
      await apiPut("/api/schedules/mode", { mode: m });
      onChanged();
    } catch (err) {
      console.error("mode change failed", err);
    }
  };

  const boostActive = boostState?.active ?? false;

  const boost = async (kind: "charge" | "export") => {
    setBusy(true);
    try {
      if (boostActive && boostState?.kind === kind) {
        await apiPost("/api/control/boost/cancel");
      } else {
        await apiPost(`/api/control/boost/${kind}`, { durationMinutes: BOOST_MIN });
      }
    } catch (err) {
      console.error("boost failed", err);
    }
    setBusy(false);
  };

  // Each commit becomes a Modbus holding-register write on the inverter, so
  // only send when the value actually changed, and debounce keyboard input —
  // a held arrow key fires keyup per step and must not become a write burst.
  const commitReserve = async (val: number) => {
    if (commitTimer.current) {
      clearTimeout(commitTimer.current);
      commitTimer.current = null;
    }
    if (val === lastCommitted.current) return;
    lastCommitted.current = val;
    try {
      await apiPost("/api/control/reserve", { socPercent: val });
      onChanged();
    } catch (err) {
      console.error("reserve failed", err);
    }
  };

  const commitReserveDebounced = (val: number) => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => commitReserve(val), 600);
  };

  const remaining = boostState?.remainingSeconds ?? 0;
  const remLabel = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  const chargeOn = boostActive && boostState?.kind === "charge";
  const exportOn = boostActive && boostState?.kind === "export";

  return (
    <div className="card">
      <div className="ctrls">
        <div>
          <div className="sublbl">Mode</div>
          <div className="seg">
            {MODES.map((m) => (
              <button
                key={m.value}
                className={`segb${mode === m.value ? " active" : ""}`}
                onClick={() => pickMode(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="sublbl">Boost</div>
          <div className="boosts">
            <button className={`boostb${chargeOn ? " on" : ""}`} disabled={busy} onClick={() => boost("charge")}>
              <span className="bt">{chargeOn ? "Cancel charge" : "Force charge"}</span>
              <span className="bs">{chargeOn ? `${remLabel} left` : `from grid · ${BOOST_MIN} min`}</span>
            </button>
            <button
              className={`boostb green${exportOn ? " on" : ""}`}
              disabled={busy}
              onClick={() => boost("export")}
            >
              <span className="bt">{exportOn ? "Cancel export" : "Force export"}</span>
              <span className="bs">{exportOn ? `${remLabel} left` : `sell now · ${BOOST_MIN} min`}</span>
            </button>
          </div>
        </div>

        <div>
          <div className="sublbl">Reserve</div>
          <div className="resv">
            <span className="resvk">Keep</span>
            <input
              type="range"
              className="slider"
              min={4}
              max={100}
              step={1}
              value={reserve}
              style={{
                background: `linear-gradient(to right, var(--green) 0%, var(--green) ${reserve}%, var(--ring-track) ${reserve}%, var(--ring-track) 100%)`,
              }}
              onChange={(e) => setReserve(Number(e.target.value))}
              onPointerUp={() => commitReserve(reserve)}
              onKeyUp={() => commitReserveDebounced(reserve)}
            />
            <span className="resvv num">{reserve}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
