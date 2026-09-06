import ErrorBoundary from "../components/ErrorBoundary";
import PageHeader from "../components/layout/PageHeader";
import UpcomingPasses from "../components/satellites/UpcomingPasses";

export default function PassesPage({ location, selectedId, onSelect }) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Visibility forecast"
        title="Upcoming passes"
        description="The next time each tracked object rises above your horizon, computed from current orbital elements."
        aside={<span className="page-header-count">Next 24 hours</span>}
      />

      <ErrorBoundary label="The pass forecast">
        <UpcomingPasses
          location={location}
          selectedId={selectedId}
          onSelect={onSelect}
          hours={24}
          limit={24}
        />
      </ErrorBoundary>
    </div>
  );
}
