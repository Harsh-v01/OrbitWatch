export default function SelectedSatellite({ satellite }) {
  if (!satellite) {
    return (
      <section className="info-card selected-info empty">
        <p>Nothing selected yet. Pick a point on the sky chart or a row from the list.</p>
      </section>
    );
  }

  const isAbove = satellite.elevation >= 0;

  return (
    <section className="info-card selected-info">
      <div className="selected-name">
        <span className={`big-dot sat-${satellite.color}`} />
        <div>
          <h3>{satellite.name}</h3>
          <p>
            {satellite.type} · {satellite.operator}
          </p>
        </div>
      </div>

      <p className="selected-status">
        {isAbove ? `${satellite.status} · ${Math.round(satellite.elevation)}° above the horizon` : "Currently below the horizon"}
      </p>

      <div className="selected-facts">
        <span>
          <small>Altitude</small>
          <strong>{satellite.altitude.toLocaleString()} km</strong>
        </span>
        <span>
          <small>Speed</small>
          <strong>{satellite.velocity} km/s</strong>
        </span>
        <span>
          <small>Range</small>
          <strong>{satellite.distance.toLocaleString()} km</strong>
        </span>
      </div>
    </section>
  );
}
