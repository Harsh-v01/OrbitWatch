export default function AzimuthCard({ satellite }) {
  return (
    <section className="info-card direction-card">
      <div className="info-card-head"><span>LOOK TOWARD</span><em>Compass</em></div>
      <div className="compass-view">
        <div className="compass-circle"><span>N</span><span>E</span><span>S</span><span>W</span><i style={{ transform: `rotate(${satellite.azimuth}deg)` }} /></div>
        <div><strong>{satellite.azimuth}°</strong><small>azimuth</small><p>Look roughly {satellite.azimuth < 45 || satellite.azimuth > 315 ? "north" : satellite.azimuth < 135 ? "east" : satellite.azimuth < 225 ? "south" : "west"}.</p></div>
      </div>
    </section>
  );
}
