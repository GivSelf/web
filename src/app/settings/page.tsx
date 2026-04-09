"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useLiveData, type ImportStatus } from "@/hooks/use-live-data";
import { apiFetch, apiPost } from "@/lib/api-client";

function getLocal(key: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) || "";
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
    commission_date: string;
    info: { model: string; max_charge_rate: number; max_discharge_rate: number; battery_type: string; battery: { nominal_capacity: number; nominal_voltage: number } };
    warranty: { type: string; expiry_date: string };
    firmware_version: { ARM: number; DSP: number };
    connections: { batteries: { module_number: number; serial: string; firmware_version: number; capacity: { full: number; design: number }; cell_count: number; nominal_voltage: number }[] };
  };
}

function InfoRow({ label, value }: { label: string; value: string | number | undefined }) {
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

function SettingsCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, password, readOnly }: {
  label: string; value: string; onChange?: (v: string) => void; placeholder?: string; password?: boolean; readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
      <input
        type={password ? "password" : "text"}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm ${readOnly ? "opacity-60" : ""}`}
      />
    </div>
  );
}

function SaveButton({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="flex items-center gap-3 mt-3">
      <button onClick={onClick} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
        {saving ? "Saving..." : "Save"}
      </button>
      {saved && <span className="text-xs text-green-500">Saved</span>}
    </div>
  );
}

export default function SettingsPage() {
  const { connected, importStatus } = useLiveData();
  const [info, setInfo] = useState<DeviceInfo | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  // Editable fields
  const [dongleSerial, setDongleSerial] = useState("");
  const [inverterHost, setInverterHost] = useState("");
  const [geApiKey, setGeApiKey] = useState("");
  const [geInverterSerial, setGeInverterSerial] = useState("");
  const [solcastApiKey, setSolcastApiKey] = useState("");
  const [solcastSiteId, setSolcastSiteId] = useState("");

  // Import fields
  const [importFrom, setImportFrom] = useState("");
  const [importTo, setImportTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [importFull, setImportFull] = useState(true);
  const [importClear, setImportClear] = useState(false);

  useEffect(() => {
    apiFetch<DeviceInfo>("/api/system/info").then(setInfo).catch(() => {});
    apiFetch<Record<string, string>>("/api/settings").then((s) => {
      setSettings(s);
      setDongleSerial(s.dongle_serial || "");
      setInverterHost(s.inverter_host || "");
      setGeInverterSerial(s.givenergy_inverter_serial || "");
      setSolcastSiteId(s.solcast_site_id || "");
      if (s.givenergy_api_key) setGeApiKey(s.givenergy_api_key); // masked
      if (s.solcast_api_key) setSolcastApiKey(s.solcast_api_key); // masked
    }).catch(() => {});
  }, []);

  const commissionDate = info?.inverter?.commission_date?.split("T")[0] || "2023-01-01";
  const inv = info?.inverter;

  const saveSection = async (section: string, data: Record<string, string>) => {
    setSaving((s) => ({ ...s, [section]: true }));
    try {
      await apiPost("/api/settings", data);
      setSaved((s) => ({ ...s, [section]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [section]: false })), 3000);
    } catch {}
    setSaving((s) => ({ ...s, [section]: false }));
  };

  const startImport = async () => {
    setSaving((s) => ({ ...s, import: true }));
    try {
      const from = importFull ? commissionDate : importFrom;
      const to = importFull ? new Date().toISOString().split("T")[0] : importTo;
      await apiPost("/api/import/start", {
        fromDate: from, toDate: to, clear: importClear,
        apiKey: geApiKey.startsWith("••••") ? undefined : geApiKey,
        inverterSerial: geInverterSerial,
      });
    } catch {}
    setSaving((s) => ({ ...s, import: false }));
  };

  const importProgress = importStatus?.daysTotal ? Math.round((importStatus.daysCompleted / importStatus.daysTotal) * 100) : 0;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header connected={connected} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Settings</h1>

            {/* Inverter Connection */}
            <SettingsCard title="Inverter Connection" description="Connect to your GivEnergy inverter via Modbus TCP on the local network.">
              <div className="space-y-3">
                <Field label="Dongle Serial" value={dongleSerial} onChange={setDongleSerial} placeholder="e.g. WH1234G567" />
                <Field label="Inverter IP Address" value={inverterHost} onChange={setInverterHost} placeholder="e.g. 192.168.1.100" />
                <SaveButton
                  onClick={() => saveSection("inverter", { dongle_serial: dongleSerial, inverter_host: inverterHost })}
                  saving={!!saving.inverter} saved={!!saved.inverter}
                />
              </div>
            </SettingsCard>

            {/* GivEnergy Cloud API */}
            <SettingsCard title="GivEnergy Cloud" description="Enable historical energy data, system info, and remote control via the GivEnergy cloud API.">
              <div className="space-y-3">
                <Field label="API Key" value={geApiKey} onChange={setGeApiKey} placeholder="Bearer token from givenergy.cloud" password />
                <Field label="Inverter Serial" value={geInverterSerial} onChange={setGeInverterSerial} placeholder="e.g. FD1234G567" />
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Get your API key from <a href="https://givenergy.cloud" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">givenergy.cloud</a> → API Tokens
                </p>
                <SaveButton
                  onClick={() => saveSection("givenergy", {
                    givenergy_api_key: geApiKey.startsWith("••••") ? "" : geApiKey,
                    givenergy_inverter_serial: geInverterSerial,
                  })}
                  saving={!!saving.givenergy} saved={!!saved.givenergy}
                />
              </div>
            </SettingsCard>

            {/* Solar Forecasting */}
            <SettingsCard title="Solar Forecasting" description="Solcast provides solar generation forecasts. Panel location is auto-detected from your Solcast site.">
              <div className="space-y-3">
                <Field label="Solcast API Key" value={solcastApiKey} onChange={setSolcastApiKey} placeholder="Your Solcast API key" password />
                <Field label="Site ID" value={solcastSiteId} onChange={setSolcastSiteId} placeholder="e.g. abcd-1234-ef56-7890" />
                {settings.forecast_latitude && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Field label="Latitude" value={settings.forecast_latitude || ""} readOnly />
                    <Field label="Longitude" value={settings.forecast_longitude || ""} readOnly />
                    <Field label="Tilt" value={settings.forecast_tilt ? `${settings.forecast_tilt}°` : ""} readOnly />
                    <Field label="Azimuth" value={settings.forecast_azimuth ? `${settings.forecast_azimuth}°` : ""} readOnly />
                  </div>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Free tier: 10 API calls/day. Get your key from <a href="https://toolkit.solcast.com.au" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">toolkit.solcast.com.au</a>.
                  Forecast.Solar also runs automatically — no config needed.
                </p>
                <SaveButton
                  onClick={() => saveSection("solcast", {
                    solcast_api_key: solcastApiKey.startsWith("••••") ? "" : solcastApiKey,
                    solcast_site_id: solcastSiteId,
                  })}
                  saving={!!saving.solcast} saved={!!saved.solcast}
                />
              </div>
            </SettingsCard>

            {/* Data Import */}
            <SettingsCard title="Data Import" description="Import historical energy flow data from the GivEnergy Cloud API into the local database.">
              {importStatus?.running ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Importing {importStatus.currentDate}...</span>
                    <span className="font-medium">{importStatus.daysCompleted} / {importStatus.daysTotal} days</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${importProgress}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{importStatus.barsImported.toLocaleString()} records imported</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {importStatus && !importStatus.running && importStatus.daysCompleted > 0 && (
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs">
                      Last import: {importStatus.barsImported.toLocaleString()} records across {importStatus.daysCompleted} days
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={importFull} onChange={(e) => setImportFull(e.target.checked)} className="rounded" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Full history (since commission {commissionDate})</span>
                  </label>
                  {!importFull && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
                        <input type="date" value={importFrom} onChange={(e) => setImportFrom(e.target.value)}
                          className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">To</label>
                        <input type="date" value={importTo} onChange={(e) => setImportTo(e.target.value)}
                          className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
                      </div>
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={importClear} onChange={(e) => setImportClear(e.target.checked)} className="rounded" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Clear existing data before import</span>
                  </label>
                  <button onClick={startImport} disabled={!!saving.import}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
                    {saving.import ? "Starting..." : "Start Import"}
                  </button>
                </div>
              )}
            </SettingsCard>

            {/* System Info */}
            {inv && (
              <SettingsCard title="System Info">
                <InfoRow label="Model" value={inv.info?.model} />
                <InfoRow label="Serial" value={inv.serial} />
                <InfoRow label="Status" value={inv.status} />
                <InfoRow label="Firmware" value={`D0.${inv.firmware_version?.ARM} / A0.${inv.firmware_version?.DSP}`} />
                <InfoRow label="Max Charge Rate" value={`${inv.info?.max_charge_rate} W`} />
                <InfoRow label="Battery Type" value={inv.info?.battery_type} />
                <InfoRow label="Batteries" value={inv.connections?.batteries?.length} />
                <InfoRow label="Commission Date" value={formatDate(inv.commission_date)} />
                {info && (
                  <>
                    <InfoRow label="Warranty" value={`${inv.warranty?.type} — expires ${formatDate(inv.warranty?.expiry_date || "")}`} />
                    <InfoRow label="Dongle" value={`${info.serial_number} (${info.type})`} />
                  </>
                )}
              </SettingsCard>
            )}

            {/* About */}
            <SettingsCard title="About">
              <InfoRow label="Version" value="0.1.0" />
              <InfoRow label="Project" value="GivSelf" />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                Self-hosted home energy management system. Replaces cloud-dependent portals with direct local communication to your inverter.
              </p>
            </SettingsCard>
          </div>
        </main>
      </div>
    </div>
  );
}
