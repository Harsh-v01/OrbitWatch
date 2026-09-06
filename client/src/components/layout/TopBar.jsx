import { useMemo, useState } from "react";
import {
  Crosshair,
  MapPin,
  Monitor,
  Moon,
  Orbit,
  RefreshCw,
  Search,
  Sun,
  X,
} from "lucide-react";

import { clock, latitude, longitude } from "../../lib/format";
import { feedState } from "../../lib/feed";
import { isIndian, searchMatches } from "../../lib/satelliteMeta";
import Icon from "../ui/Icon";

const THEME_CHOICES = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
];

const MAX_RESULTS = 7;

export default function TopBar({
  location,
  locationStatus,
  onRefreshLocation,
  satellites = [],
  query,
  onQueryChange,
  onSelect,
  theme,
  onThemeChange,
  status,
  orbitalData,
  now,
}) {
  const [open, setOpen] = useState(false);

  const feed = feedState(status, orbitalData);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    return satellites
      .filter((satellite) => searchMatches(satellite, query))
      .slice(0, MAX_RESULTS);
  }, [satellites, query]);

  const handleSelect = (id) => {
    onSelect?.(id);
    onQueryChange("");
    setOpen(false);
  };

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="brand-mark" aria-hidden="true">
          <Icon as={Orbit} size={18} />
        </span>
        <span className="brand-text">
          <strong>OrbitWatch</strong>
          <small>Sky observation</small>
        </span>
      </div>

      <div className="topbar-observer">
        <span className="eyebrow">Observing from</span>
        <div className="observer-line">
          <Icon as={MapPin} size={13} />
          <strong>{location?.name ?? "Unknown position"}</strong>
          <span className="observer-status">{locationStatus}</span>
          <button
            type="button"
            className="icon-button"
            onClick={onRefreshLocation}
            title="Use my current location"
            aria-label="Use my current location"
          >
            <Icon as={Crosshair} size={13} />
          </button>
        </div>
        <span className="observer-coords">
          {latitude(location?.lat)} {longitude(location?.lng)}
        </span>
      </div>

      <div
        className="topbar-search"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setOpen(false);
          }
        }}
      >
        <label className="search-field">
          <Icon as={Search} size={14} />
          <input
            type="search"
            value={query}
            placeholder="Search satellites, missions, NORAD ID…"
            onChange={(event) => {
              onQueryChange(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            aria-label="Search tracked satellites"
          />
          {query && (
            <button
              type="button"
              className="icon-button"
              onClick={() => {
                onQueryChange("");
                setOpen(false);
              }}
              aria-label="Clear search"
            >
              <Icon as={X} size={13} />
            </button>
          )}
        </label>

        {open && query.trim() && (
          <div className="search-results" role="listbox">
            {results.length === 0 && (
              <p className="search-empty">
                No tracked object matches “{query.trim()}”.
              </p>
            )}

            {results.map((satellite) => (
              <button
                type="button"
                key={satellite.id}
                className="search-result"
                onClick={() => handleSelect(satellite.id)}
              >
                <span className="search-result-name">
                  {satellite.name}
                  {isIndian(satellite) && <em>INDIA</em>}
                </span>
                <span className="search-result-meta">
                  NORAD {satellite.id}
                  {satellite.operator ? ` · ${satellite.operator}` : ""}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className="topbar-theme"
        role="radiogroup"
        aria-label="Colour theme"
      >
        {THEME_CHOICES.map((choice) => (
          <button
            type="button"
            key={choice.value}
            role="radio"
            aria-checked={theme === choice.value}
            className={theme === choice.value ? "is-active" : ""}
            onClick={() => onThemeChange(choice.value)}
            title={`${choice.label} theme`}
          >
            <Icon as={choice.icon} size={14} />
            <span className="sr-only">{choice.label}</span>
          </button>
        ))}
      </div>

      <div className="topbar-feed">
        <span className={`feed-pill feed-${feed.tone}`} title={feed.detail}>
          <i className="feed-dot" />
          {feed.label}
        </span>
        <div className="topbar-clock">
          <strong>{clock(now)}</strong>
          <small>Local time</small>
        </div>
        {(status === "error" || status === "unavailable") && (
          <span className="feed-retry" title="Retrying automatically">
            <Icon as={RefreshCw} size={12} />
          </span>
        )}
      </div>
    </header>
  );
}
