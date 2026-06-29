"use client";

const MODES = [
  { value: 1, label: "Eco", description: "Discharge to match demand only" },
  { value: 2, label: "Timed Demand", description: "Discharge during scheduled slots" },
  { value: 3, label: "Timed Export", description: "Export excess to grid" },
];

interface Props {
  value: number;
  onChange: (mode: number) => void;
}

export function ModeSelector({ value, onChange }: Props) {
  const active = MODES.find((m) => m.value === value);
  return (
    <div>
      <div className="sublbl">Battery Mode</div>
      <div className="seg">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={`segb${value === mode.value ? " active" : ""}`}
          >
            {mode.label}
          </button>
        ))}
      </div>
      {active && (
        <p className="subtle" style={{ marginTop: 9 }}>
          {active.description}
        </p>
      )}
    </div>
  );
}
