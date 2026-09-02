import { useEffect, useMemo, useState } from "react";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import SkyRadar from "./components/radar/SkyRadar";
import SpaceWeather from "./components/satellites/SpaceWeather";
import UpcomingPasses from "./components/satellites/UpcomingPasses";
import SelectedSatellite from "./components/telemetry/SelectedSatellite";
import Telemetry from "./components/telemetry/Telemetry";
import AzimuthCard from "./components/telemetry/AzimuthCard";
import { satellites } from "./data/satellites";
import { useObserverLocation } from "./hooks/useObserverLocation";

function App() {
  const { location, status, refreshLocation } =
    useObserverLocation();

  const [selectedId, setSelectedId] = useState(
    satellites[0]?.id
  );

  const [query, setQuery] = useState("");
  const [section, setSection] = useState("sky");
  const [view, setView] = useState("sky");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const selectedSatellite =
    satellites.find(
      (satellite) => satellite.id === selectedId
    ) || satellites[0];

  const filteredSatellites = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return satellites;
    }

    return satellites.filter((satellite) =>
      [
        satellite.name,
        satellite.subtitle,
        satellite.type,
      ]
        .filter(Boolean)
        .some((field) =>
          field.toLowerCase().includes(value)
        )
    );
  }, [query]);

  const handleSelectSatellite = (id) => {
    setSelectedId(id);
    setSection("sky");
  };

  return (
    <div className="app-shell">
      <Sidebar
        activeSection={section}
        onSectionChange={setSection}
      />

      <main className="main-content">
        <Header
          location={location}
          locationStatus={status}
          onRefreshLocation={refreshLocation}
          query={query}
          onQueryChange={setQuery}
          now={now}
          satellites={filteredSatellites}
          selectedId={selectedId}
          onSelectSatellite={handleSelectSatellite}
        />

        {/* =====================================================
            SKY
            ===================================================== */}

        {section === "sky" && (
          <>
            <div className="page-intro">
              <div>
                <div className="eyebrow">
                  <span className="live-dot" />
                  LIVE SKY
                </div>

                <h1>
                  What&apos;s above{" "}
                  <span>right now.</span>
                </h1>

                <p>
                  A quiet view of the satellites currently
                  crossing your sky.
                </p>
              </div>

              <div className="sky-meta">
                <span>
                  {satellites.length
                    .toString()
                    .padStart(2, "0")}{" "}
                  OBJECTS
                </span>

                <span>
                  {location?.lat?.toFixed(2)}°
                  {" / "}
                  {location?.lng?.toFixed(2)}°
                </span>
              </div>
            </div>

            <div className="dashboard">
              <div className="main-column">
                <SkyRadar
                  satellites={satellites}
                  selectedId={selectedId}
                  onSelect={handleSelectSatellite}
                  view={view}
                  onViewChange={setView}
                />

                <div className="below-grid">
                  <SelectedSatellite
                    satellite={selectedSatellite}
                  />

                  <Telemetry
                    satellite={selectedSatellite}
                  />

                  <AzimuthCard
                    satellite={selectedSatellite}
                  />
                </div>
              </div>

              <div className="side-column">
                <UpcomingPasses
                  satellites={satellites}
                  selectedId={selectedId}
                  onSelect={handleSelectSatellite}
                />

                <SpaceWeather />
              </div>
            </div>
          </>
        )}

        {/* =====================================================
            PASSES
            ===================================================== */}

        {section === "passes" && (
          <section className="simple-page">
            <div className="page-intro">
              <div>
                <div className="eyebrow">
                  PASS PREDICTIONS
                </div>

                <h1>Upcoming passes.</h1>

                <p>
                  The next opportunities to look up.
                </p>
              </div>
            </div>

            <UpcomingPasses
              satellites={satellites}
              selectedId={selectedId}
              onSelect={handleSelectSatellite}
              expanded
            />
          </section>
        )}

        {/* =====================================================
            SATELLITES
            ===================================================== */}

        {section === "satellites" && (
          <section className="simple-page">
            <div className="page-intro">
              <div>
                <div className="eyebrow">
                  OBJECT CATALOG
                </div>

                <h1>Satellites.</h1>

                <p>
                  Objects currently available to explore.
                </p>
              </div>
            </div>

            <div className="catalog-grid">
              {filteredSatellites.map((satellite) => (
                <button
                  key={satellite.id}
                  className="catalog-card"
                  onClick={() =>
                    handleSelectSatellite(
                      satellite.id
                    )
                  }
                >
                  <span
                    className={`catalog-dot ${satellite.color}`}
                  />

                  <span>
                    <strong>
                      {satellite.name}
                    </strong>

                    <small>
                      {satellite.subtitle}
                    </small>
                  </span>

                  <b>
                    {satellite.altitude} km
                  </b>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* =====================================================
            ABOUT
            ===================================================== */}

        {section === "about" && (
          <section className="simple-page">
            <div className="page-intro">
              <div>
                <div className="eyebrow">
                  ORBITWATCH
                </div>

                <h1>
                  A small window into orbit.
                </h1>

                <p>
                  Understand what&apos;s moving above you
                  without needing to understand orbital
                  mechanics first.
                </p>
              </div>
            </div>

            <div className="about-copy">
              <p>
                OrbitWatch is being built as a simple,
                human-friendly satellite tracker.
              </p>

              <p>
                The current interface uses demonstration
                satellite positions. The next major step is
                connecting real orbital data and calculating
                the position of satellites from the
                observer&apos;s location.
              </p>

              <div className="about-note">
                <strong>Current stage</strong>
                <br />
                Interface → satellite visualization →
                real orbital tracking.
              </div>
            </div>
          </section>
        )}

        <footer>
          <span>ORBITWATCH / SKY OBSERVATION</span>
          <span>BUILT FOR CURIOSITY</span>
        </footer>
      </main>
    </div>
  );
}

export default App;