"use client";

import type { LivePower } from "@/hooks/use-live-data";

const kw = (w: number) => (Math.abs(w) / 1000).toFixed(1);
const IDLE_W = 50; // below this a stream is considered idle

export function LiveFlow({ power }: { power: LivePower | null }) {
  const p = power;
  const solarW = p?.pvPowerW ?? 0;
  const loadW = p?.loadPowerW ?? 0;
  const battW = p?.batteryPowerW ?? 0; // + charging, - discharging
  const gridW = p?.gridPowerW ?? 0; // + importing, - exporting

  const charging = battW >= 0;
  const exporting = gridW < 0;

  // self-sufficiency: share of home demand met without grid import
  const selfPct =
    loadW > 0 ? Math.max(0, Math.min(100, Math.round((1 - Math.max(0, p?.flows.gridToHouseW ?? 0) / loadW) * 100))) : 100;

  const cls = (active: boolean, rev = false, extra = "") =>
    `flowline ${extra} ${rev ? "rev" : ""} ${active ? "" : "idle"}`.trim();

  return (
    <div className="card">
      <div className="chead">
        <div>
          <div className="ctitle">Live power flow</div>
          <div className="cmeta">{p ? "updated just now" : "waiting for data…"}</div>
        </div>
        <div className="cright">
          <div className="cbig num">{kw(loadW)} kW</div>
          <div className="csub">home demand</div>
        </div>
      </div>

      <div className="flowstage">
        <svg className="flowsvg" viewBox="0 0 520 330">
          <path className="flowbase" d="M260 80 L260 150" />
          <path className="flowbase" d="M238 192 L122 258" />
          <path className="flowbase" d="M282 192 L398 258" />
          <path className={cls(solarW > IDLE_W)} d="M260 80 L260 150" />
          <path className={cls(Math.abs(battW) > IDLE_W, !charging, "bat")} d="M238 192 L122 258" />
          <path className={cls(Math.abs(gridW) > IDLE_W, !exporting, "grd")} d="M282 192 L398 258" />
        </svg>

        <div className="node" style={{ left: "50%", top: "18.2%" }}>
          <div className="ndot ndsolar num">{kw(solarW)}</div>
          <div className="nlabel">Solar</div>
          <div className="nsub">kW generating</div>
        </div>
        <div className="node" style={{ left: "50%", top: "53%" }}>
          <div className="ndot ndhome num">{kw(loadW)}</div>
          <div className="nlabel">Home</div>
          <div className="nsub">kW in use</div>
        </div>
        <div className="node" style={{ left: "18.5%", top: "84%" }}>
          <div className="ndot ndbatt num">{kw(battW)}</div>
          <div className="nlabel">Battery</div>
          <div className="nsub">
            kW {Math.abs(battW) <= IDLE_W ? "idle" : charging ? "charging" : "discharging"}
          </div>
        </div>
        <div className="node" style={{ left: "81.5%", top: "84%" }}>
          <div className="ndot ndgrid num">{kw(gridW)}</div>
          <div className="nlabel">Grid</div>
          <div className="nsub">
            kW {Math.abs(gridW) <= IDLE_W ? "idle" : exporting ? "exporting" : "importing"}
          </div>
        </div>
      </div>

      <div className="flowfoot">
        <div className="ffl">
          {solarW > IDLE_W ? "Powered by sunshine right now" : "Running on stored & grid power"}
        </div>
        <div className="ffb ffg num">{selfPct}%</div>
      </div>
    </div>
  );
}
