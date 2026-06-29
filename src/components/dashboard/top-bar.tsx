"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeSwitcher } from "./theme-switcher";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/analytics", label: "Energy" },
  { href: "/schedules", label: "Schedule" },
  { href: "/settings", label: "Settings" },
];

export function TopBar({ connected }: { connected: boolean }) {
  const pathname = usePathname();
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      );
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="topbar">
      <div className="brand">
        <div className="sunmark" />
        GivSelf
      </div>
      <div className="nav">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`navi${pathname === n.href ? " active" : ""}`}
          >
            {n.label}
          </Link>
        ))}
      </div>
      <div className="tools">
        <div className="pill">
          <span>☀</span>
          <span className="pmono">{clock || "—"}</span>
        </div>
        <div className="pill">
          <span className={`livedot${connected ? "" : " off"}`} />
          {connected ? "Live" : "Offline"}
        </div>
        <ThemeSwitcher />
        <div className="avatar" />
      </div>
    </div>
  );
}
