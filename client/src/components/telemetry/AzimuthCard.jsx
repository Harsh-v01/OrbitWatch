import { Compass } from "lucide-react";
import Panel from "../ui/Panel";

const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
function compassWord(azimuth) { return DIRECTIONS[Math.round(azimuth / 45) % 8]; }

export default function AzimuthCard({ satellite }) {
  if (!satellite) return null;
  const angle = (satellite.azimuth * Math.PI) / 180;
  const x = 60 + Math.sin(angle) * 40;
  const y = 60 - Math.cos(angle) * 40;

  return (
    <Panel className="direction-panel">
      <div className="panel-overline"><span>WHERE TO LOOK</span><Compass size={14} /></div>
      <div className="direction-body">
        <svg viewBox="0 0 120 120" className="mini-compass" aria-hidden="true">
          <circle cx="60" cy="60" r="48" />
          <circle cx="60" cy="60" r="39" className="compass-inner" />
          <text x="60" y="16" textAnchor="middle">N</text><text x="106" y="64" textAnchor="middle">E</text>
          <text x="60" y="110" textAnchor="middle">S</text><text x="14" y="64" textAnchor="middle">W</text>
          <line x1="60" y1="60" x2={x} y2={y} className="compass-needle" />
          <circle cx="60" cy="60" r="3" className="compass-center" />
        </svg>
        <div className="direction-copy">
          <strong>{Math.round(satellite.azimuth)}°</strong>
          <span>{compassWord(satellite.azimuth)} · {Math.round(satellite.elevation)}° elevation</span>
          <p>Face {compassWord(satellite.azimuth)} and look approximately {Math.round(satellite.elevation)}° above the horizon.</p>
        </div>
      </div>
    </Panel>
  );
}
