import * as satellite from "satellite.js";
import { getCatalog, getSatelliteByCatalogNumber } from "./tleCache.js";

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

function toObserverGd(lat, lng, altKm = 0) {
  return {
    longitude: lng * DEG2RAD,
    latitude: lat * DEG2RAD,
    height: altKm
  };
}

function statusFor(elevationNow, elevationSoon) {
  if (elevationNow <= 0 && elevationSoon <= 0) return "Below horizon";
  if (elevationSoon > elevationNow + 0.01) return "Rising";
  if (elevationSoon < elevationNow - 0.01) return "Setting";
  return "Active";
}

// Look angle + physical state for one tracked object at a given instant.
function computeState(entry, observerGd, date) {
  const satrec = satellite.twoline2satrec(entry.line1, entry.line2);
  const propagated = satellite.propagate(satrec, date);
  if (!propagated?.position || !propagated?.velocity) return null;

  const gmst = satellite.gstime(date);
  const positionEcf = satellite.eciToEcf(propagated.position, gmst);
  const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);
  const geodetic = satellite.eciToGeodetic(propagated.position, gmst);

  const { x: vx, y: vy, z: vz } = propagated.velocity;
  const speedKmS = Math.sqrt(vx * vx + vy * vy + vz * vz);

  return {
    azimuth: (lookAngles.azimuth * RAD2DEG + 360) % 360,
    elevation: lookAngles.elevation * RAD2DEG,
    rangeKm: lookAngles.rangeSat,
    altitudeKm: geodetic.height,
    velocityKmS: speedKmS
  };
}

export async function getVisibleSatellites({ lat, lng, alt = 0, minElevation = -12, limit = 60 }) {
  const catalog = await getCatalog();
  const observerGd = toObserverGd(lat, lng, alt);
  const now = new Date();
  const soon = new Date(now.getTime() + 20_000);

  const results = [];

  for (const entry of catalog) {
    const state = computeState(entry, observerGd, now);
    if (!state || state.elevation < minElevation) continue;

    const future = computeState(entry, observerGd, soon);
    const status = future ? statusFor(state.elevation, future.elevation) : state.elevation > 0 ? "Active" : "Below horizon";

    results.push({
      id: entry.catalogNumber,
      name: entry.name,
      type: entry.type,
      operator: entry.operator,
      category: entry.category,
      color: entry.colorKey,
      azimuth: Number(state.azimuth.toFixed(1)),
      elevation: Number(state.elevation.toFixed(1)),
      distance: Math.round(state.rangeKm),
      altitude: Math.round(state.altitudeKm),
      velocity: Number(state.velocityKmS.toFixed(2)),
      status
    });
  }

  results.sort((a, b) => b.elevation - a.elevation);
  return results.slice(0, limit);
}

export async function getSatelliteState({ catalogNumber, lat, lng, alt = 0 }) {
  const entry = await getSatelliteByCatalogNumber(catalogNumber);
  if (!entry) return null;
  const observerGd = toObserverGd(lat, lng, alt);
  const state = computeState(entry, observerGd, new Date());
  if (!state) return null;

  return {
    id: entry.catalogNumber,
    name: entry.name,
    type: entry.type,
    operator: entry.operator,
    category: entry.category,
    color: entry.colorKey,
    azimuth: Number(state.azimuth.toFixed(1)),
    elevation: Number(state.elevation.toFixed(1)),
    distance: Math.round(state.rangeKm),
    altitude: Math.round(state.altitudeKm),
    velocity: Number(state.velocityKmS.toFixed(2))
  };
}

// Step through time, looking for the sky-track crossing the horizon —
// that's a real pass prediction, not a canned number.
export async function getPasses({ catalogNumber, lat, lng, alt = 0, hours = 48, stepSeconds = 20, maxPasses = 6 }) {
  const entry = await getSatelliteByCatalogNumber(catalogNumber);
  if (!entry) return [];

  const satrec = satellite.twoline2satrec(entry.line1, entry.line2);
  const observerGd = toObserverGd(lat, lng, alt);

  const start = Date.now();
  const end = start + hours * 3600 * 1000;
  const stepMs = stepSeconds * 1000;

  const passes = [];
  let current = null; // { start, maxElevation, maxElevationTime, startAzimuth }
  let previousElevation = null;

  for (let t = start; t <= end; t += stepMs) {
    const date = new Date(t);
    const propagated = satellite.propagate(satrec, date);
    if (!propagated?.position) continue;

    const gmst = satellite.gstime(date);
    const positionEcf = satellite.eciToEcf(propagated.position, gmst);
    const look = satellite.ecfToLookAngles(observerGd, positionEcf);
    const elevationDeg = look.elevation * RAD2DEG;
    const azimuthDeg = (look.azimuth * RAD2DEG + 360) % 360;

    if (previousElevation !== null && previousElevation <= 0 && elevationDeg > 0) {
      // Rise
      current = {
        start: date,
        startAzimuth: azimuthDeg,
        maxElevation: elevationDeg,
        maxElevationAzimuth: azimuthDeg,
        maxElevationTime: date
      };
    }

    if (current && elevationDeg > current.maxElevation) {
      current.maxElevation = elevationDeg;
      current.maxElevationAzimuth = azimuthDeg;
      current.maxElevationTime = date;
    }

    if (current && previousElevation !== null && previousElevation > 0 && elevationDeg <= 0) {
      // Set
      passes.push({
        start: current.start,
        end: date,
        maxElevation: Number(current.maxElevation.toFixed(1)),
        maxElevationTime: current.maxElevationTime,
        startAzimuth: Number(current.startAzimuth.toFixed(0)),
        maxElevationAzimuth: Number(current.maxElevationAzimuth.toFixed(0)),
        endAzimuth: Number(azimuthDeg.toFixed(0)),
        durationSeconds: Math.round((date.getTime() - current.start.getTime()) / 1000)
      });
      current = null;
      if (passes.length >= maxPasses) break;
    }

    previousElevation = elevationDeg;
  }

  return passes.map((pass) => ({
    start: pass.start.toISOString(),
    end: pass.end.toISOString(),
    maxElevationTime: pass.maxElevationTime.toISOString(),
    maxElevation: pass.maxElevation,
    startAzimuth: pass.startAzimuth,
    maxElevationAzimuth: pass.maxElevationAzimuth,
    endAzimuth: pass.endAzimuth,
    durationSeconds: pass.durationSeconds
  }));
}

// Cross-catalog view: just the next single pass for every tracked object,
// within a shorter lookahead window. Powers the "upcoming passes" panel
// without paying for a full multi-pass search across the whole catalog.
export async function getNextPassForEach({ lat, lng, alt = 0, hours = 8, stepSeconds = 30, limit = 12 }) {
  const catalog = await getCatalog();
  const observerGd = toObserverGd(lat, lng, alt);

  const start = Date.now();
  const end = start + hours * 3600 * 1000;
  const stepMs = stepSeconds * 1000;

  const upcoming = [];

  for (const entry of catalog) {
    const satrec = satellite.twoline2satrec(entry.line1, entry.line2);
    let previousElevation = null;
    let current = null;

    for (let t = start; t <= end; t += stepMs) {
      const date = new Date(t);
      const propagated = satellite.propagate(satrec, date);
      if (!propagated?.position) continue;

      const gmst = satellite.gstime(date);
      const positionEcf = satellite.eciToEcf(propagated.position, gmst);
      const look = satellite.ecfToLookAngles(observerGd, positionEcf);
      const elevationDeg = look.elevation * RAD2DEG;

      if (previousElevation !== null && previousElevation <= 0 && elevationDeg > 0) {
        current = { start: date, maxElevation: elevationDeg };
      }
      if (current && elevationDeg > current.maxElevation) {
        current.maxElevation = elevationDeg;
      }
      if (current && previousElevation !== null && previousElevation > 0 && elevationDeg <= 0) {
        upcoming.push({
          id: entry.catalogNumber,
          name: entry.name,
          category: entry.category,
          color: entry.colorKey,
          start: current.start.toISOString(),
          end: date.toISOString(),
          durationSeconds: Math.round((date.getTime() - current.start.getTime()) / 1000),
          maxElevation: Number(current.maxElevation.toFixed(1))
        });
        current = null;
        break; // only need the first pass for this object
      }
      previousElevation = elevationDeg;
    }
  }

  upcoming.sort((a, b) => new Date(a.start) - new Date(b.start));
  return upcoming.slice(0, limit);
}
