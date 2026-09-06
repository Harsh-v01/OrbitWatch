import { ArrowRight, CloudOff, Eye, Timer } from "lucide-react";

import { useUpcomingPasses } from "../../hooks/useUpcomingPasses";
import { bearing, clock, deg, duration, relativeDay } from "../../lib/format";
import { colorKey, isIndian, passQuality } from "../../lib/satelliteMeta";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import Icon from "../ui/Icon";

/*
 * The next pass for every tracked object, from
 * GET /api/satellites/passes/next. This is a schedule view — the
 * per-object detail lives on the sky page beside the radar.
 */
export default function UpcomingPasses({
  location,
  selectedId,
  onSelect,
  hours = 24,
  limit = 24,
}) {
  const { passes, status } = useUpcomingPasses(location, { hours, limit });

  if (status === "loading" && passes.length === 0) {
    return (
      <EmptyState
        icon={Timer}
        title="Calculating visibility windows"
        message={`Scanning the next ${hours} hours for horizon crossings.`}
      />
    );
  }

  if ((status === "unavailable" || status === "error") && passes.length === 0) {
    return (
      <EmptyState
        icon={CloudOff}
        tone="warn"
        title="Pass predictions unavailable"
        message="No pass times are shown while the orbital source is unreachable."
      />
    );
  }

  if (passes.length === 0) {
    return (
      <EmptyState
        icon={Eye}
        title={`No passes in the next ${hours} hours`}
        message="Nothing in the tracked catalog rises above your horizon in this window."
      />
    );
  }

  return (
    <ul className="pass-table">
      {passes.map((pass, index) => {
        const quality = passQuality(pass.maxElevation);

        return (
          <li key={`${pass.id}-${pass.start}`}>
            <button
              type="button"
              className={`pass-table-row${
                pass.id === selectedId ? " is-selected" : ""
              }`}
              onClick={() => onSelect?.(pass.id)}
            >
              <span className="pass-index">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className={`pass-dot sat-${colorKey(pass)}`} />

              <span className="pass-identity">
                <strong>
                  {pass.name}
                  {isIndian(pass) && <em className="india-chip">INDIA</em>}
                </strong>
                <small>
                  {relativeDay(pass.start)} · {clock(pass.start, false)} →{" "}
                  {clock(pass.end, false)} · {duration(pass.durationSeconds)}
                </small>
              </span>

              <span className="pass-track">
                {bearing(pass.startAzimuth)}
                <Icon as={ArrowRight} size={12} />
                {bearing(pass.endAzimuth)}
              </span>

              <span className="pass-peak">
                <strong>{deg(pass.maxElevation)}</strong>
                <small>peak</small>
              </span>

              <Badge tone={quality.tone}>{quality.label}</Badge>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
