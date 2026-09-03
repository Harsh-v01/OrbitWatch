const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function compassWord(azimuth) {
  return DIRECTIONS[Math.round(azimuth / 45) % 8];
}

export default function AzimuthCard({ satellite }) {
  if (!satellite) return null;

  return (
    <section className="info-card direction-card">
      <div className="info-card-head">
        <span>Where to look</span>
      </div>

      <div className="compass-view">
        <svg viewBox="0 0 120 120" className="compass-circle" aria-hidden="true">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--line-strong)" strokeWidth="1.5" />
          <text x="60" y="16" textAnchor="middle" className="compass-letter">N</text>
          <text x="108" y="64" textAnchor="middle" className="compass-letter">E</text>
          <text x="60" y="112" textAnchor="middle" className="compass-letter">S</text>
          <text x="12" y="64" textAnchor="middle" className="compass-letter">W</text>
          <line
            x1="60"
            y1="60"
            x2={60 + Math.sin((satellite.azimuth * Math.PI) / 180) * 42}
            y2={60 - Math.cos((satellite.azimuth * Math.PI) / 180) * 42}
            stroke="var(--gold)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="60" cy="60" r="3" fill="var(--gold)" />
        </svg>

        <div>
          <strong>{satellite.azimuth}°</strong>
          <small>azimuth</small>
          <p>Face {compassWord(satellite.azimuth)}, {Math.round(satellite.elevation)}° up from the horizon.</p>
        </div>
      </div>
    </section>
  );
}
