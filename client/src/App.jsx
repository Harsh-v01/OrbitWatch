import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Code2,
  Radio,
  Sparkles,
} from "lucide-react";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import DashboardStats from "./components/dashboard/DashboardStats";
import SystemStatus from "./components/dashboard/SystemStatus";
import SkyRadar from "./components/radar/SkyRadar";
import UpcomingPasses from "./components/satellites/UpcomingPasses";
import SpaceWeather from "./components/satellites/SpaceWeather";
import SatelliteCatalog from "./components/satellites/SatelliteCatalog";
import SelectedSatellite from "./components/telemetry/SelectedSatellite";
import Telemetry from "./components/telemetry/Telemetry";
import AzimuthCard from "./components/telemetry/AzimuthCard";
import { useObserverLocation } from "./hooks/useObserverLocation";
import { useSatellites } from "./hooks/useSatellites";

function PageIntro({ eyebrow, title, description, meta }) {
  return (
    <div className="page-intro">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {meta && <div className="intro-meta">{meta}</div>}
    </div>
  );
}

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
    if (!selectedId && satellites.length > 0) setSelectedId(satellites[0].id);
  }, [satellites, selectedId]);

  const selectedSatellite = satellites.find((satellite) => satellite.id === selectedId) || null;

  const filteredSatellites = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return satellites;
    return satellites.filter((satellite) =>
      [satellite.name, satellite.type, satellite.operator, satellite.mission]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value))
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
          onSelectSatellite={handleSelectSatellite}
        />

        <div className="content-wrap">
          {section === "sky" && (
            <>
              <PageIntro
                eyebrow="LIVE ORBITAL MONITOR"
                title="What’s above you"
                description="A real-time view of objects crossing your sky, calculated from orbital elements for your observing location."
                meta={
                  <div className="intro-live">
                    <span className="pulse-dot" />
                    <strong>{satellites.filter((s) => s.elevation >= 0).length}</strong>
                    <span>above horizon</span>
                    <i />
                    <span>{secondsAgo === null ? "SYNCING" : secondsAgo <= 1 ? "UPDATED NOW" : `UPDATED ${secondsAgo}s AGO`}</span>
                  </div>
                }
              />

              <DashboardStats satellites={satellites} status={satStatus} updatedAt={updatedAt} location={location} />
              <SystemStatus status={satStatus} error={satError} orbitalData={orbitalData} />

              <div className="workspace-grid">
                <div className="workspace-main">
                  <SkyRadar
                    satellites={satellites}
                    selectedId={selectedId}
                    onSelect={handleSelectSatellite}
                    location={location}
                    now={now}
                    status={satStatus}
                  />

                  <div className="telemetry-grid">
                    <SelectedSatellite satellite={selectedSatellite} />
                    <Telemetry satellite={selectedSatellite} />
                    <AzimuthCard satellite={selectedSatellite} />
                  </div>
                </div>

                <aside className="workspace-side">
                  <UpcomingPasses location={location} selectedId={selectedId} onSelect={handleSelectSatellite} />
                  <SpaceWeather />
                </aside>
              </div>
            </>
          )}

          {section === "satellites" && (
            <>
              <PageIntro
                eyebrow="OBJECT CATALOG"
                title="Tracked satellites"
                description="Explore the orbital objects currently available to OrbitWatch. Indian missions are surfaced separately when present."
                meta={<span className="intro-count">{filteredSatellites.length} OBJECTS</span>}
              />
              <SatelliteCatalog
                satellites={satellites}
                selectedId={selectedId}
                onSelect={handleSelectSatellite}
                query={query}
                onQueryChange={setQuery}
              />
            </>
          )}

          {section === "passes" && (
            <>
              <PageIntro
                eyebrow="VISIBILITY FORECAST"
                title="Upcoming passes"
                description="Predicted opportunities to see tracked objects from your current observing position."
              />
              <UpcomingPasses location={location} selectedId={selectedId} onSelect={handleSelectSatellite} expanded />
            </>
          )}

          {section === "about" && (
            <>
              <PageIntro
                eyebrow="ABOUT ORBITWATCH"
                title="A small window into orbit."
                description="OrbitWatch turns orbital mechanics into something you can actually explore."
              />
              <section className="about-grid">
                <div className="about-hero">
                  <div className="about-orbit"><span /></div>
                  <span className="eyebrow">BUILT AROUND REAL ORBITS</span>
                  <h2>Not a decorative sky map.</h2>
                  <p>
                    OrbitWatch propagates satellite positions from orbital elements using SGP4 and converts them into azimuth,
                    elevation, range and altitude for your exact observing position.
                  </p>
                  <div className="about-flow">
                    <span>ORBITAL SOURCE</span><ChevronRight size={14} />
                    <span>SGP4</span><ChevronRight size={14} />
                    <span>OBSERVER</span><ChevronRight size={14} />
                    <span>LIVE SKY</span>
                  </div>
                </div>
                <div className="about-stack">
                  <div className="about-card"><Radio size={17} /><div><b>Live propagation</b><p>Positions are calculated rather than read from a static lookup table.</p></div></div>
                  <div className="about-card"><Sparkles size={17} /><div><b>Human-readable astronomy</b><p>Star fields, bearings and pass quality are designed to help you understand what you see.</p></div></div>
                  <div className="about-card">
                    <Code2 size={17} />
                    <div>
                      <b>Open project</b>
                      <p>OrbitWatch is structured as a React client with a small Express orbital service.</p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        <footer className="app-footer">
          <span>ORBITWATCH <b>·</b> LIVE ORBITAL INTELLIGENCE</span>
          <span>POSITIONS REFRESH EVERY 15 SECONDS</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
