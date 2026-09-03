import { Activity, Crosshair, Gauge, RadioTower } from "lucide-react";
import Panel from "../ui/Panel";

export default function Telemetry({ satellite }) {
  if (!satellite) return null;
  const elevationRatio = Math.max(0, Math.min(100, ((satellite.elevation + 12) / 102) * 100));

  return (
    <Panel className="telemetry-panel">
      <div className="panel-overline">
        <span>LIVE TELEMETRY</span>
        <span className="mono-label">NORAD {satellite.id}</span>
      </div>
      <div className="telemetry-grid">
        <div className="telemetry-item"><Crosshair size={14} /><span>AZIMUTH</span><strong>{satellite.azimuth}°</strong></div>
        <div className="telemetry-item"><Gauge size={14} /><span>ELEVATION</span><strong>{satellite.elevation}°</strong></div>
        <div className="telemetry-item"><RadioTower size={14} /><span>RANGE</span><strong>{satellite.distance.toLocaleString()} km</strong></div>
      </div>
      <div className="elevation-meter">
        <div className="meter-head"><span>HORIZON</span><span>ZENITH</span></div>
        <div className="meter-track"><i style={{ width: `${elevationRatio}%` }} /></div>
      </div>
      <div className="telemetry-foot"><Activity size={12} /> Higher elevation generally means a better chance of spotting the object.</div>
    </Panel>
  );
}
