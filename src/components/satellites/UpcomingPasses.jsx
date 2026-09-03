import { useUpcomingPasses } from "../../hooks/useUpcomingPasses";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${minutes}m ${secs
    .toString()
    .padStart(2, "0")}s`;
}

function direction(degrees) {
  if (degrees == null) return "—";

  const dirs = [
    "N",
    "NE",
    "E",
    "SE",
    "S",
    "SW",
    "W",
    "NW"
  ];

  return dirs[
    Math.round(degrees / 45) % 8
  ];
}

function passQuality(maxElevation) {
  if (maxElevation >= 60) {
    return {
      label: "Excellent",
      className: "excellent"
    };
  }

  if (maxElevation >= 30) {
    return {
      label: "Good",
      className: "good"
    };
  }

  return {
    label: "Low",
    className: "low"
  };
}

export default function UpcomingPasses({
  location,
  selectedId,
  onSelect,
  expanded = false
}) {
  const {
    passes,
    status
  } = useUpcomingPasses(
    location,
    {
      hours: expanded ? 24 : 8,
      limit: expanded ? 24 : 5
    }
  );

  return (
    <section
      className={`panel passes ${
        expanded
          ? "passes-expanded"
          : ""
      }`}
    >
      <div className="panel-head pass-panel-head">
        <div>
          <div className="panel-kicker">
            PASS PREDICTION
          </div>

          <h2>
            Upcoming passes
          </h2>

          <p>
            {expanded
              ? "Every visible pass over the next 24 hours"
              : "The next opportunities worth stepping outside for"}
          </p>
        </div>

        <div className="pass-count">
          {passes.length}
          <span>
            tracked
          </span>
        </div>
      </div>

      {status === "loading" &&
        passes.length === 0 && (
          <p className="muted board-status">
            Working out rise times…
          </p>
        )}

      {(status === "error" ||
        status === "unavailable") &&
        passes.length === 0 && (
          <p className="muted board-status">
            Orbital data is temporarily unavailable.
          </p>
        )}

      {(status === "ready" ||
        status === "stale") &&
        passes.length === 0 && (
          <p className="muted board-status">
            Nothing due to rise in this window.
          </p>
        )}

      {passes.length > 0 && (
        <div className="pass-board">
          {passes.map((pass, index) => {
            const quality =
              passQuality(
                pass.maxElevation
              );

            const selected =
              selectedId === pass.id;

            return (
              <button
                key={`${pass.id}-${pass.start}`}
                className={`pass-card ${
                  selected
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  onSelect(pass.id)
                }
              >
                <div className="pass-card-top">
                  <div className="pass-time">
                    <span className="pass-index">
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </span>

                    <strong>
                      {formatTime(
                        pass.start
                      )}
                    </strong>

                    <span className="pass-duration">
                      {formatDuration(
                        pass.durationSeconds
                      )}
                    </span>
                  </div>

                  <span
                    className={`pass-quality ${quality.className}`}
                  >
                    {quality.label}
                  </span>
                </div>

                <div className="pass-card-main">
                  <span
                    className={`pass-dot sat-${pass.color}`}
                  />

                  <div className="pass-identity">
                    <strong>
                      {pass.name}
                    </strong>

                    <span>
                      {pass.country ===
                      "India"
                        ? "Indian mission"
                        : pass.category ||
                          "Satellite"}
                    </span>
                  </div>

                  <div className="pass-peak">
                    <span>
                      PEAK
                    </span>

                    <strong>
                      {Math.round(
                        pass.maxElevation
                      )}
                      °
                    </strong>
                  </div>
                </div>

                <div className="pass-path">
                  <div className="pass-path-line">
                    <span />
                    <i />
                    <span />
                  </div>

                  <div className="pass-path-labels">
                    <span>
                      {direction(
                        pass.startAzimuth
                      )}
                      {" "}
                      {Math.round(
                        pass.startAzimuth
                      )}
                      °
                    </span>

                    <span>
                      highest
                    </span>

                    <span>
                      {direction(
                        pass.endAzimuth
                      )}
                      {" "}
                      {Math.round(
                        pass.endAzimuth
                      )}
                      °
                    </span>
                  </div>
                </div>

                <div className="pass-card-footer">
                  <span>
                    RISE{" "}
                    {formatTime(
                      pass.start
                    )}
                  </span>

                  <span>
                    PEAK{" "}
                    {formatTime(
                      pass.maxElevationTime
                    )}
                  </span>

                  <span>
                    SET{" "}
                    {formatTime(
                      pass.end
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="pass-footer">
        Times are local and calculated from
        your current observing position.
      </div>
    </section>
  );
}
