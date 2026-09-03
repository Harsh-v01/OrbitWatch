import { Activity, CloudSun, Gauge, Sun } from "lucide-react";
import { useSpaceWeather } from "../../hooks/useSpaceWeather";
import Panel from "../ui/Panel";
import Badge from "../ui/Badge";

export default function SpaceWeather() {
  const { weather, status } = useSpaceWeather();
  return (
    <Panel className="weather-panel">
      <div className="panel-heading-row">
        <div className="section-heading-inline">
          <div className="section-icon"><CloudSun size={16} /></div>
          <div><span className="eyebrow">SPACE ENVIRONMENT</span><h2>Space weather</h2></div>
        </div>
        <Badge tone={status === "ready" ? "green" : "neutral"} dot>{status === "ready" ? "LIVE" : status.toUpperCase()}</Badge>
      </div>
      <p className="panel-description">NOAA space-weather indicators that can influence radio conditions and auroral activity.</p>
      {!weather && <div className="weather-empty">{status === "loading" ? "Reading current conditions…" : "Conditions unavailable right now."}</div>}
      {weather && (
        <>
          <div className="weather-summary">
            <Activity size={15} />
            <span>{weather.kIndexLabel === "Quiet" || weather.kIndexLabel === "Unsettled" ? "Geomagnetic conditions are currently calm." : `Geomagnetic activity is elevated: ${weather.kIndexLabel}.`}</span>
          </div>
          <div className="weather-metrics">
            <div><Gauge size={13} /><span>Kp index</span><strong>{weather.kIndex ?? "—"}</strong><small>{weather.kIndexLabel ?? ""}</small></div>
            <div><Activity size={13} /><span>Solar wind</span><strong>{weather.solarWindKmS ?? "—"}</strong><small>km/s</small></div>
            <div><Sun size={13} /><span>10.7cm flux</span><strong>{weather.solarFlux ?? "—"}</strong><small>sfu</small></div>
          </div>
        </>
      )}
    </Panel>
  );
}
