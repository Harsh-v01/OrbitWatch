import { useEffect, useMemo, useState } from "react";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import SkyRadar from "./components/radar/SkyRadar";
import SpaceWeather from "./components/satellites/SpaceWeather";
import UpcomingPasses from "./components/satellites/UpcomingPasses";
import SelectedSatellite from "./components/telemetry/SelectedSatellite";
import Telemetry from "./components/telemetry/Telemetry";
import AzimuthCard from "./components/telemetry/AzimuthCard";
import { useObserverLocation } from "./hooks/useObserverLocation";
import { useSatellites } from "./hooks/useSatellites";

function App() {
  const { location, status: locationStatus, refreshLocation } = useObserverLocation();
  const { satellites, status: satStatus, error: satError, updatedAt, orbitalData } = useSatellites(location);

  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("sky");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedId && satellites.length > 0) {
      setSelectedId(satellites[0].id);
    }
  }, [satellites, selectedId]);

  const selectedSatellite = satellites.find((satellite) => satellite.id === selectedId) || null;

  const filteredSatellites = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return satellites;
    return satellites.filter((satellite) =>
      [satellite.name, satellite.type, satellite.operator].filter(Boolean).some((field) => field.toLowerCase().includes(value))
    );
  }, [query, satellites]);

  const handleSelectSatellite = (id) => {
    setSelectedId(id);
    setSection("sky");
  };

  const secondsAgo = updatedAt ? Math.max(0, Math.round((now - updatedAt) / 1000)) : null;

  return (
    <div className="app-shell">
      <Sidebar activeSection={section} onSectionChange={setSection} />

      <main className="main-content">
        <Header
          location={location}
          locationStatus={locationStatus}
          onRefreshLocation={refreshLocation}
          query={query}
          onQueryChange={setQuery}
          now={now}
          satellites={filteredSatellites}
          selectedId={selectedId}
          onSelectSatellite={handleSelectSatellite}
        />

        {section === "sky" && (
          <>
            <div className="page-intro">
              <div>
                <h1>What&rsquo;s above right now</h1>
                <p>A live view of the satellites currently crossing your sky, propagated from real orbital data.</p>
              </div>

              <div className="sky-meta">
                <span>{satellites.filter((s) => s.elevation >= 0).length} above the horizon</span>
                <span>{satStatus === "stale" ? "using cached orbital data" : secondsAgo === null ? "loading" : secondsAgo <= 1 ? "updated just now" : `updated ${secondsAgo}s ago`}</span>
              </div>
            </div>

            {satError && satellites.length === 0 && (
              <div className="error-banner">
                {satStatus === "unavailable"
                  ? "Orbital data is temporarily unavailable. Add a real cache or retry when CelesTrak is reachable."
                  : `Couldn\u2019t reach the tracking service (${satError}). Make sure the OrbitWatch server is running on port 8787.`}
              </div>
            )}

            <div className="dashboard">
              <div className="main-column">
                <SkyRadar satellites={satellites} selectedId={selectedId} onSelect={handleSelectSatellite} location={location} now={now} status={satStatus} />

                <div className="below-grid">
                  <SelectedSatellite satellite={selectedSatellite} />
                  <Telemetry satellite={selectedSatellite} />
                  <AzimuthCard satellite={selectedSatellite} />
                </div>
              </div>

              <div className="side-column">
                <UpcomingPasses location={location} selectedId={selectedId} onSelect={handleSelectSatellite} />
                <SpaceWeather />
              </div>
            </div>
          </>
        )}

        {section === "passes" && (
          <section className="simple-page">
            <div className="page-intro">
              <div>
                <h1>Upcoming passes</h1>
                <p>Every rise over your horizon in the next day.</p>
              </div>
            </div>

            <UpcomingPasses location={location} selectedId={selectedId} onSelect={handleSelectSatellite} expanded />
          </section>
        )}

        {section === "satellites" && (
          <section className="simple-page">
            <div className="page-intro">
              <div>
                <h1>Tracked objects</h1>
                <p>
                  {orbitalData?.cached
                    ? `${satellites.length} objects currently in range, propagated from ${orbitalData.stale ? "cached" : "current"} orbital data.`
                    : "Orbital data is temporarily unavailable."}
                </p>
              </div>
            </div>

            <div className="catalog-list">
              <div className="catalog-head-row">
                <span>Name</span>
                <span>Type</span>
                <span>Elevation</span>
                <span>Altitude</span>
              </div>
              {filteredSatellites.map((satellite) => (
                <button key={satellite.id} className={`catalog-row ${selectedId === satellite.id ? "selected" : ""}`} onClick={() => handleSelectSatellite(satellite.id)}>
                  <span className="catalog-name">
                    <i className={`legend-dot sat-${satellite.color}`} />
                    {satellite.name}
                  </span>
                  <span>{satellite.type}</span>
                  <span>{satellite.elevation >= 0 ? `${Math.round(satellite.elevation)}°` : "below horizon"}</span>
                  <span>{satellite.altitude.toLocaleString()} km</span>
                </button>
              ))}
              {filteredSatellites.length === 0 && <p className="muted">No tracked objects match your search.</p>}
            </div>
          </section>
        )}

        {section === "about" && (
          <section className="simple-page">
            <div className="page-intro">
              <div>
                <h1>A small window into orbit</h1>
                <p>Understand what&rsquo;s moving above you without needing to understand orbital mechanics first.</p>
              </div>
            </div>

            <div className="about-copy">
              <p>
                OrbitWatch pulls current orbital element sets for a sample of well-known satellites and active constellations
                from CelesTrak, then propagates each one&rsquo;s position for your exact coordinates using SGP4 &mdash; the
                same model used to generate the published elements in the first place.
              </p>
              <p>
                The sky chart plots those positions against a real background star field, computed from each star&rsquo;s
                catalog coordinates and your local sidereal time, so the layout is a genuine view of your sky rather than a
                decorative backdrop.
              </p>
              <div className="about-note">
                <strong>How it works</strong>
                <p>Browser (React) &rarr; OrbitWatch API (Express) &rarr; CelesTrak element sets, propagated with satellite.js on every request.</p>
              </div>
            </div>
          </section>
        )}

        <footer>
          <span>OrbitWatch</span>
          <span>Positions update automatically every 15 seconds</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
