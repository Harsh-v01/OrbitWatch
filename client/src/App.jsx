import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Info, Radar, Satellite } from "lucide-react";

import { useObserverLocation } from "./hooks/useObserverLocation";
import { useSatellites } from "./hooks/useSatellites";
import { useTheme } from "./hooks/useTheme";
import { countAboveHorizon } from "./lib/satelliteMeta";

import ErrorBoundary from "./components/ErrorBoundary";
import NavTabs from "./components/layout/NavTabs";
import TopBar from "./components/layout/TopBar";

import AboutPage from "./pages/AboutPage";
import CatalogPage from "./pages/CatalogPage";
import PassesPage from "./pages/PassesPage";
import SkyPage from "./pages/SkyPage";

/*
 * App owns only what has to be shared: where we are observing
 * from, the live catalog, which object is selected, and which
 * section is on screen. Everything visual lives in a component.
 */
export default function App() {
  const {
    location,
    status: locationStatus,
    refreshLocation,
  } = useObserverLocation();

  const { satellites, status, error, updatedAt, orbitalData } =
    useSatellites(location);

  const { theme, setTheme } = useTheme();

  const [section, setSection] = useState("sky");
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(() => new Date());

  /* One clock for the whole app rather than a timer per panel. */
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /*
   * Open on the most prominent object in the sky so the page is
   * never empty, but never override a deliberate choice.
   */
  useEffect(() => {
    if (selectedId !== null || satellites.length === 0) return;

    const highest = satellites.find(
      (satellite) => Number(satellite.elevation) >= 0
    );

    setSelectedId((highest ?? satellites[0]).id);
  }, [satellites, selectedId]);

  const selected = useMemo(
    () => satellites.find((satellite) => satellite.id === selectedId) ?? null,
    [satellites, selectedId]
  );

  /*
   * A selected object can genuinely leave the payload when it
   * sets. That is a real state, not an error.
   */
  const selectionLost =
    selectedId !== null && !selected && satellites.length > 0;

  const handleSelect = (id) => {
    setSelectedId(id);
    setSection("sky");
  };

  const sections = [
    { id: "sky", label: "Sky", icon: Radar, badge: countAboveHorizon(satellites) || null },
    { id: "catalog", label: "Catalog", icon: Satellite, badge: satellites.length || null },
    { id: "passes", label: "Passes", icon: CalendarClock, badge: null },
    { id: "about", label: "About", icon: Info, badge: null },
  ];

  return (
    <div className="app-shell">
      <ErrorBoundary label="The header">
        <TopBar
          location={location}
          locationStatus={locationStatus}
          onRefreshLocation={refreshLocation}
          satellites={satellites}
          query={query}
          onQueryChange={setQuery}
          onSelect={handleSelect}
          theme={theme}
          onThemeChange={setTheme}
          status={status}
          orbitalData={orbitalData}
          now={now}
        />
      </ErrorBoundary>

      <NavTabs sections={sections} active={section} onChange={setSection} />

      <main className="app-main">
        {section === "sky" && (
          <SkyPage
            location={location}
            satellites={satellites}
            status={status}
            error={error}
            orbitalData={orbitalData}
            updatedAt={updatedAt}
            now={now}
            selectedId={selectedId}
            selected={selected}
            selectionLost={selectionLost}
            onSelect={handleSelect}
          />
        )}

        {section === "catalog" && (
          <CatalogPage
            satellites={satellites}
            status={status}
            error={error}
            orbitalData={orbitalData}
            selectedId={selectedId}
            onSelect={handleSelect}
            query={query}
            onQueryChange={setQuery}
          />
        )}

        {section === "passes" && (
          <PassesPage
            location={location}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        )}

        {section === "about" && <AboutPage />}
      </main>

      <footer className="app-footer">
        <span>OrbitWatch · live orbital observation</span>
        <span>Positions refresh every 15 seconds</span>
      </footer>
    </div>
  );
}
