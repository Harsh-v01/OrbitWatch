/*
 * Explains the radar's visual language: colour is category,
 * shape is state. Kept as plain markup outside the SVG.
 */

const CATEGORIES = [
  { key: "station", label: "Stations" },
  { key: "science", label: "Science" },
  { key: "weather", label: "Weather" },
  { key: "comms", label: "Comms" },
  { key: "india", label: "India" },
];

export default function RadarLegend() {
  return (
    <div className="radar-legend">
      <div className="legend-group">
        {CATEGORIES.map((category) => (
          <span key={category.key} className="legend-item">
            <i className={`legend-dot sat-${category.key}`} />
            {category.label}
          </span>
        ))}
      </div>

      <div className="legend-group legend-group-shapes">
        <span className="legend-item">
          <i className="legend-reticle" />
          Tracking
        </span>
        <span className="legend-item">
          <i className="legend-dash" />
          Next pass
        </span>
        <span className="legend-item">
          <i className="legend-line" />
          Observed track
        </span>
      </div>
    </div>
  );
}
