"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme, THEMES, type Theme } from "@/hooks/use-theme";

// Small swatch preview so the menu hints at each theme's palette.
const SWATCH: Record<Theme, string> = {
  hearth: "oklch(0.74 0.15 62)",
  aurora: "oklch(0.215 0.014 62)",
  meadow: "oklch(0.56 0.14 150)",
};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const active = THEMES.find((t) => t.id === theme);

  return (
    <div className="themesw" ref={ref}>
      <button
        className="swbtn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Switch theme"
      >
        <span className="swdot" />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{active?.label ?? "Theme"}</span>
      </button>
      {open && (
        <div className="swmenu" role="menu">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`switem${t.id === theme ? " active" : ""}`}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              role="menuitemradio"
              aria-checked={t.id === theme}
            >
              <span className="swsw" style={{ background: SWATCH[t.id] }} />
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
                <span>{t.label}</span>
                <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>{t.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
