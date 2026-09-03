// Minimal, self-contained equatorial -> horizontal coordinate conversion.
// Good to a fraction of a degree, which is all a background star field needs.
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function julianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// Greenwich Mean Sidereal Time, in degrees, for a given instant.
function gmstDeg(date) {
  const jd = julianDate(date);
  const t = (jd - 2451545.0) / 36525;
  let gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38710000;
  gmst %= 360;
  return gmst < 0 ? gmst + 360 : gmst;
}

/**
 * Convert a star's RA (decimal hours, J2000) and Dec (decimal degrees)
 * into altitude/azimuth for an observer at (lat, lng) in degrees, at `date`.
 * Azimuth is measured clockwise from true North.
 */
export function equatorialToHorizontal({ raHours, decDeg }, { lat, lng }, date = new Date()) {
  const lst = (gmstDeg(date) + lng) % 360;
  const raDeg = raHours * 15;
  let hourAngleDeg = lst - raDeg;
  hourAngleDeg = ((hourAngleDeg + 540) % 360) - 180; // normalize to [-180, 180]

  const H = hourAngleDeg * DEG2RAD;
  const dec = decDeg * DEG2RAD;
  const phi = lat * DEG2RAD;

  const sinAlt = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD2DEG;

  const y = Math.sin(H);
  const x = Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi);
  const azFromSouth = Math.atan2(y, x) * RAD2DEG;
  const azimuth = (azFromSouth + 180 + 360) % 360;

  return { altitude, azimuth };
}
