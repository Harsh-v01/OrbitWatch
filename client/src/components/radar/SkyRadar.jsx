import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CloudOff, Radar, SatelliteDish, Telescope } from "lucide-react";

import { equatorialToHorizontal } from "../../lib/astro";
import { BRIGHT_STARS } from "../../data/stars";
import { hasValue } from "../../lib/format";
import { colorKey, isIndian } from "../../lib/satelliteMeta";
import EmptyState from "../ui/EmptyState";
import Icon from "../ui/Icon";
import RadarControls from "./RadarControls";
import {
  CARDINALS,
  CENTER,
  ELEVATION_RINGS,
  INTERCARDINALS,
  RADIUS,
  SIZE,
  passArc,
  polarPoint,
  project,
  radiusForElevation,
  starRadius,
  toStagePercent,
  trackPath,
} from "./projection";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

/*
 * The sweep wedge is drawn once pointing at the zenith-north
 * spoke and then rotated by CSS, so the animation costs nothing
 * per React render and stays smooth between data polls.
 */
const SWEEP_A = polarPoint(-58, RADIUS);
const SWEEP_B = polarPoint(0, RADIUS);
const SWEEP_PATH = `M ${CENTER} ${CENTER} L ${SWEEP_A.x.toFixed(
  2
)} ${SWEEP_A.y.toFixed(2)} A ${RADIUS} ${RADIUS} 0 0 1 ${SWEEP_B.x.toFixed(
  2
)} ${SWEEP_B.y.toFixed(2)} Z`;

/*
 * Labelling every object would be unreadable and slow once the
 * catalog grows, so only the highest few plus whatever the
 * observer is actually interacting with get named.
 */
function labelBudget(count) {
  if (count > 60) return 2;
  if (count > 30) return 3;
  if (count > 14) return 4;
  return 6;
}

export default function SkyRadar({
  satellites = [],
  selectedId,
  onSelect,
  location,
  now,
  status,
  track = [],
  nextPass = null,
}) {
  /* All radar state is local to this component. */
  const [zoom, setZoom] = useState(1);
  const [hoveredId, setHoveredId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef(null);

  const zoomIn = useCallback(() => {
    setZoom((value) => Math.min(MAX_ZOOM, Number((value + ZOOM_STEP).toFixed(2))));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((value) => Math.max(MIN_ZOOM, Number((value - ZOOM_STEP).toFixed(2))));
  }, []);

  const resetZoom = useCallback(() => setZoom(1), []);

  const toggleFullscreen = useCallback(() => {
    const node = stageRef.current;
    if (!node) return;

    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }

    /* Safari still needs the webkit spelling. */
    const request =
      node.requestFullscreen ?? node.webkitRequestFullscreen ?? null;

    if (typeof request === "function") {
      Promise.resolve(request.call(node)).catch(() => {
        /* Denied by the browser; the radar stays inline. */
      });
    }
  }, []);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, []);

  /*
   * Star positions only need recomputing a couple of times a
   * minute — the sky does not move perceptibly faster than that.
   */
  const timeBucket = Math.floor((now?.getTime() ?? Date.now()) / 30000);

  const stars = useMemo(() => {
    if (!location) return [];

    return BRIGHT_STARS.map((star) => {
      const { altitude, azimuth } = equatorialToHorizontal(
        star,
        location,
        new Date(timeBucket * 30000)
      );

      return { name: star.name, mag: star.mag, altitude, azimuth };
    }).filter((star) => star.altitude > -1);
  }, [location?.lat, location?.lng, timeBucket]);

  /* Only objects genuinely above the horizon belong on the dome. */
  const plotted = useMemo(
    () =>
      satellites
        .filter(
          (sat) =>
            hasValue(sat.azimuth) &&
            hasValue(sat.elevation) &&
            Number(sat.elevation) >= 0
        )
        .map((sat) => ({ sat, point: project(sat.azimuth, sat.elevation) })),
    [satellites]
  );

  const labelledIds = useMemo(() => {
    const budget = labelBudget(plotted.length);

    return new Set(
      plotted
        .slice()
        .sort((a, b) => Number(b.sat.elevation) - Number(a.sat.elevation))
        .slice(0, budget)
        .map((entry) => entry.sat.id)
    );
  }, [plotted]);

  const hovered = plotted.find((entry) => entry.sat.id === hoveredId) ?? null;
  const selectedEntry =
    plotted.find((entry) => entry.sat.id === selectedId) ?? null;

  const observedPath = trackPath(track);
  const arc = passArc(nextPass);

  const inverse = 1 / zoom;
  const live = status === "ready";
  const zoomTransform = `translate(${CENTER} ${CENTER}) scale(${zoom}) translate(${-CENTER} ${-CENTER})`;

  const tooltipPosition = hovered
    ? toStagePercent(hovered.point.x, hovered.point.y, zoom)
    : null;

  let overlay = null;

  if (status === "loading" && satellites.length === 0) {
    overlay = (
      <EmptyState
        icon={SatelliteDish}
        title="Acquiring orbital elements"
        message="Propagating the catalog for your observing position."
      />
    );
  } else if (
    (status === "unavailable" || status === "error") &&
    satellites.length === 0
  ) {
    overlay = (
      <EmptyState
        icon={CloudOff}
        tone="warn"
        title="Orbital data unavailable"
        message="No positions are shown rather than guessed ones. Tracking resumes automatically when a source responds."
      />
    );
  } else if (satellites.length > 0 && plotted.length === 0) {
    overlay = (
      <EmptyState
        icon={Telescope}
        title="Nothing above your horizon"
        message="Every tracked object is currently below the skyline. Check the next pass times below."
      />
    );
  }

  return (
    <div className="radar-stage" ref={stageRef}>
      <RadarControls
        zoom={zoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetZoom}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
      />

      <svg
        className="radar-svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Sky radar showing ${plotted.length} objects above the horizon`}
      >
        <defs>
          {/* Dome shading is theme-driven, not hardcoded to dark. */}
          <radialGradient id="radarDome" cx="50%" cy="45%" r="72%">
            <stop offset="0%" stopColor="var(--dome-inner)" />
            <stop offset="70%" stopColor="var(--dome-mid)" />
            <stop offset="100%" stopColor="var(--dome-outer)" />
          </radialGradient>

          <radialGradient id="radarZenith" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor="var(--accent)"
              stopOpacity="var(--zenith-strength)"
            />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="radarSweep" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
            <stop offset="70%" stopColor="var(--accent)" stopOpacity="0.06" />
            <stop
              offset="100%"
              stopColor="var(--accent)"
              stopOpacity="var(--sweep-strength)"
            />
          </linearGradient>

          <clipPath id="radarHorizon">
            <circle cx={CENTER} cy={CENTER} r={RADIUS} />
          </clipPath>
        </defs>

        {/*
         * Everything inside the horizon is clipped, so zooming
         * magnifies the sky without spilling over the frame.
         */}
        <g clipPath="url(#radarHorizon)">
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="url(#radarDome)" />

          <g transform={zoomTransform}>
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS * 0.42}
              fill="url(#radarZenith)"
            />

            {ELEVATION_RINGS.map((elevation) => (
              <circle
                key={elevation}
                cx={CENTER}
                cy={CENTER}
                r={radiusForElevation(elevation)}
                fill="none"
                stroke="var(--grid-line)"
                strokeWidth={inverse}
                strokeDasharray={`${2 * inverse} ${6 * inverse}`}
              />
            ))}

            {/* Cardinal spokes. */}
            <line
              x1={CENTER}
              y1={CENTER - RADIUS}
              x2={CENTER}
              y2={CENTER + RADIUS}
              stroke="var(--grid-line)"
              strokeWidth={inverse}
            />
            <line
              x1={CENTER - RADIUS}
              y1={CENTER}
              x2={CENTER + RADIUS}
              y2={CENTER}
              stroke="var(--grid-line)"
              strokeWidth={inverse}
            />

            {/* Bearing ticks every 22.5°. */}
            {Array.from({ length: 16 }, (_, index) => {
              const azimuth = index * 22.5;
              const outer = polarPoint(azimuth, RADIUS);
              const inner = polarPoint(azimuth, RADIUS - (index % 2 ? 5 : 9));

              return (
                <line
                  key={azimuth}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="var(--grid-line-strong)"
                  strokeWidth={(index % 2 ? 0.6 : 1) * inverse}
                />
              );
            })}

            {stars.map((star) => {
              const { x, y } = project(star.azimuth, star.altitude);

              return (
                <circle
                  key={star.name}
                  cx={x}
                  cy={y}
                  r={starRadius(star.mag) * inverse}
                  className="radar-star"
                />
              );
            })}

            <path
              className={`radar-sweep${live ? " is-live" : ""}`}
              d={SWEEP_PATH}
              fill="url(#radarSweep)"
            />

            {/* Predicted next pass: rise, peak and set samples. */}
            {arc && (
              <g className="radar-pass-arc">
                <path
                  d={arc.path}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={1.4 * inverse}
                  strokeDasharray={`${5 * inverse} ${5 * inverse}`}
                  opacity="0.5"
                />

                {[
                  { point: arc.rise, label: "RISE" },
                  { point: arc.set, label: "SET" },
                ].map(({ point, label }) => (
                  <g
                    key={label}
                    transform={`translate(${point.x} ${point.y}) scale(${inverse})`}
                  >
                    <circle r="3.2" className="pass-node" />
                    <text className="pass-node-label" x="7" y="3.5">
                      {label}
                    </text>
                  </g>
                ))}

                <g
                  transform={`translate(${arc.peak.x} ${arc.peak.y}) scale(${inverse})`}
                >
                  <path d="M 0 -4.5 L 4.5 0 L 0 4.5 L -4.5 0 Z" className="pass-node" />
                  <text className="pass-node-label" x="8" y="3.5">
                    PEAK
                  </text>
                </g>
              </g>
            )}

            {/* Observed track of the selected object. */}
            {observedPath && (
              <path
                className="radar-track"
                d={observedPath}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1.6 * inverse}
                strokeLinecap="round"
              />
            )}

            {plotted.map(({ sat, point }) => {
              const isSelected = sat.id === selectedId;
              const isHovered = sat.id === hoveredId;
              const showLabel =
                isSelected || isHovered || labelledIds.has(sat.id);
              const indian = isIndian(sat);

              return (
                <g
                  key={sat.id}
                  /* Counter-scaled so markers keep a constant screen size. */
                  transform={`translate(${point.x} ${point.y}) scale(${inverse})`}
                  className={[
                    "radar-mark",
                    `sat-${colorKey(sat)}`,
                    isSelected ? "is-selected" : "",
                    indian ? "is-indian" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseEnter={() => setHoveredId(sat.id)}
                  onMouseLeave={() =>
                    setHoveredId((current) => (current === sat.id ? null : current))
                  }
                  onFocus={() => setHoveredId(sat.id)}
                  onBlur={() =>
                    setHoveredId((current) => (current === sat.id ? null : current))
                  }
                >
                  {isSelected && (
                    /* Selection reads as a reticle, not just a colour. */
                    <g className="radar-reticle">
                      <circle r="13" />
                      <line x1="-19" y1="0" x2="-8" y2="0" />
                      <line x1="8" y1="0" x2="19" y2="0" />
                      <line x1="0" y1="-19" x2="0" y2="-8" />
                      <line x1="0" y1="8" x2="0" y2="19" />
                    </g>
                  )}

                  <circle className="radar-mark-halo" r={isSelected ? 8 : 6} />
                  <circle className="radar-mark-dot" r={isSelected ? 4.2 : 3.2} />

                  <circle
                    className="radar-hit"
                    r="14"
                    role="button"
                    tabIndex={0}
                    aria-label={`Select ${sat.name}`}
                    onClick={() => onSelect?.(sat.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect?.(sat.id);
                      }
                    }}
                  />

                  {showLabel && (
                    <g className="radar-label" transform="translate(13 -8)">
                      <text className="radar-label-name">{sat.name}</text>
                      <text className="radar-label-meta" y="12">
                        {Math.round(Number(sat.elevation))}°
                        {indian ? " · INDIA" : ""}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </g>

        {/*
         * Frame furniture stays outside the zoom group so the
         * instrument bezel never moves or blurs.
         */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--grid-line-strong)"
          strokeWidth="1.25"
        />

        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS + 12}
          fill="none"
          stroke="var(--grid-line)"
          strokeWidth="1"
          opacity="0.6"
        />

        {INTERCARDINALS.map(({ label, azimuth }) => {
          const { x, y } = polarPoint(azimuth, RADIUS + 26);

          return (
            <text key={label} className="radar-bearing" x={x} y={y + 3}>
              {label}
            </text>
          );
        })}

        {CARDINALS.map(({ label, azimuth }) => {
          const { x, y } = polarPoint(azimuth, RADIUS + 28);

          return (
            <text key={label} className="radar-cardinal" x={x} y={y + 5}>
              {label}
            </text>
          );
        })}

        {ELEVATION_RINGS.map((elevation) => (
          <text
            key={elevation}
            className="radar-ring-label"
            x={CENTER + 7}
            y={CENTER - radiusForElevation(elevation) + 13}
          >
            {elevation}°
          </text>
        ))}

        <text
          className="radar-ring-label"
          x={CENTER + 7}
          y={CENTER - RADIUS + 15}
        >
          HORIZON
        </text>

        {/* Observer position: the centre of the instrument. */}
        <circle cx={CENTER} cy={CENTER} r="3" fill="var(--accent)" />
        <circle
          cx={CENTER}
          cy={CENTER}
          r="9"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>

      {hovered && tooltipPosition && (
        <div
          className="radar-tooltip"
          style={{
            left: `${tooltipPosition.left}%`,
            top: `${tooltipPosition.top}%`,
          }}
        >
          <strong>{hovered.sat.name}</strong>
          <span>
            {Math.round(Number(hovered.sat.elevation))}° elevation ·{" "}
            {Math.round(Number(hovered.sat.azimuth))}° azimuth
          </span>
          {hovered.sat.id !== selectedId && <em>Click to track</em>}
        </div>
      )}

      {overlay && <div className="radar-overlay">{overlay}</div>}

      <div className="radar-scale">
        <span>
          <Icon as={Radar} size={12} /> Looking up · north top · east left
        </span>
        <span>{plotted.length} above horizon</span>
      </div>
    </div>
  );
}
