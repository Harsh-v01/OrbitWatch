export default function Telemetry({ satellite }) {
  return (
    <section className="info-card telemetry">
      <div className="info-card-head"><span>POSITION</span><em>NORAD {satellite.id}</em></div>
      <div className="telemetry-row"><div><small>AZIMUTH</small><strong>{satellite.azimuth}°</strong></div><div><small>ELEVATION</small><strong>{satellite.elevation}°</strong></div><div><small>DISTANCE</small><strong>{satellite.distance} km</strong></div></div>
      <div className="progress"><span style={{ width: `${Math.min(100, satellite.elevation / 0.9)}%` }} /></div>
      <p className="muted">Higher elevation generally means an easier pass to spot.</p>
    </section>
  );
}
