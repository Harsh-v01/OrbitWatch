import { ArrowRight, CalendarClock, CloudOff, Eye, Timer } from "lucide-react";

import {
  bearing,
  clock,
  deg,
  duration,
  relativeDay,
  untilLabel,
} from "../../lib/format";
import { passQuality } from "../../lib/satelliteMeta";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import Icon from "../ui/Icon";
import Panel from "../ui/Panel";
import PanelHeader from "../ui/PanelHeader";
import Readout from "../ui/Readout";

/*
 * Rank 03 — when can I actually see it.
 *
 * Every time and angle in this panel comes from the backend
 * pass predictor (GET /api/satellites/:id/passes). Nothing is
 * estimated client side; when the predictor returns no pass the
 * panel says so.
 */
export default function NextPass({ satellite, pass, status, now }) {
  const header = (aside) => (
    <PanelHeader
      rank="03"
      icon={CalendarClock}
      eyebrow="Next visible pass"
      title={satellite?.name ?? "No object selected"}
      aside={aside}
    />
  );

  if (!satellite) {
    return (
      <Panel level="secondary" className="pass-panel">
        {header(null)}
        <EmptyState
          icon={CalendarClock}
          title="Select a satellite"
          message="Pass predictions are calculated for one object at a time."
        />
      </Panel>
    );
  }

  if (status === "loading" || status === "idle") {
    return (
      <Panel level="secondary" className="pass-panel">
        {header(null)}
        <EmptyState
          icon={Timer}
          title="Computing pass predictions"
          message="Scanning the next 48 hours for horizon crossings."
        />
      </Panel>
    );
  }

  if (status === "unavailable" || status === "error") {
    return (
      <Panel level="secondary" className="pass-panel">
        {header(null)}
        <EmptyState
          icon={CloudOff}
          tone="warn"
          title="Pass prediction unavailable"
          message="The orbital source did not respond. No pass times are shown rather than guessed ones."
        />
      </Panel>
    );
  }

  if (!pass) {
    return (
      <Panel level="secondary" className="pass-panel">
        {header(null)}
        <EmptyState
          icon={Eye}
          title="No pass in the next 48 hours"
          message={`${satellite.name} does not rise above your horizon within the prediction window.`}
        />
      </Panel>
    );
  }

  const startMs = new Date(pass.start).getTime();
  const endMs = new Date(pass.end).getTime();
  const nowMs = now?.getTime() ?? Date.now();
  const inProgress = nowMs >= startMs && nowMs <= endMs;

  const quality = passQuality(pass.maxElevation);

  return (
    <Panel level="secondary" className="pass-panel">
      {header(
        <Badge tone={quality.tone} dot>
          {quality.label.toUpperCase()}
        </Badge>
      )}

      <div className={`pass-countdown${inProgress ? " is-live" : ""}`}>
        <strong>
          {inProgress ? "Visible now" : untilLabel(pass.start, nowMs)}
        </strong>
        <span>
          {relativeDay(pass.start)} · {clock(pass.start)} → {clock(pass.end)}
        </span>
      </div>

      <div className="pass-metrics">
        <Readout label="Duration" value={duration(pass.durationSeconds)} />
        <Readout
          label="Max elevation"
          value={deg(pass.maxElevation, 1)}
          hint="at peak"
        />
        <Readout label="Peak at" value={clock(pass.maxElevationTime, false)} />
      </div>

      {/* Where to actually look, in the order it happens. */}
      <div className="pointing-guide">
        <span className="eyebrow">Where to look</span>
        <ol>
          <li>
            <small>Rises</small>
            <strong>{bearing(pass.startAzimuth)}</strong>
          </li>
          <li aria-hidden="true" className="pointing-arrow">
            <Icon as={ArrowRight} size={13} />
          </li>
          <li>
            <small>Peaks</small>
            <strong>{bearing(pass.maxElevationAzimuth)}</strong>
            <em>{deg(pass.maxElevation)} up</em>
          </li>
          <li aria-hidden="true" className="pointing-arrow">
            <Icon as={ArrowRight} size={13} />
          </li>
          <li>
            <small>Sets</small>
            <strong>{bearing(pass.endAzimuth)}</strong>
          </li>
        </ol>
      </div>

      <p className="pass-interpretation">{quality.detail}</p>
    </Panel>
  );
}
