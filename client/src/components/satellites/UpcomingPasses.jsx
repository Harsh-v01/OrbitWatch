import { ArrowRight, CalendarClock, Clock3, Eye, Star } from "lucide-react";
import { useUpcomingPasses } from "../../hooks/useUpcomingPasses";
import Panel from "../ui/Panel";
import Badge from "../ui/Badge";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${(seconds % 60).toString().padStart(2, "0")}s`;
}
function direction(degrees) {
  if (degrees == null) return "—";
  return ["N","NE","E","SE","S","SW","W","NW"][Math.round(degrees / 45) % 8];
}
function quality(elevation) {
  if (elevation >= 60) return ["Excellent", "green"];
  if (elevation >= 30) return ["Good", "amber"];
  return ["Low", "neutral"];
}

export default function UpcomingPasses({ location, selectedId, onSelect, expanded = false }) {
  const { passes, status } = useUpcomingPasses(location, { hours: expanded ? 24 : 8, limit: expanded ? 24 : 6 });

  return (
    <Panel className={`passes-panel ${expanded ? "expanded" : ""}`}>
      <div className="panel-heading-row">
        <div className="section-heading-inline">
          <div className="section-icon"><CalendarClock size={16} /></div>
          <div>
            <span className="eyebrow">PASS PREDICTION</span>
            <h2>Upcoming passes</h2>
          </div>
        </div>
        <Badge tone="neutral">{passes.length} TRACKED</Badge>
      </div>

      <p className="panel-description">
        {expanded ? "Every predicted rise above your horizon in the next 24 hours." : "The next opportunities worth stepping outside for."}
      </p>

      {status === "loading" && passes.length === 0 && <div className="panel-empty"><Clock3 size={17} /><span>Calculating visibility windows…</span></div>}
      {(status === "error" || status === "unavailable") && passes.length === 0 && <div className="panel-empty"><Eye size={17} /><span>Orbital data is temporarily unavailable.</span></div>}
      {(status === "ready" || status === "stale") && passes.length === 0 && <div className="panel-empty"><Eye size={17} /><span>No visible passes in this window.</span></div>}

      <div className="passes-list">
        {passes.map((pass, index) => {
          const [qualityLabel, qualityTone] = quality(pass.maxElevation);
          const selected = selectedId === pass.id;
          return (
            <button key={`${pass.id}-${pass.start}`} className={`pass-row ${selected ? "selected" : ""}`} onClick={() => onSelect(pass.id)}>
              <div className="pass-row-index">{String(index + 1).padStart(2, "0")}</div>
              <div className={`pass-row-dot sat-${pass.color}`} />
              <div className="pass-row-main">
                <div className="pass-row-title">
                  <strong>{pass.name}</strong>
                  {pass.country === "India" && <span className="india-chip">INDIA</span>}
                </div>
                <span>{formatDate(pass.start)} · {formatTime(pass.start)} → {formatTime(pass.end)} · {formatDuration(pass.durationSeconds)}</span>
              </div>
              <div className="pass-row-peak"><small>PEAK</small><strong>{Math.round(pass.maxElevation)}°</strong></div>
              <Badge tone={qualityTone}>{qualityLabel}</Badge>
              <ArrowRight size={14} className="pass-arrow" />
            </button>
          );
        })}
      </div>

      <div className="panel-footnote"><Star size={12} /> Times are calculated from your current observing position.</div>
    </Panel>
  );
}
