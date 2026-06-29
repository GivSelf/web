"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "hearth" | "aurora" | "meadow";

export const THEMES: { id: Theme; label: string; hint: string }[] = [
  { id: "hearth", label: "Hearth", hint: "Warm · light" },
  { id: "aurora", label: "Aurora", hint: "Calm · dark" },
  { id: "meadow", label: "Meadow", hint: "Earthy · light" },
];

const STORAGE_KEY = "givself-theme";

/** Theme state synced to <html data-theme> + localStorage. */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("hearth");

  // Read the value the no-FOUC script already applied to <html>.
  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || "hearth";
    setThemeState(current);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    document.documentElement.classList.toggle("dark", next === "aurora");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return { theme, setTheme };
}
