"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useLiveData, type ImportStatus } from "@/hooks/use-live-data";
import { apiFetch, apiPost } from "@/lib/api-client";

interface BatteryModule {
  module_number: number;
  serial: string;
  firmware_version: number;
  capacity: { full: number; design: number };
  cell_count: number;
  nominal_voltage: number;
}

interface DeviceInfo {
  serial_number: string;
  firmware_version: number;
  type: string;
  commission_date: string;
  inverter: {
    serial: string;
    status: string;
    last_online: string;
    last_updated: string;
    commission_date: string;
    info: {
      battery_type: string;
      model: string;
      max_charge_rate: number;
      max_discharge_rate: number;
      battery: {
        nominal_capacity: number;
        nominal_voltage: number;
      };
    };
    warranty: {
      type: string;
      expiry_date: string;
    };
    firmware_version: {
      ARM: number;
      DSP: number;
    };
    connections: {
      batteries: BatteryModule[];
    };
    flags: string[];
  };
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function getLocal(key: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) || "";
}

function SolcastCard() {
  const [solcastKey, setSolcastKey] = useState(() => getLocal("solcast_api_key"));
  const [solcastSiteId, setSolcastSiteId] = useState(() => getLocal("solcast_site_id"));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    localStorage.setItem("solcast_api_key", solcastKey);
    localStorage.setItem("solcast_site_id", solcastSiteId);
    try {
      await apiPost("/api/settings/solcast", { apiKey: solcastKey, siteId: solcastSiteId });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Server might not support this endpoint yet — just save locally
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
      <h2 className="text-lg font-semibold mb-2">Solar Forecasting</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Solcast provides solar generation forecasts. Free tier allows 10 API calls/day.
        Get your API key from{" "}
        <a href="https://toolkit.solcast.com.au/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          toolkit.solcast.com.au
        </a>
      </p>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Solcast API Key</label>
            <input
              type="password"
              value={solcastKey}
              onChange={(e) => setSolcastKey(e.target.value)}
              placeholder="Your Solcast API key"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Site ID</label>
            <input
              type="text"
              value={solcastSiteId}
              onChange={(e) => setSolcastSiteId(e.target.value)}
              placeholder="e.g. fc7f-0659-4a40-f307"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {saved && <span className="text-xs text-green-500">Saved</span>}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Forecast.Solar is also used as a free complement — no configuration needed.
        </p>
      </div>
    </div>
  );
}

function ImportCard({ liveImportStatus, commissionDate = "2023-08-04" }: { liveImportStatus: ImportStatus | null; commissionDate?: string }) {
  const today = new Date().toISOString().split("T")[0];
  const [fullHistory, setFullHistory] = useState(true);
  const [fromDate, setFromDate] = useState(commissionDate);
  const [toDate, setToDate] = useState(today);
  const [clear, setClear] = useState(false);
  const [apiKey, setApiKey] = useState(() => getLocal("ge_api_key"));
  const [inverterSerial, setInverterSerial] = useState(() => getLocal("ge_inverter_serial"));
  const [starting, setStarting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const status = liveImportStatus;
  const progress = status?.daysTotal ? Math.round((status.daysCompleted / status.daysTotal) * 100) : 0;

  const startImport = async () => {
    if (!apiKey || !inverterSerial) {
      setImportError("GivEnergy API key and Inverter Serial are required");
      return;
    }
    // Persist credentials locally for convenience
    localStorage.setItem("ge_api_key", apiKey);
    localStorage.setItem("ge_inverter_serial", inverterSerial);

    setStarting(true);
    setImportError(null);
    try {
      await apiPost("/api/import/start", {
        fromDate: fullHistory ? commissionDate : fromDate,
        toDate: fullHistory ? today : toDate,
        clear,
        apiKey,
        inverterSerial,
      });
    } catch (err) {
      setImportError((err as Error).message);
    }
    setStarting(false);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
      <h2 className="text-lg font-semibold mb-2">Data Import</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Import historical energy flow data from the GivEnergy Cloud API into the local database.
      </p>

      {importError && (
        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs mb-4">
          {importError}
        </div>
      )}

      {status?.running ? (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Importing {status.currentDate}...
            </span>
            <span className="font-medium">
              {status.daysCompleted} / {status.daysTotal} days
            </span>
          </div>
          <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {status.barsImported.toLocaleString()} records imported
          </p>
          {status.error && (
            <p className="text-xs text-red-500">{status.error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {status && !status.running && status.daysCompleted > 0 && (
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs mb-2">
              Last import: {status.barsImported.toLocaleString()} records across {status.daysCompleted} days
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">GivEnergy API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Bearer token from givenergy.cloud"
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Inverter Serial</label>
              <input
                type="text"
                value={inverterSerial}
                onChange={(e) => setInverterSerial(e.target.value)}
                placeholder="e.g. FD2321G788"
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fullHistory}
              onChange={(e) => setFullHistory(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Full history (since commission {commissionDate})
            </span>
          </label>
          {!fullHistory && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">To</label>
                <input
                  type="date"
                  value={toDate}
                  max={today}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                />
              </div>
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={clear}
              onChange={(e) => setClear(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Clear existing data before import</span>
          </label>
          <button
            onClick={startImport}
            disabled={starting}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
          >
            {starting ? "Starting..." : "Start Import"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { connected, importStatus } = useLiveData();
  const [info, setInfo] = useState<DeviceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DeviceInfo>("/api/system/info")
      .then(setInfo)
      .catch((err) => setError((err as Error).message));
  }, []);

  const inv = info?.inverter;
  const batteries = inv?.connections?.batteries || [];
  const totalCapacityKwh = batteries.reduce(
    (sum, b) => sum + (b.capacity.full * b.nominal_voltage) / 1000,
    0,
  );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header connected={connected} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Settings</h1>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Inverter */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
              <h2 className="text-lg font-semibold mb-4">Inverter</h2>
              {inv ? (
                <>
                  <InfoRow label="Model" value={inv.info.model} />
                  <InfoRow label="Serial Number" value={inv.serial} />
                  <InfoRow label="Status" value={inv.status} />
                  <InfoRow label="Firmware (ARM)" value={`D0.${inv.firmware_version.ARM}`} />
                  <InfoRow label="Firmware (DSP)" value={`A0.${inv.firmware_version.DSP}`} />
                  <InfoRow label="Max Charge Rate" value={`${inv.info.max_charge_rate} W`} />
                  <InfoRow label="Max Discharge Rate" value={`${inv.info.max_discharge_rate} W`} />
                  <InfoRow label="Commission Date" value={formatDate(inv.commission_date)} />
                  <InfoRow label="Last Online" value={new Date(inv.last_online).toLocaleString("en-GB")} />
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
              )}
            </div>

            {/* Battery */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
              <h2 className="text-lg font-semibold mb-4">Battery</h2>
              {inv ? (
                <>
                  <InfoRow label="Type" value={inv.info.battery_type} />
                  <InfoRow label="Packs" value={batteries.length} />
                  <InfoRow label="Total Capacity" value={`${totalCapacityKwh.toFixed(1)} kWh`} />
                  <InfoRow label="Nominal Voltage" value={`${inv.info.battery?.nominal_voltage || 0} V`} />

                  {batteries.map((bat) => (
                    <div key={bat.serial} className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs text-blue-500 font-medium mb-2">Pack {bat.module_number}: {bat.serial}</p>
                      <InfoRow label="Firmware" value={bat.firmware_version} />
                      <InfoRow label="Full Capacity" value={`${bat.capacity.full} Ah`} />
                      <InfoRow label="Design Capacity" value={`${bat.capacity.design} Ah`} />
                      <InfoRow label="Health" value={`${Math.round((bat.capacity.full / bat.capacity.design) * 100)}%`} />
                      <InfoRow label="Cells" value={bat.cell_count} />
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
              )}
            </div>

            {/* Warranty & Dongle */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
              <h2 className="text-lg font-semibold mb-4">Warranty & Connection</h2>
              {info ? (
                <>
                  <InfoRow label="Warranty Type" value={inv?.warranty?.type || "—"} />
                  <InfoRow label="Warranty Expiry" value={formatDate(inv?.warranty?.expiry_date || "")} />
                  <InfoRow label="Dongle Serial" value={info.serial_number} />
                  <InfoRow label="Dongle Type" value={info.type} />
                  <InfoRow label="Dongle Firmware" value={info.firmware_version} />
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
              )}
            </div>

            {/* Data Import */}
            <ImportCard
              liveImportStatus={importStatus}
              commissionDate={inv?.commission_date ? inv.commission_date.split("T")[0] : undefined}
            />

            {/* Solar Forecasting */}
            <SolcastCard />

            {/* About */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
              <h2 className="text-lg font-semibold mb-4">About</h2>
              <InfoRow label="Version" value="0.1.0" />
              <InfoRow label="Project" value="GivSelf" />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                Self-hosted home energy management system. Replaces cloud-dependent portals with
                direct local communication to your inverter.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
