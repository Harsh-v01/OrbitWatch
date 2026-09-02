function positionFor(satellite) {
  const radius = 42 - satellite.elevation * 0.30;
  const angle = ((satellite.azimuth - 90) * Math.PI) / 180;
  return {
    left: `${50 + Math.cos(angle) * radius}%`,
    top: `${50 + Math.sin(angle) * radius * 0.68}%`,
  };
}

export default function SkyRadar({ satellites, selectedId, onSelect, view, onViewChange }) {
  return (
    <section className={`sky-card ${view === "flat" ? "flat" : ""}`}>
      <div className="sky-card-head">
        <div>
          <h2>Sky over you</h2>
          <p>North is up. The centre is your location.</p>
        </div>
        <div className="view-switch" aria-label="Sky view">
          <button className={view === "sky" ? "selected" : ""} onClick={() => onViewChange("sky")}>Sky</button>
          <button className={view === "flat" ? "selected" : ""} onClick={() => onViewChange("flat")}>Flat</button>
        </div>
      </div>

      <div className="sky-scene">
        <div className="stars" />
        <div className="soft-horizon" />
        <div className="dome">
          <div className="ring ring-a" /><div className="ring ring-b" /><div className="ring ring-c" />
          <div className="axis x" /><div className="axis y" />
          <span className="direction n">N</span><span className="direction e">E</span>
          <span className="direction s">S</span><span className="direction w">W</span>

          {satellites.map((satellite) => {
            const style = positionFor(satellite);
            const selected = selectedId === satellite.id;
            return (
              <button
                key={satellite.id}
                className={`satellite ${satellite.color} ${selected ? "selected" : ""}`}
                style={style}
                onClick={() => onSelect(satellite.id)}
                aria-label={`Select ${satellite.name}`}
              >
                <span className="satellite-point" />
                {(selected || satellite.elevation > 45) && (
                  <span className="satellite-label">
                    <strong>{satellite.name}</strong>
                    <small>{satellite.elevation}° high</small>
                  </span>
                )}
              </button>
            );
          })}

          <div className="observer">You</div>
        </div>

        <div className="sky-note">
          <span><i className="green-dot" /> Visible</span>
          <span><i className="yellow-dot" /> Rising</span>
          <span><i className="red-dot" /> Setting</span>
          <span className="sky-note-text">Click a dot for details</span>
        </div>
      </div>
    </section>
  );
}
