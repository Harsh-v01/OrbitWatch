import { CalendarRange, Eye } from "lucide-react";

import { clock, deg, duration, relativeDay } from "../../lib/format";
import { passQuality } from "../../lib/satelliteMeta";
import EmptyState from "../ui/EmptyState";
import Panel from "../ui/Panel";
import PanelHeader from "../ui/PanelHeader";

/*
 * Rank 05 — supporting information for the current selection.
 *
 * This is the rest of the predicted pass list for the object the
 * observer already chose, so it extends the next-pass panel
 * rather than competing with it.
 */
export default function PassSchedule({ satellite, passes = [], status, now }) {
  if (!satellite) return null;

  const nowMs = now?.getTime() ?? Date.now();
  const upcoming = passes.filter(
    (pass) => new Date(pass.end).getTime() > nowMs
  );
  const later = upcoming.slice(1);

  return (
    <Panel className="schedule-panel">
      <PanelHeader
        rank="05"
        icon={CalendarRange}
        eyebrow="Pass schedule"
        title={`Later passes of ${satellite.name}`}
        aside={
          <span className="panel-note">
            {upcoming.length
              ? `${upcoming.length} in 48 h`
              : "next 48 h"}
          </span>
        }
      />

      {status === "loading" || status === "idle" ? (
        <EmptyState compact title="Computing pass windows" />
      ) : status === "unavailable" || status === "error" ? (
        <EmptyState
          compact
          tone="warn"
          icon={Eye}
          title="Predictions unavailable"
          message="No pass times are shown while the orbital source is unreachable."
        />
      ) : later.length === 0 ? (
        <EmptyState
          compact
          icon={Eye}
          title={
            upcoming.length === 1
              ? "Only one pass in this window"
              : "No further passes in 48 hours"
          }
          message={
            upcoming.length === 1
              ? "The pass above is the only opportunity in the next 48 hours."
              : undefined
          }
        />
      ) : (
        <ul className="schedule-list">
          {later.map((pass) => {
            const quality = passQuality(pass.maxElevation);

            return (
              <li key={pass.start}>
                <span className={`schedule-tick tone-${quality.tone}`} />
                <span className="schedule-when">
                  <strong>{relativeDay(pass.start)}</strong>
                  <small>
                    {clock(pass.start, false)} → {clock(pass.end, false)}
                  </small>
                </span>
                <span className="schedule-peak">
                  <strong>{deg(pass.maxElevation)}</strong>
                  <small>peak</small>
                </span>
                <span className="schedule-duration">
                  {duration(pass.durationSeconds)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
