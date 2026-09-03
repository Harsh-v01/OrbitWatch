import { ArrowUpRight, CircleDot, Orbit } from "lucide-react";
import Panel from "../ui/Panel";
import Badge from "../ui/Badge";

export default function SelectedSatellite({ satellite }) {
  if (!satellite) {
    return (
      <Panel className="selected-panel empty-panel">
        <div className="empty-icon"><Orbit size={18} /></div>
        <div>
          <span className="eyebrow">SELECTED OBJECT</span>
          <h3>No satellite selected</h3>
          <p>Select an object on the radar or from the satellite catalog to inspect its live telemetry.</p>
        </div>
      </Panel>
    );
  }

  const above = satellite.elevation >= 0;

  return (
    <Panel className="selected-panel">
      <div className="panel-overline">
        <span>SELECTED OBJECT</span>
        <Badge tone={above ? "green" : "neutral"} dot>{above ? "VISIBLE" : "BELOW HORIZON"}</Badge>
      </div>
      <div className="selected-object">
        <div className={`object-emblem sat-${satellite.color}`}>
          <CircleDot size={21} />
        </div>
        <div className="selected-title">
          <h3>{satellite.name}</h3>
          <p>{satellite.mission || satellite.type} · {satellite.operator}</p>
        </div>
        <ArrowUpRight size={16} className="panel-arrow" />
      </div>
      <div className="object-metrics">
        <div><span>ALTITUDE</span><strong>{satellite.altitude.toLocaleString()} <small>km</small></strong></div>
        <div><span>SPEED</span><strong>{satellite.velocity} <small>km/s</small></strong></div>
        <div><span>RANGE</span><strong>{satellite.distance.toLocaleString()} <small>km</small></strong></div>
      </div>
    </Panel>
  );
}
