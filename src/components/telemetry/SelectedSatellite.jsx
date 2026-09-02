export default function SelectedSatellite({ satellite }) {
  return (
    <section className="info-card selected-info">
      <div className="info-card-head"><span>SELECTED</span><em>{satellite.status}</em></div>
      <div className="selected-name"><span className={`big-dot ${satellite.color}`} /><div><h3>{satellite.name}</h3><p>{satellite.subtitle}</p></div></div>
      <div className="selected-facts"><span><small>Altitude</small><strong>{satellite.altitude} km</strong></span><span><small>Velocity</small><strong>{satellite.velocity} km/s</strong></span></div>
    </section>
  );
}
