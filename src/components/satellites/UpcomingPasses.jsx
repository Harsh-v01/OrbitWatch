export default function UpcomingPasses({ satellites, selectedId, onSelect, expanded = false }) {
  const list = expanded ? satellites : satellites.slice(0, 4);

  return (
    <section className={`panel passes ${expanded ? "passes-expanded" : ""}`}>
      <div className="panel-head">
        <div><h2>Upcoming passes</h2><p>Next times to look up</p></div>
        {!expanded && <button>Today</button>}
      </div>

      <div className="pass-list">
        {list.map((satellite) => (
          <button
            key={satellite.id}
            className={`pass ${selectedId === satellite.id ? "selected" : ""}`}
            onClick={() => onSelect(satellite.id)}
          >
            <span className={`pass-dot ${satellite.color}`} />
            <span className="pass-main">
              <strong>{satellite.name}</strong>
              <small>{satellite.pass.duration} · max {satellite.pass.maxElevation}°</small>
            </span>
            <time>{satellite.pass.time}</time>
          </button>
        ))}
      </div>
      <div className="pass-footer">Times are local to {"your location"}.</div>
    </section>
  );
}
