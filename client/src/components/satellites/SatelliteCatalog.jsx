import { ChevronRight, Search, Satellite } from "lucide-react";

import { deg } from "../../lib/format";
import { colorKey, isIndian, searchMatches } from "../../lib/satelliteMeta";
import EmptyState from "../ui/EmptyState";
import Icon from "../ui/Icon";

/*
 * The full tracked catalog. Objects between -12° and 0° are in
 * the payload too, so elevation is reported as a real negative
 * figure with a "below horizon" note rather than being blanked.
 */
function CatalogRow({ satellite, isSelected, onSelect }) {
  const above = Number(satellite.elevation) >= 0;

  return (
    <button
      type="button"
      className={`catalog-row${isSelected ? " is-selected" : ""}`}
      onClick={() => onSelect(satellite.id)}
    >
      <span className={`catalog-dot sat-${colorKey(satellite)}`} />

      <span className="catalog-identity">
        <strong>
          {satellite.name}
          {isIndian(satellite) && <em className="india-chip">INDIA</em>}
        </strong>
        <small>
          {[satellite.mission, satellite.type, satellite.operator]
            .filter(Boolean)
            .join(" · ")}
        </small>
      </span>

      <span className="catalog-norad">NORAD {satellite.id}</span>

      <span className={`catalog-elevation${above ? "" : " is-below"}`}>
        <strong>{deg(satellite.elevation)}</strong>
        <small>{above ? satellite.status ?? "above" : "below horizon"}</small>
      </span>

      <Icon as={ChevronRight} size={14} className="catalog-chevron" />
    </button>
  );
}

export default function SatelliteCatalog({
  satellites,
  selectedId,
  onSelect,
  query,
  onQueryChange,
}) {
  const filtered = satellites.filter((satellite) =>
    searchMatches(satellite, query)
  );

  const indian = filtered.filter(isIndian);
  const rest = filtered.filter((satellite) => !isIndian(satellite));

  return (
    <div className="catalog-page">
      <div className="catalog-toolbar">
        <label className="search-field">
          <Icon as={Search} size={14} />
          <input
            type="search"
            value={query}
            placeholder="Filter by name, mission, operator or NORAD ID…"
            onChange={(event) => onQueryChange(event.target.value)}
            aria-label="Filter tracked objects"
          />
        </label>
        <span className="catalog-count">
          {filtered.length} of {satellites.length} objects
        </span>
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={Satellite}
          title="No matching objects"
          message={
            satellites.length === 0
              ? "The catalog is still loading, or the orbital source is unavailable."
              : "Try another name, mission, operator or NORAD ID."
          }
        />
      )}

      {indian.length > 0 && (
        <section className="catalog-group">
          <header>
            <span className="eyebrow">🇮🇳 Indian missions</span>
            <h2>ISRO and NSIL objects in range</h2>
          </header>
          <div className="catalog-list">
            {indian.map((satellite) => (
              <CatalogRow
                key={satellite.id}
                satellite={satellite}
                isSelected={satellite.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="catalog-group">
          <header>
            <span className="eyebrow">Active catalog</span>
            <h2>All tracked objects near your sky</h2>
          </header>
          <div className="catalog-list">
            {rest.map((satellite) => (
              <CatalogRow
                key={satellite.id}
                satellite={satellite}
                isSelected={satellite.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
