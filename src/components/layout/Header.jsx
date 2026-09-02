function Header({
  location,
  locationStatus,
  onRefreshLocation,
  query,
  onQueryChange,
  now,
  satellites,
  onSelectSatellite,
}) {
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <header className="topbar">
      <div className="mobile-brand">
        <span className="brand-mark">◎</span>
        <span>ORBITWATCH</span>
      </div>

      <div className="location-block">
        <div className="location-pin">⌖</div>

        <div>
          <span className="location-label">OBSERVING FROM</span>
          <strong>{location?.name || "Pune, India"}</strong>
        </div>

        <button
          className="location-refresh"
          onClick={onRefreshLocation}
          title="Refresh location"
        >
          ↻
        </button>
      </div>

      <div className="search-wrap">
        <span className="search-icon">⌕</span>

        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Find a satellite..."
          aria-label="Find a satellite"
        />

        <kbd>⌘ K</kbd>

        {query && satellites.length > 0 && (
          <div className="search-results">
            {satellites.slice(0, 5).map((satellite) => (
              <button
                key={satellite.id}
                onClick={() => onSelectSatellite(satellite.id)}
              >
                <span
                  className="result-dot"
                  style={{
                    backgroundColor: satellite.color,
                  }}
                />

                <span>
                  <strong>{satellite.name}</strong>
                  <small>{satellite.subtitle}</small>
                </span>

                <span className="result-arrow">↗</span>
              </button>
            ))}
          </div>
        )}

        {query && satellites.length === 0 && (
          <div className="search-empty">
            No satellites found.
          </div>
        )}
      </div>

      <div className="header-meta">
        <div className="coordinates">
          <span>
            {Number(location?.lat || 0).toFixed(4)}° N
          </span>

          <span>
            {Number(location?.lng || 0).toFixed(4)}° E
          </span>
        </div>

        <div className="clock">
          <span className="clock-label">LOCAL TIME</span>
          <strong>{time}</strong>
        </div>

        <div
          className="connection-status"
          title={locationStatus}
        >
          <span />
          <small>LIVE</small>
        </div>
      </div>
    </header>
  );
}

export default Header;