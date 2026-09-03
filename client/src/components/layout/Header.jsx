import {
  Crosshair,
  MapPin,
  Radio,
  Search,
} from "lucide-react";

export default function Header({
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
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const date = now.toLocaleDateString([], {
    weekday: "short", day: "numeric", month: "short",
  });

  return (
    <header className="app-header">
      <div className="observer">
        <div className="observer-icon"><MapPin size={15} /></div>
        <div className="observer-copy">
          <span>OBSERVING FROM</span>
          <strong>{location?.name || "Your location"}</strong>
        </div>
        <button className="location-button" onClick={onRefreshLocation} title={locationStatus}>
          <Crosshair size={12} />
          {location?.source === "GPS" ? "GPS LOCKED" : "USE MY LOCATION"}
        </button>
      </div>

      <div className="global-search">
        <Search size={15} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search satellites, missions, operators..."
          aria-label="Search satellites"
        />
        <kbd>⌘ K</kbd>

        {query && (
          <div className="search-dropdown">
            {satellites.length > 0 ? (
              satellites.slice(0, 7).map((satellite) => (
                <button key={satellite.id} onClick={() => onSelectSatellite(satellite.id)}>
                  <span className={`search-dot sat-${satellite.color}`} />
                  <span>
                    <b>{satellite.name}</b>
                    <small>{satellite.type} · NORAD {satellite.id}</small>
                  </span>
                  <em>{satellite.elevation >= 0 ? `${Math.round(satellite.elevation)}°` : "BELOW"}</em>
                </button>
              ))
            ) : (
              <div className="search-no-results">No tracked objects match your search.</div>
            )}
          </div>
        )}
      </div>

      <div className="header-system">
        <div className="system-live"><span className="pulse-dot" /> LIVE</div>
        <div className="system-coords">
          <span>{Number(location?.lat || 0).toFixed(2)}°N</span>
          <span>{Number(location?.lng || 0).toFixed(2)}°E</span>
        </div>
        <div className="system-time">
          <strong>{time}</strong>
          <small>{date}</small>
        </div>
        <Radio size={15} className="radio-icon" />
      </div>
    </header>
  );
}
