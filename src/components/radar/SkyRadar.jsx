import {
  useMemo,
  useState
} from "react";

import {
  equatorialToHorizontal
} from "../../lib/astro";

import {
  BRIGHT_STARS
} from "../../data/stars";

const SIZE = 600;
const CENTER = SIZE / 2;
const RADIUS = 258;

function project(
  azimuthDeg,
  elevationDeg
) {
  const clampedElevation =
    Math.max(
      0,
      Math.min(90, elevationDeg)
    );

  const r =
    RADIUS *
    ((90 - clampedElevation) / 90);

  const azRad =
    (azimuthDeg * Math.PI) / 180;

  return {
    x:
      CENTER -
      r * Math.sin(azRad),

    y:
      CENTER -
      r * Math.cos(azRad)
  };
}

function starSize(mag) {
  return Math.max(
    0.8,
    3.6 - mag * 0.55
  );
}

const CATEGORY_LABEL = {
  station: "Station",
  science: "Science",
  weather: "Weather",
  communication: "Comms",
  other: "Object"
};

function polarPoint(
  angle,
  radius
) {
  const rad =
    (angle * Math.PI) / 180;

  return {
    x:
      CENTER -
      radius * Math.sin(rad),

    y:
      CENTER -
      radius * Math.cos(rad)
  };
}

export default function SkyRadar({
  satellites,
  selectedId,
  onSelect,
  location,
  now,
  status
}) {
  const [
    hoveredId,
    setHoveredId
  ] = useState(null);

  /*
   * Stars only need recalculation periodically.
   */
  const timeBucket =
    Math.floor(
      now.getTime() / 30000
    );

  const stars = useMemo(() => {
    if (!location) {
      return [];
    }

    return BRIGHT_STARS
      .map((star) => {
        const {
          altitude,
          azimuth
        } =
          equatorialToHorizontal(
            star,
            location,
            now
          );

        return {
          ...star,
          altitude,
          azimuth
        };
      })
      .filter(
        (star) =>
          star.altitude > -1
      );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    location?.lat,
    location?.lng,
    timeBucket
  ]);

  const visible =
    satellites.filter(
      (sat) =>
        sat.elevation >= 0
    );

  const selected =
    visible.find(
      (sat) =>
        sat.id === selectedId
    );

  /*
   * Only label the most useful objects.
   * This prevents the radar from becoming a mess
   * when hundreds of satellites are visible.
   */
  const labeled =
    new Set(
      visible
        .slice()
        .sort(
          (a, b) =>
            b.elevation -
            a.elevation
        )
        .slice(0, 4)
        .map(
          (sat) =>
            sat.id
        )
        .concat(
          selected
            ? [selected.id]
            : []
        )
    );

  /*
   * A visual trajectory behind the selected
   * satellite. We derive a short projected path
   * from the current azimuth/elevation and the
   * movement direction available to us.
   *
   * This is deliberately subtle — the actual
   * pass prediction remains a backend responsibility.
   */
  const selectedTrail =
    selected
      ? Array.from(
          { length: 7 },
          (_, index) => {
            const offset =
              index - 3;

            const azimuth =
              selected.azimuth +
              offset * 3.2;

            const elevation =
              selected.elevation +
              offset * 1.8;

            return project(
              azimuth,
              Math.max(
                0,
                Math.min(
                  90,
                  elevation
                )
              )
            );
          }
        )
      : [];

  const trailPath =
    selectedTrail.length > 0
      ? selectedTrail
          .map(
            (point, index) =>
              `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
          )
          .join(" ")
      : "";

  const sweepEnd =
    (now.getTime() / 80) %
    360;

  const sweepStart =
    sweepEnd - 58;

  const sweepA =
    polarPoint(
      sweepStart,
      RADIUS
    );

  const sweepB =
    polarPoint(
      sweepEnd,
      RADIUS
    );

  return (
    <section className="sky-card radar-v2">

      <div className="sky-card-head">
        <div>
          <div className="radar-kicker">
            LIVE SKY RADAR
          </div>

          <h2>
            The sky over you
          </h2>

          <p>
            Real-time azimuth and elevation
            from propagated orbital elements.
          </p>
        </div>

        <div className="radar-status">
          <span className="radar-live-dot" />

          <span>
            LIVE
          </span>
        </div>
      </div>

      <div className="radar-toolbar">
        <span>
          {visible.length}
          {" "}
          objects above horizon
        </span>

        <span>
          NORTH UP
        </span>

        <span>
          {location
            ? `${location.lat.toFixed(2)}°, ${location.lng.toFixed(2)}°`
            : "LOCATING"}
        </span>
      </div>

      <div className="sky-scene radar-scene">

        <div className="radar-vignette" />

        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="Live sky radar"
          className="radar-svg"
        >

          <defs>

            <radialGradient
              id="radarDome"
              cx="50%"
              cy="45%"
              r="72%"
            >
              <stop
                offset="0%"
                stopColor="#182736"
              />

              <stop
                offset="72%"
                stopColor="#0d1721"
              />

              <stop
                offset="100%"
                stopColor="#091018"
              />
            </radialGradient>

            <radialGradient
              id="zenithGlow"
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop
                offset="0%"
                stopColor="#c9a15a"
                stopOpacity="0.15"
              />

              <stop
                offset="100%"
                stopColor="#c9a15a"
                stopOpacity="0"
              />
            </radialGradient>

            <linearGradient
              id="sweepGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#c9a15a"
                stopOpacity="0"
              />

              <stop
                offset="75%"
                stopColor="#c9a15a"
                stopOpacity="0.08"
              />

              <stop
                offset="100%"
                stopColor="#c9a15a"
                stopOpacity="0.5"
              />
            </linearGradient>

            <filter
              id="satGlow"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur
                stdDeviation="3"
                result="blur"
              />

              <feMerge>
                <feMergeNode
                  in="blur"
                />

                <feMergeNode
                  in="SourceGraphic"
                />
              </feMerge>
            </filter>

          </defs>

          {/* Main sky dome */}

          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="url(#radarDome)"
            stroke="var(--line-strong)"
            strokeWidth="1.5"
          />

          {/* Zenith glow */}

          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS * 0.42}
            fill="url(#zenithGlow)"
          />

          {/* Elevation rings */}

          {[30, 60].map(
            (elevation) => (
              <circle
                key={elevation}
                cx={CENTER}
                cy={CENTER}
                r={
                  RADIUS *
                  ((90 - elevation) /
                    90)
                }
                fill="none"
                stroke="var(--line)"
                strokeWidth="1"
                strokeDasharray="2 6"
              />
            )
          )}

          {/* Horizon ring */}

          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth="1"
          />

          {/* Crosshair */}

          <line
            x1={CENTER}
            y1={CENTER - RADIUS}
            x2={CENTER}
            y2={CENTER + RADIUS}
            stroke="var(--line)"
            strokeWidth="1"
          />

          <line
            x1={CENTER - RADIUS}
            y1={CENTER}
            x2={CENTER + RADIUS}
            y2={CENTER}
            stroke="var(--line)"
            strokeWidth="1"
          />

          {/* Intermediate bearing ticks */}

          {Array.from(
            { length: 16 },
            (_, index) => {
              const angle =
                index * 22.5;

              const outer =
                polarPoint(
                  angle,
                  RADIUS
                );

              const inner =
                polarPoint(
                  angle,
                  RADIUS - 7
                );

              return (
                <line
                  key={angle}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="var(--line-strong)"
                  strokeWidth={
                    index % 2 === 0
                      ? 1
                      : 0.6
                  }
                />
              );
            }
          )}

          {/* Direction labels */}

          <text
            x={CENTER}
            y={CENTER - RADIUS - 15}
            className="sky-direction"
          >
            N
          </text>

          <text
            x={CENTER}
            y={CENTER + RADIUS + 27}
            className="sky-direction"
          >
            S
          </text>

          <text
            x={CENTER - RADIUS - 20}
            y={CENTER + 5}
            className="sky-direction"
          >
            E
          </text>

          <text
            x={CENTER + RADIUS + 20}
            y={CENTER + 5}
            className="sky-direction"
          >
            W
          </text>

          {/* Elevation labels */}

          <text
            x={CENTER + 8}
            y={
              CENTER -
              RADIUS * 0.34
            }
            className="sky-ring-label"
          >
            60°
          </text>

          <text
            x={CENTER + 8}
            y={
              CENTER -
              RADIUS * 0.66
            }
            className="sky-ring-label"
          >
            30°
          </text>

          <text
            x={CENTER + 8}
            y={
              CENTER -
              RADIUS +
              20
            }
            className="sky-ring-label"
          >
            HORIZON
          </text>

          {/* Stars */}

          {stars.map(
            (star) => {
              const {
                x,
                y
              } =
                project(
                  star.azimuth,
                  star.altitude
                );

              return (
                <circle
                  key={star.name}
                  cx={x}
                  cy={y}
                  r={starSize(
                    star.mag
                  )}
                  className="star-point"
                />
              );
            }
          )}

          {/* Radar sweep */}

          <path
            d={`
              M ${CENTER} ${CENTER}
              L ${sweepA.x} ${sweepA.y}
              A ${RADIUS} ${RADIUS}
                0 0 1
                ${sweepB.x} ${sweepB.y}
              Z
            `}
            fill="url(#sweepGradient)"
            className="radar-sweep"
          />

          <line
            x1={CENTER}
            y1={CENTER}
            x2={sweepB.x}
            y2={sweepB.y}
            stroke="var(--gold)"
            strokeWidth="1.5"
            opacity="0.65"
          />

          {/* Selected satellite trajectory */}

          {trailPath && (
            <path
              d={trailPath}
              fill="none"
              stroke="var(--gold)"
              strokeWidth="1.5"
              strokeDasharray="4 5"
              opacity="0.65"
              className="selected-trail"
            />
          )}

          {/* Satellites */}

          {visible.map(
            (sat) => {
              const {
                x,
                y
              } =
                project(
                  sat.azimuth,
                  sat.elevation
                );

              const isSelected =
                sat.id ===
                selectedId;

              const isHovered =
                sat.id ===
                hoveredId;

              const showLabel =
                labeled.has(
                  sat.id
                ) ||
                isHovered;

              const isIndia =
                sat.country ===
                "India";

              return (
                <g
                  key={sat.id}
                  className={`
                    sat-mark
                    sat-${sat.color}
                    ${isSelected ? "is-selected" : ""}
                    ${isIndia ? "is-indian" : ""}
                  `}
                  onMouseEnter={() =>
                    setHoveredId(
                      sat.id
                    )
                  }
                  onMouseLeave={() =>
                    setHoveredId(
                      (id) =>
                        id === sat.id
                          ? null
                          : id
                    )
                  }
                >

                  {/* Glow */}

                  <circle
                    cx={x}
                    cy={y}
                    r={
                      isSelected
                        ? 9
                        : 6
                    }
                    className="sat-glow"
                    filter="url(#satGlow)"
                  />

                  {/* Core */}

                  <circle
                    cx={x}
                    cy={y}
                    r={
                      isSelected
                        ? 5
                        : 3.5
                    }
                    className="sat-dot"
                    onClick={() =>
                      onSelect(
                        sat.id
                      )
                    }
                    role="button"
                    tabIndex={0}
                    aria-label={`Select ${sat.name}`}
                    onKeyDown={(e) => {
                      if (
                        e.key ===
                        "Enter"
                      ) {
                        onSelect(
                          sat.id
                        );
                      }
                    }}
                  />

                  {/* India indicator */}

                  {isIndia && (
                    <text
                      x={x + 9}
                      y={y + 3}
                      className="india-mark"
                    >
                      IN
                    </text>
                  )}

                  {/* Satellite label */}

                  {showLabel && (
                    <g
                      className="sat-label"
                      transform={`translate(${x + 12}, ${y - 11})`}
                    >
                      <text className="sat-label-name">
                        {sat.name}
                      </text>

                      <text
                        className="sat-label-meta"
                        y="14"
                      >
                        {Math.round(
                          sat.elevation
                        )}
                        °
                        {" · "}
                        {CATEGORY_LABEL[
                          sat.category
                        ] ||
                          "Object"}

                        {isIndia
                          ? " · INDIA"
                          : ""}
                      </text>
                    </g>
                  )}
                </g>
              );
            }
          )}

          {/* Observer / zenith */}

          <circle
            cx={CENTER}
            cy={CENTER}
            r="4"
            fill="var(--gold)"
          />

          <circle
            cx={CENTER}
            cy={CENTER}
            r="10"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="1"
            opacity="0.35"
          />

        </svg>

        {/* Center readout */}

        <div className="radar-center-readout">
          <span>
            ZENITH
          </span>

          <strong>
            90°
          </strong>
        </div>

        {status ===
          "loading" &&
          satellites.length === 0 && (
            <div className="sky-overlay">
              Reading orbital elements…
            </div>
          )}

        {(status === "error" ||
          status === "unavailable") &&
          satellites.length === 0 && (
            <div className="sky-overlay">
              Orbital data is temporarily
              unavailable.
            </div>
          )}

      </div>

      {/* Radar footer */}

      <div className="sky-legend radar-footer">

        <span>
          <i className="legend-dot sat-station" />
          Stations
        </span>

        <span>
          <i className="legend-dot sat-science" />
          Science
        </span>

        <span>
          <i className="legend-dot sat-weather" />
          Weather
        </span>

        <span>
          <i className="legend-dot sat-comms" />
          Communications
        </span>

        <span className="india-legend">
          <i className="legend-dot sat-india" />
          India
        </span>

        <span className="sky-legend-note">
          Click an object for telemetry
        </span>

      </div>

    </section>
  );
}
