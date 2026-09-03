export default function Telemetry({ satellite }) {
  if (!satellite) return null;

  const elevationRatio = Math.max(0, Math.min(100, ((satellite.elevation + 12) / 102) * 100));

  return (
    <section className="info-card telemetry">
      <div className="info-card-head">
        <span>Position now</span>
        <em>NORAD {satellite.id}</em>
      </div>

      <div className="telemetry-row">
        <div>
          <small>Azimuth</small>
          <strong>{satellite.azimuth}°</strong>
        </div>
        <div>
          <small>Elevation</small>
          <strong>{satellite.elevation}°</strong>
        </div>
        <div>
          <small>Distance</small>
          <strong>{satellite.distance.toLocaleString()} km</strong>
        </div>
      </div>

      <div className="progress">
        <span style={{ width: `${elevationRatio}%` }} />
      </div>
      <p className="muted">Higher on this bar means higher in your sky — easier to spot with the naked eye.</p>
    </section>
  );
}
