/*
 * Radar geometry.
 *
 * Azimuthal equidistant projection of the visible hemisphere:
 * the zenith sits at the centre, the horizon at the rim, and
 * radius falls off linearly with elevation.
 *
 * The chart is drawn looking UP, the way a planisphere is held
 * overhead: north at the top, east on the LEFT. This matches the
 * projection OrbitWatch has always used and the cardinal labels
 * are placed to agree with it.
 */

import { hasValue } from "../../lib/format";

export const SIZE = 620;
export const CENTER = SIZE / 2;
export const RADIUS = 258;

const DEG2RAD = Math.PI / 180;

export function radiusForElevation(elevationDeg) {
  const clamped = Math.max(0, Math.min(90, Number(elevationDeg) || 0));
  return RADIUS * ((90 - clamped) / 90);
}

export function polarPoint(azimuthDeg, radius) {
  const angle = Number(azimuthDeg) * DEG2RAD;

  return {
    x: CENTER - radius * Math.sin(angle),
    y: CENTER - radius * Math.cos(angle),
  };
}

export function project(azimuthDeg, elevationDeg) {
  return polarPoint(azimuthDeg, radiusForElevation(elevationDeg));
}

export const ELEVATION_RINGS = [30, 60];

/* East on the left follows the looking-up projection above. */
export const CARDINALS = [
  { label: "N", azimuth: 0 },
  { label: "E", azimuth: 90 },
  { label: "S", azimuth: 180 },
  { label: "W", azimuth: 270 },
];

export const INTERCARDINALS = [
  { label: "NE", azimuth: 45 },
  { label: "SE", azimuth: 135 },
  { label: "SW", azimuth: 225 },
  { label: "NW", azimuth: 315 },
];

export function starRadius(magnitude) {
  return Math.max(0.8, 3.6 - Number(magnitude) * 0.55);
}

/*
 * Polyline through observed positions. Points come from real
 * poll history, so this draws only where the object has been
 * seen — it never extends the line past the newest sample.
 */
export function trackPath(points) {
  if (!Array.isArray(points) || points.length < 2) return "";

  return points
    .map((point, index) => {
      const { x, y } = project(point.azimuth, point.elevation);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

/*
 * The next-pass arc is built from the three real samples the
 * backend pass predictor reports: rise (elevation 0), peak
 * (maxElevation at maxElevationAzimuth) and set (elevation 0).
 *
 * Those three points are exact. The curve joining them is a
 * quadratic whose midpoint is pinned to the real peak, and it is
 * stroked dashed in the UI to signal that the line between the
 * samples is a guide rather than sampled positions.
 */
export function passArc(pass) {
  if (!pass) return null;

  const { startAzimuth, maxElevationAzimuth, maxElevation, endAzimuth } = pass;

  if (
    !hasValue(startAzimuth) ||
    !hasValue(maxElevationAzimuth) ||
    !hasValue(maxElevation) ||
    !hasValue(endAzimuth)
  ) {
    return null;
  }

  const rise = project(startAzimuth, 0);
  const peak = project(maxElevationAzimuth, maxElevation);
  const set = project(endAzimuth, 0);

  const control = {
    x: 2 * peak.x - (rise.x + set.x) / 2,
    y: 2 * peak.y - (rise.y + set.y) / 2,
  };

  return {
    rise,
    peak,
    set,
    path: `M ${rise.x.toFixed(2)} ${rise.y.toFixed(2)} Q ${control.x.toFixed(
      2
    )} ${control.y.toFixed(2)} ${set.x.toFixed(2)} ${set.y.toFixed(2)}`,
  };
}

/*
 * Maps a viewBox coordinate to a percentage of the (square)
 * radar stage, taking the current zoom into account. Used to
 * park HTML overlays over SVG features without putting any HTML
 * inside the SVG itself.
 */
export function toStagePercent(x, y, zoom = 1) {
  return {
    left: ((CENTER + (x - CENTER) * zoom) / SIZE) * 100,
    top: ((CENTER + (y - CENTER) * zoom) / SIZE) * 100,
  };
}
