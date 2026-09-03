function Header({ location, locationStatus, onRefreshLocation, query, onQueryChange, now, satellites, onSelectSatellite }) {
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const date = now.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });

  return (
    <header className="topbar">
      <div className="location-block">
        <div>
          <span className="location-label">Observing from</span>
          <strong>{location?.name || "your location"}</strong>
        </div>
        <button className="location-refresh" onClick={onRefreshLocation} title={locationStatus}>
          {location?.source === "GPS" ? "Use precise location" : "Use my location"}
        </button>
      </div>

      <div className="search-wrap">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Find a satellite by name"
          aria-label="Find a satellite"
        />

        {query && satellites.length > 0 && (
          <div className="search-results">
            {satellites.slice(0, 6).map((satellite) => (
              <button key={satellite.id} onClick={() => onSelectSatellite(satellite.id)}>
                <span className={`result-dot sat-${satellite.color}`} />
                <span>
                  <strong>{satellite.name}</strong>
                  <small>{satellite.type}</small>
                </span>
                <span className="result-elevation">
                  {satellite.elevation >= 0 ? `${Math.round(satellite.elevation)}°` : "below horizon"}
                </span>
              </button>
            ))}
          </div>
        )}

        {query && satellites.length === 0 && <div className="search-empty">No tracked satellites match that.</div>}
      </div>

      <div className="header-meta">
        <div className="coordinates">
          <span>{Number(location?.lat || 0).toFixed(2)}°N</span>
          <span>{Number(location?.lng || 0).toFixed(2)}°E</span>
        </div>
        <div className="clock">
          <strong>{time}</strong>
          <small>{date}</small>
        </div>
      </div>
    </header>
  );
}

export default Header;
