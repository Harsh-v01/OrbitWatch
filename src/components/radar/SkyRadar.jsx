import { useMemo, useState } from "react";
import { equatorialToHorizontal } from "../../lib/astro";
import { BRIGHT_STARS } from "../../data/stars";

const SIZE = 600;
const CENTER = SIZE / 2;
const RADIUS = 258;

// Equidistant alt-az projection: zenith at centre, horizon at the rim.
// North stays at the top; because this is the view looking straight UP
// (not down at a map), east falls to the left and west to the right —
// that's the real convention a planisphere uses, not an accident.
function project(azimuthDeg, elevationDeg) {
  const r = RADIUS * Math.max(0, (90 - elevationDeg) / 90);
  const azRad = (azimuthDeg * Math.PI) / 180;
  return {
    x: CENTER - r * Math.sin(azRad),
    y: CENTER - r * Math.cos(azRad)
  };
}

function starSize(mag) {
  return Math.max(0.9, 3.6 - mag * 0.55);
}

const CATEGORY_LABEL = {
  station: "Station",
  science: "Science",
  weather: "Weather",
  communication: "Comms",
  other: "Object"
};

export default function SkyRadar({ satellites, selectedId, onSelect, location, now, status }) {
  const [hoveredId, setHoveredId] = useState(null);

  // Stars barely move minute to minute, so recompute on a 30s cadence
  // rather than every clock tick.
  const timeBucket = Math.floor(now.getTime() / 30000);
  const stars = useMemo(() => {
    if (!location) return [];
    return BRIGHT_STARS.map((star) => {
      const { altitude, azimuth } = equatorialToHorizontal(star, location, now);
      return { ...star, altitude, azimuth };
    }).filter((star) => star.altitude > -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lng, timeBucket]);

  const visible = satellites.filter((sat) => sat.elevation >= 0);
  const selected = visible.find((sat) => sat.id === selectedId);
  const labeled = new Set(
    visible
      .slice()
      .sort((a, b) => b.elevation - a.elevation)
      .slice(0, 3)
      .map((s) => s.id)
      .concat(selected ? [selected.id] : [])
  );

  return (
    <section className="sky-card">
      <div className="sky-card-head">
        <div>
          <h2>The sky over you</h2>
          <p>Facing north, looking straight up. The rim is your horizon.</p>
        </div>
      </div>

      <div className="sky-scene">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Sky chart of satellites currently overhead">
          <defs>
            <radialGradient id="domeGradient" cx="50%" cy="42%" r="75%">
              <stop offset="0%" stopColor="#1b2938" />
              <stop offset="100%" stopColor="#0e1620" />
            </radialGradient>
          </defs>

          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#domeGradient)" stroke="var(--line-strong)" strokeWidth="1.5" />
          <circle cx={CENTER} cy={CENTER} r={RADIUS * (60 / 90)} fill="none" stroke="var(--line)" strokeWidth="1" strokeDasharray="2 5" />
          <circle cx={CENTER} cy={CENTER} r={RADIUS * (30 / 90)} fill="none" stroke="var(--line)" strokeWidth="1" strokeDasharray="2 5" />

          <text x={CENTER + 6} y={CENTER - RADIUS * (30 / 90) - 6} className="sky-ring-label">60°</text>
          <text x={CENTER + 6} y={CENTER - RADIUS * (60 / 90) - 6} className="sky-ring-label">30°</text>

          <line x1={CENTER} y1={CENTER - RADIUS} x2={CENTER} y2={CENTER + RADIUS} stroke="var(--line)" strokeWidth="1" />
          <line x1={CENTER - RADIUS} y1={CENTER} x2={CENTER + RADIUS} y2={CENTER} stroke="var(--line)" strokeWidth="1" />

          <text x={CENTER} y={CENTER - RADIUS - 14} className="sky-direction">N</text>
          <text x={CENTER} y={CENTER + RADIUS + 26} className="sky-direction">S</text>
          <text x={CENTER - RADIUS - 20} y={CENTER + 5} className="sky-direction">E</text>
          <text x={CENTER + RADIUS + 20} y={CENTER + 5} className="sky-direction">W</text>

          {stars.map((star) => {
            const { x, y } = project(star.azimuth, star.altitude);
            return <circle key={star.name} cx={x} cy={y} r={starSize(star.mag)} className="star-point" />;
          })}

          {visible.map((sat) => {
            const { x, y } = project(sat.azimuth, sat.elevation);
            const isSelected = sat.id === selectedId;
            const showLabel = labeled.has(sat.id) || hoveredId === sat.id;

            return (
              <g
                key={sat.id}
                className={`sat-mark sat-${sat.color} ${isSelected ? "is-selected" : ""}`}
                onMouseEnter={() => setHoveredId(sat.id)}
                onMouseLeave={() => setHoveredId((id) => (id === sat.id ? null : id))}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 7 : 5}
                  className="sat-dot"
                  onClick={() => onSelect(sat.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${sat.name}`}
                  onKeyDown={(e) => e.key === "Enter" && onSelect(sat.id)}
                />
                {showLabel && (
                  <g className="sat-label" transform={`translate(${x + 10}, ${y - 8})`}>
                    <text className="sat-label-name">{sat.name}</text>
                    <text className="sat-label-meta" y="13">
                      {Math.round(sat.elevation)}° · {CATEGORY_LABEL[sat.category] || "Object"}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          <circle cx={CENTER} cy={CENTER} r="3" fill="var(--gold)" />
        </svg>

        {status === "loading" && satellites.length === 0 && (
          <div className="sky-overlay">Reading orbital elements…</div>
        )}
        {status === "error" && satellites.length === 0 && (
          <div className="sky-overlay">Couldn't reach the tracking service.</div>
        )}
      </div>

      <div className="sky-legend">
        <span><i className="legend-dot sat-station" /> Stations</span>
        <span><i className="legend-dot sat-science" /> Science</span>
        <span><i className="legend-dot sat-weather" /> Weather</span>
        <span><i className="legend-dot sat-comms" /> Communications</span>
        <span className="sky-legend-note">{visible.length} above the horizon</span>
      </div>
    </section>
  );
}
