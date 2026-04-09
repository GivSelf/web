"use client";

import { useState, useEffect } from "react";
import { apiFetch, apiPut, apiPost } from "@/lib/api-client";
import { ModeSelector } from "./mode-selector";

interface TimeSlot {
  start: string;
  end: string;
  targetSoc: number;
}

interface ScheduleState {
  chargeEnabled: boolean;
  dischargeEnabled: boolean;
  chargeSlots: TimeSlot[];
  dischargeSlots: TimeSlot[];
  chargeTargetSoc: number;
  batteryReserveSoc: number;
  batteryMode: number;
}

const EMPTY_SLOT: TimeSlot = { start: "00:00", end: "00:00", targetSoc: 100 };
const inputClass = "w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm";

function isSlotActive(slot: TimeSlot): boolean {
  return slot.start !== "00:00" || slot.end !== "00:00";
}

function SlotRow({
  slot,
  index,
  type,
  onChange,
  onSave,
  saving,
}: {
  slot: TimeSlot;
  index: number;
  type: "charge" | "discharge";
  onChange: (index: number, field: keyof TimeSlot, value: string | number) => void;
  onSave: (index: number) => void;
  saving: boolean;
}) {
  const active = isSlotActive(slot);

  return (
    <div className={`grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-3 items-end ${!active && index > 0 ? "opacity-50" : ""}`}>
      <span className="text-xs text-gray-400 dark:text-gray-500 pb-2 w-6 text-right">{index + 1}</span>
      <div>
        {index === 0 && <label className="text-xs text-gray-500 dark:text-gray-400">Start</label>}
        <input
          type="time"
          value={slot.start}
          onChange={(e) => onChange(index, "start", e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        {index === 0 && <label className="text-xs text-gray-500 dark:text-gray-400">End</label>}
        <input
          type="time"
          value={slot.end}
          onChange={(e) => onChange(index, "end", e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        {index === 0 && <label className="text-xs text-gray-500 dark:text-gray-400">Target SOC</label>}
        <input
          type="number"
          min={4}
          max={100}
          value={slot.targetSoc}
          onChange={(e) => onChange(index, "targetSoc", parseInt(e.target.value) || 4)}
          className={inputClass}
        />
      </div>
      <button
        onClick={() => onSave(index)}
        disabled={saving}
        className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium disabled:opacity-50"
      >
        Save
      </button>
    </div>
  );
}

function SlotGroup({
  title,
  type,
  slots,
  enabled,
  onToggle,
  onChange,
  onSave,
  saving,
}: {
  title: string;
  type: "charge" | "discharge";
  slots: TimeSlot[];
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onChange: (index: number, field: keyof TimeSlot, value: string | number) => void;
  onSave: (index: number) => void;
  saving: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeCount = slots.filter(isSlotActive).length;
  const visibleSlots = expanded ? slots : slots.slice(0, 1);
  const hiddenCount = slots.length - 1;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Enabled</span>
        </label>
      </div>

      <div className="space-y-2">
        {visibleSlots.map((slot, i) => (
          <SlotRow
            key={i}
            slot={slot}
            index={i}
            type={type}
            onChange={onChange}
            onSave={onSave}
            saving={saving}
          />
        ))}
      </div>

      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-500 hover:text-blue-400"
        >
          {expanded
            ? "Hide additional slots"
            : `Show ${hiddenCount} other slot${hiddenCount > 1 ? "s" : ""} (${activeCount > 1 ? activeCount - 1 : 0} active)`}
        </button>
      )}
    </div>
  );
}

export function ScheduleEditor() {
  const [schedule, setSchedule] = useState<ScheduleState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ScheduleState>("/api/schedules").then((data) => {
      // Pad to 10 slots if the backend returns fewer
      while (data.chargeSlots.length < 10) data.chargeSlots.push({ ...EMPTY_SLOT });
      while (data.dischargeSlots.length < 10) data.dischargeSlots.push({ ...EMPTY_SLOT, targetSoc: 10 });
      setSchedule(data);
    }).catch(console.error);
  }, []);

  if (!schedule) {
    return <p className="text-gray-500 dark:text-gray-400">Loading schedules...</p>;
  }

  const save = async (fn: () => Promise<unknown>) => {
    setSaving(true);
    setError(null);
    try {
      await fn();
      const updated = await apiFetch<ScheduleState>("/api/schedules");
      while (updated.chargeSlots.length < 10) updated.chargeSlots.push({ ...EMPTY_SLOT });
      while (updated.dischargeSlots.length < 10) updated.dischargeSlots.push({ ...EMPTY_SLOT, targetSoc: 10 });
      setSchedule(updated);
    } catch (err) {
      setError((err as Error).message);
    }
    setSaving(false);
  };

  const updateSlot = (type: "charge" | "discharge") => (index: number, field: keyof TimeSlot, value: string | number) => {
    const slots = type === "charge" ? [...schedule.chargeSlots] : [...schedule.dischargeSlots];
    slots[index] = { ...slots[index], [field]: value };
    setSchedule({
      ...schedule,
      [type === "charge" ? "chargeSlots" : "dischargeSlots"]: slots,
    });
  };

  const saveSlot = (type: "charge" | "discharge") => (index: number) => {
    const slots = type === "charge" ? schedule.chargeSlots : schedule.dischargeSlots;
    save(() => apiPut(`/api/schedules/${type}/${index}`, { slot: slots[index] }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Battery Mode */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <ModeSelector
          value={schedule.batteryMode}
          onChange={(mode) => {
            setSchedule({ ...schedule, batteryMode: mode });
            save(() => apiPut("/api/schedules/mode", { mode }));
          }}
        />
      </div>

      {/* Charge Schedule */}
      <SlotGroup
        title="Charge Schedule"
        type="charge"
        slots={schedule.chargeSlots}
        enabled={schedule.chargeEnabled}
        onToggle={(enabled) => {
          setSchedule({ ...schedule, chargeEnabled: enabled });
          save(() => apiPut("/api/schedules/charge/enable", { enabled }));
        }}
        onChange={updateSlot("charge")}
        onSave={saveSlot("charge")}
        saving={saving}
      />

      {/* Discharge Schedule */}
      <SlotGroup
        title="Discharge Schedule"
        type="discharge"
        slots={schedule.dischargeSlots}
        enabled={schedule.dischargeEnabled}
        onToggle={(enabled) => {
          setSchedule({ ...schedule, dischargeEnabled: enabled });
          save(() => apiPut("/api/schedules/discharge/enable", { enabled }));
        }}
        onChange={updateSlot("discharge")}
        onSave={saveSlot("discharge")}
        saving={saving}
      />

      {/* Battery Reserve & Target */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
        <h3 className="font-semibold">Battery Limits</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Reserve SOC (%)</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="range"
                min={4}
                max={100}
                value={schedule.batteryReserveSoc}
                onChange={(e) => setSchedule({ ...schedule, batteryReserveSoc: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm font-medium w-10 text-right">{schedule.batteryReserveSoc}%</span>
            </div>
            <button
              onClick={() => save(() => apiPost("/api/control/reserve", { socPercent: schedule.batteryReserveSoc }))}
              disabled={saving}
              className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium disabled:opacity-50"
            >
              Set Reserve
            </button>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Charge Target SOC (%)</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="range"
                min={4}
                max={100}
                value={schedule.chargeTargetSoc}
                onChange={(e) => setSchedule({ ...schedule, chargeTargetSoc: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm font-medium w-10 text-right">{schedule.chargeTargetSoc}%</span>
            </div>
            <button
              onClick={() => save(() => apiPost("/api/control/target", { socPercent: schedule.chargeTargetSoc }))}
              disabled={saving}
              className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium disabled:opacity-50"
            >
              Set Target
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
