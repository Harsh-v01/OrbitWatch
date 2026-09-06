import ErrorBoundary from "../components/ErrorBoundary";
import FeedBanner from "../components/layout/FeedBanner";
import PageHeader from "../components/layout/PageHeader";
import SatelliteCatalog from "../components/satellites/SatelliteCatalog";
import { countAboveHorizon } from "../lib/satelliteMeta";

export default function CatalogPage({
  satellites,
  status,
  error,
  orbitalData,
  selectedId,
  onSelect,
  query,
  onQueryChange,
}) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Object catalog"
        title="Tracked satellites"
        description="Everything OrbitWatch is currently propagating for your position, including objects just below the horizon."
        aside={
          <span className="page-header-count">
            {countAboveHorizon(satellites)} above horizon
          </span>
        }
      />

      <FeedBanner status={status} error={error} orbitalData={orbitalData} />

      <ErrorBoundary label="The satellite catalog">
        <SatelliteCatalog
          satellites={satellites}
          selectedId={selectedId}
          onSelect={onSelect}
          query={query}
          onQueryChange={onQueryChange}
        />
      </ErrorBoundary>
    </div>
  );
}
