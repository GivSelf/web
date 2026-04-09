"use client";

interface Props {
  date: string;
  onDateChange: (date: string) => void;
  grouping: string;
  onGroupingChange: (grouping: string) => void;
}

function stepDate(dateStr: string, grouping: string, direction: number): string {
  const d = new Date(dateStr + "T12:00:00");
  if (grouping === "daily") {
    d.setDate(d.getDate() + 7 * direction);
  } else if (grouping === "monthly") {
    d.setFullYear(d.getFullYear() + direction);
  } else {
    d.setDate(d.getDate() + direction);
  }
  return d.toISOString().split("T")[0];
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const dayOfWeek = d.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (dt: Date) => dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(monday)} – ${fmt(sunday)} ${sunday.getFullYear()}`;
}

function getMonthOptions(): { value: string; label: string }[] {
  const months = [];
  for (let m = 0; m < 12; m++) {
    const d = new Date(2025, m, 1);
    months.push({
      value: String(m),
      label: d.toLocaleDateString("en-GB", { month: "long" }),
    });
  }
  return months;
}

const MONTHS = getMonthOptions();

const GROUPINGS = [
  { key: "half-hourly", label: "Half Hourly" },
  { key: "daily", label: "Daily" },
  { key: "monthly", label: "Monthly" },
];

function ArrowLeft() {
  return <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" /></svg>;
}

function ArrowRight() {
  return <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" /></svg>;
}

const btnClass = "p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400";
const inputClass = "px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm";

export function DateNavigator({ date, onDateChange, grouping, onGroupingChange }: Props) {
  const d = new Date(date + "T12:00:00");
  const today = new Date().toISOString().split("T")[0];

  // Build the appropriate picker for the grouping
  let picker: React.ReactNode;

  if (grouping === "monthly") {
    // Year selector
    const year = d.getFullYear();
    picker = (
      <>
        <button onClick={() => onDateChange(stepDate(date, grouping, -1))} className={btnClass}><ArrowLeft /></button>
        <span className="text-lg font-semibold px-2">{year}</span>
        <button onClick={() => onDateChange(stepDate(date, grouping, 1))} className={btnClass}><ArrowRight /></button>
      </>
    );
  } else if (grouping === "daily") {
    // Week selector — show month picker + week label
    const month = d.getMonth();
    const year = d.getFullYear();
    picker = (
      <>
        <button onClick={() => onDateChange(stepDate(date, grouping, -1))} className={btnClass}><ArrowLeft /></button>
        <select
          value={month}
          onChange={(e) => {
            const newDate = new Date(Date.UTC(year, parseInt(e.target.value), 1));
            onDateChange(newDate.toISOString().split("T")[0]);
          }}
          className={inputClass}
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => {
            const newDate = new Date(Date.UTC(parseInt(e.target.value), month, 1));
            onDateChange(newDate.toISOString().split("T")[0]);
          }}
          className={inputClass}
        >
          {Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button onClick={() => onDateChange(stepDate(date, grouping, 1))} className={btnClass}><ArrowRight /></button>
        <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
          {getWeekLabel(date)}
        </span>
      </>
    );
  } else {
    // Half-hourly — standard date picker
    picker = (
      <>
        <button onClick={() => onDateChange(stepDate(date, grouping, -1))} className={btnClass}><ArrowLeft /></button>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => onDateChange(e.target.value)}
          className={inputClass}
        />
        <button onClick={() => onDateChange(stepDate(date, grouping, 1))} className={btnClass}><ArrowRight /></button>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {picker}

      <button
        onClick={() => onDateChange(today)}
        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium"
      >
        Today
      </button>

      <div className="ml-auto">
        <select
          value={grouping}
          onChange={(e) => onGroupingChange(e.target.value)}
          className={inputClass}
        >
          {GROUPINGS.map((g) => (
            <option key={g.key} value={g.key}>{g.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
