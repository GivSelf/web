"use client";

import type { LivePower } from "@/hooks/use-live-data";

const IDLE_W = 50;

export function BatteryCard({
  power,
  reserveSoc,
}: {
  power: LivePower | null;
  reserveSoc: number | null;
}) {
  const soc = power?.batterySoc ?? 0;
  const storedKwh = power?.batterySocKwh ?? 0;
  const battW = power?.batteryPowerW ?? 0;
  const charging = battW > IDLE_W;
  const discharging = battW < -IDLE_W;

  // Infer pack capacity from current stored energy + SoC.
  const capacityKwh = soc > 0 ? storedKwh / (soc / 100) : 0;

  // Project "full by" time while charging.
  let fullBy = "—";
  if (charging && soc < 100 && capacityKwh > 0) {
    const remainingKwh = (capacityKwh * (100 - soc)) / 100;
    const hours = remainingKwh / (battW / 1000);
    if (hours > 0 && hours < 48) {
      const eta = new Date(Date.now() + hours * 3_600_000);
      fullBy = eta.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
  }

  const headRight = charging
    ? `+${(battW / 1000).toFixed(1)} kW`
    : discharging
      ? `${(battW / 1000).toFixed(1)} kW`
      : "idle";

  return (
    <div className="card">
      <div className="chead">
        <div>
          <div className="ctitle">Battery</div>
          <div className="cmeta">{capacityKwh > 0 ? `${capacityKwh.toFixed(1)} kWh pack` : "—"}</div>
        </div>
        <div className="cright">
          <div className={`cbig num${charging ? " ffg" : ""}`}>{headRight}</div>
          <div className="csub">{charging ? "charging" : discharging ? "discharging" : "resting"}</div>
        </div>
      </div>

      <div className="battwrap">
        <div className="ringbox">
          <svg className="ringsvg" width="196" height="196" viewBox="0 0 196 196">
            <circle className="ringtrack" cx="98" cy="98" r="84" />
            <circle
              className="ringval"
              cx="98"
              cy="98"
              r="84"
              pathLength={100}
              strokeDasharray={`${soc} 100`}
            />
          </svg>
          <div className="ringctr">
            <div className="ringpct num">
              {Math.round(soc)}
              <span className="pctsign">%</span>
            </div>
            <div className="ringsub">{charging ? "CHARGING" : discharging ? "DISCHARGING" : "CHARGED"}</div>
          </div>
        </div>

        <div className="battrows">
          <div className="brow">
            <span className="bk">Stored</span>
            <span className="bv num">{storedKwh.toFixed(1)} kWh</span>
          </div>
          <div className="brow">
            <span className="bk">Full by</span>
            <span className="bv num">{fullBy}</span>
          </div>
          <div className="brow">
            <span className="bk">Reserve floor</span>
            <span className="bv num">{reserveSoc != null ? `${reserveSoc}%` : "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
