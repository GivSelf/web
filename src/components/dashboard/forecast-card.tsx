"use client";

import { useMemo } from "react";
import type { ForecastPoint, FlowBar } from "@/hooks/use-dashboard";

// Plot geometry (matches the design reference).
const W = 720,
  PL = 38,
  PR = 14,
  PT = 14,
  PLOT_BOTTOM = 210,
  X0 = 6,
  X1 = 21;

/** Parse the server's "YYYY-MM-DD HH:MM:SS+00" into a local fractional hour. */
function hourOf(ts: string): number {
  const iso = ts.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00");
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

export function ForecastCard({
  forecast,
  actual,
  nowKw,
}: {
  forecast: ForecastPoint[];
  actual: FlowBar[];
  nowKw: number;
}) {
  const v = useMemo(() => {
    // The API returns one series per source; this single curve uses the best
    // available one (Solcast is site-specific), never a mix of the two.
    const preferred = forecast.some((p) => p.source === "solcast")
      ? "solcast"
      : forecast[0]?.source;
    const fc = forecast
      .filter((p) => p.source === preferred)
      .map((p) => ({ h: hourOf(p.periodEnd), kw: p.pvEstimateKw }))
      .filter((p) => p.h >= X0 && p.h <= X1)
      .sort((a, b) => a.h - b.h);

    // Actual generation (kW) from local half-hourly flow energy.
    const nowH = Math.min(X1, Math.max(X0, new Date().getHours() + new Date().getMinutes() / 60));
    const act = actual
      .map((b) => ({
        h: hourOf(b.start) + 0.25, // midpoint of the 30-min bucket
        kw: (b.pvToHome + b.pvToBattery + b.pvToGrid) / 0.5,
      }))
      .filter((p) => p.h >= X0 && p.h <= nowH + 0.001)
      .sort((a, b) => a.h - b.h);

    const peak = Math.max(0, ...fc.map((p) => p.kw), ...act.map((p) => p.kw));
    let step = 2;
    let top = 6;
    if (peak > 6) {
      step = Math.ceil(peak / 4);
      top = step * 4;
    }
    const ticks: number[] = [];
    for (let k = 0; k <= top; k += step) ticks.push(k);

    const X = (h: number) => PL + ((h - X0) / (X1 - X0)) * (W - PL - PR);
    const Y = (k: number) => PT + (1 - k / top) * (PLOT_BOTTOM - PT);
    const toPath = (arr: { h: number; kw: number }[]) =>
      arr.map((p, i) => `${i ? "L" : "M"}${X(p.h).toFixed(1)} ${Y(p.kw).toFixed(1)}`).join(" ");

    const fcLine = fc.length ? toPath(fc) : "";
    const fcArea = fc.length
      ? `${fcLine} L${X(fc[fc.length - 1].h).toFixed(1)} ${PLOT_BOTTOM} L${X(fc[0].h).toFixed(1)} ${PLOT_BOTTOM} Z`
      : "";
    const actLine = act.length ? toPath(act) : "";
    const actArea = act.length
      ? `${actLine} L${X(act[act.length - 1].h).toFixed(1)} ${PLOT_BOTTOM} L${X(act[0].h).toFixed(1)} ${PLOT_BOTTOM} Z`
      : "";

    const nowX = X(nowH);
    const nowDotKw = nowKw || (act.length ? act[act.length - 1].kw : 0);
    const nowDotY = Y(nowDotKw);

    // Expected total (trapezoidal kWh) + peak.
    let totalKwh = 0;
    for (let i = 1; i < fc.length; i++) {
      totalKwh += ((fc[i].kw + fc[i - 1].kw) / 2) * (fc[i].h - fc[i - 1].h);
    }
    const peakPt = fc.reduce((m, p) => (p.kw > m.kw ? p : m), { h: 0, kw: 0 });
    const peakLabel = `${peakPt.kw.toFixed(1)} kW at ${fmtHour(peakPt.h)}`;

    const yGrid = ticks.map((k) => ({ k, y: Y(k), ty: Y(k) + 3.5 }));
    const xTicks = [
      [6, "6a"],
      [9, "9a"],
      [12, "12p"],
      [15, "3p"],
      [18, "6p"],
      [21, "9p"],
    ].map(([h, label]) => ({ x: X(h as number), label: label as string }));

    return {
      fcLine,
      fcArea,
      actLine,
      actArea,
      nowX,
      nowDotY,
      nowDotKw,
      yGrid,
      xTicks,
      totalKwh,
      peakLabel,
      hasPeak: peakPt.kw > 0,
    };
  }, [forecast, actual, nowKw]);

  return (
    <div className="card">
      <div className="chead">
        <div>
          <div className="ctitle">Solar forecast</div>
          <div className="cmeta">{forecast[0]?.source ?? "forecast"} · today</div>
        </div>
        <div className="cright">
          <div className="cbig num">{v.totalKwh.toFixed(1)} kWh</div>
          <div className="csub">{v.hasPeak ? `expected · peak ${v.peakLabel}` : "expected"}</div>
        </div>
      </div>

      <svg className="chart" viewBox="0 0 720 246">
        {v.yGrid.map((g) => (
          <g key={g.k}>
            <line className="gridln" x1={PL} y1={g.y} x2={706} y2={g.y} />
            <text className="axislbl" x={30} y={g.ty} textAnchor="end">
              {g.k}
            </text>
          </g>
        ))}
        {v.fcArea && <path className="fcfill" d={v.fcArea} />}
        {v.actArea && <path className="actfill" d={v.actArea} />}
        {v.fcLine && <path className="fcline" d={v.fcLine} />}
        {v.actLine && <path className="actline" d={v.actLine} />}
        <line className="nowln" x1={v.nowX} y1={14} x2={v.nowX} y2={210} />
        <circle className="nowdot" cx={v.nowX} cy={v.nowDotY} r={5.5} />
        {v.xTicks.map((t) => (
          <text key={t.label} className="axislbl" x={t.x} y={234} textAnchor="middle">
            {t.label}
          </text>
        ))}
      </svg>

      <div className="legend">
        <div className="lgi">
          <span className="lgsw" />
          Actual so far
        </div>
        <div className="lgi">
          <span className="lgsw fc" />
          Forecast
        </div>
        <div className="lgi">
          <span style={{ width: 0, borderLeft: "2px dashed currentColor", height: 13, opacity: 0.5 }} />
          Now · {v.nowDotKw.toFixed(1)} kW
        </div>
      </div>
    </div>
  );
}

function fmtHour(h: number): string {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  const d = new Date();
  d.setHours(hr, min, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
