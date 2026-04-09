"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api-client";

interface Props {
  onComplete: () => void;
}

const STEPS = [
  { key: "inverter", title: "Inverter Connection", description: "Connect to your GivEnergy inverter via the local network." },
  { key: "cloud", title: "GivEnergy Cloud API", description: "Enable historical data and system info from the GivEnergy cloud." },
  { key: "forecast", title: "Solar Forecasting", description: "Get solar generation forecasts from Solcast." },
];

export function QuickstartWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings state
  const [dongleSerial, setDongleSerial] = useState("");
  const [inverterHost, setInverterHost] = useState("");
  const [geApiKey, setGeApiKey] = useState("");
  const [geInverterSerial, setGeInverterSerial] = useState("");
  const [solcastApiKey, setSolcastApiKey] = useState("");
  const [solcastSiteId, setSolcastSiteId] = useState("");

  const saveAndNext = async () => {
    setSaving(true);
    setError(null);
    try {
      const settings: Record<string, string> = {};

      if (step === 0) {
        if (dongleSerial) settings.dongle_serial = dongleSerial;
        if (inverterHost) settings.inverter_host = inverterHost;
      } else if (step === 1) {
        if (geApiKey) settings.givenergy_api_key = geApiKey;
        if (geInverterSerial) settings.givenergy_inverter_serial = geInverterSerial;
      } else if (step === 2) {
        if (solcastApiKey) settings.solcast_api_key = solcastApiKey;
        if (solcastSiteId) settings.solcast_site_id = solcastSiteId;
      }

      if (Object.keys(settings).length > 0) {
        await apiPost("/api/settings", settings);
      }

      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else {
        onComplete();
      }
    } catch (err) {
      setError((err as Error).message);
    }
    setSaving(false);
  };

  const skip = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const currentStep = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-2xl font-bold">Welcome to GivSelf</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Let&apos;s get you set up. All steps are optional — you can configure these later in Settings.
          </p>

          {/* Step indicator */}
          <div className="flex gap-2 mt-4">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`h-1 flex-1 rounded-full ${
                  i <= step ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-2">
          <h2 className="text-lg font-semibold">{currentStep.title}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">{currentStep.description}</p>

          {error && (
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs mb-4">
              {error}
            </div>
          )}

          {step === 0 && (
            <div className="space-y-3">
              <Field label="Dongle Serial" value={dongleSerial} onChange={setDongleSerial} placeholder="e.g. WH1234G567" />
              <Field label="Inverter IP Address" value={inverterHost} onChange={setInverterHost} placeholder="e.g. 192.168.1.100" />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <Field label="GivEnergy API Key" value={geApiKey} onChange={setGeApiKey} placeholder="Bearer token from givenergy.cloud" password />
              <Field label="Inverter Serial" value={geInverterSerial} onChange={setGeInverterSerial} placeholder="e.g. FD1234G567" />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Get your API key from{" "}
                <a href="https://givenergy.cloud" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  givenergy.cloud
                </a>
                {" "}→ API Tokens
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Field label="Solcast API Key" value={solcastApiKey} onChange={setSolcastApiKey} placeholder="Your Solcast API key" password />
              <Field label="Solcast Site ID" value={solcastSiteId} onChange={setSolcastSiteId} placeholder="e.g. abcd-1234-ef56-7890" />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Get your API key from{" "}
                <a href="https://toolkit.solcast.com.au" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  toolkit.solcast.com.au
                </a>
                . Panel location will be auto-detected from your Solcast site.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={skip}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {step === STEPS.length - 1 ? "Skip & Finish" : "Skip"}
          </button>
          <button
            onClick={saveAndNext}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : step === STEPS.length - 1 ? "Finish" : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, password }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  password?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
      <input
        type={password ? "password" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
      />
    </div>
  );
}
