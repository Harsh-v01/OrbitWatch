import { useUpcomingPasses } from "../../hooks/useUpcomingPasses";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export default function UpcomingPasses({ location, selectedId, onSelect, expanded = false }) {
  const { passes, status } = useUpcomingPasses(location, { hours: expanded ? 24 : 8, limit: expanded ? 24 : 5 });

  return (
    <section className={`panel passes ${expanded ? "passes-expanded" : ""}`}>
      <div className="panel-head">
        <div>
          <h2>Upcoming passes</h2>
          <p>{expanded ? "Every rise over the next 24 hours" : "The next few worth stepping outside for"}</p>
        </div>
      </div>

      {status === "loading" && passes.length === 0 && <p className="muted board-status">Working out rise times…</p>}
      {status === "error" && passes.length === 0 && <p className="muted board-status">Couldn't compute pass times.</p>}
      {status === "ready" && passes.length === 0 && <p className="muted board-status">Nothing due to rise in this window.</p>}

      {passes.length > 0 && (
        <div className="pass-board">
          {passes.map((pass) => (
            <button
              key={`${pass.id}-${pass.start}`}
              className={`pass-row ${selectedId === pass.id ? "selected" : ""}`}
              onClick={() => onSelect(pass.id)}
            >
              <time>{formatTime(pass.start)}</time>
              <span className={`pass-dot sat-${pass.color}`} />
              <span className="pass-name">{pass.name}</span>
              <span className="pass-detail">{formatDuration(pass.durationSeconds)}</span>
              <span className="pass-detail">max {Math.round(pass.maxElevation)}°</span>
            </button>
          ))}
        </div>
      )}

      <div className="pass-footer">Times are local, computed for your current position.</div>
    </section>
  );
}
