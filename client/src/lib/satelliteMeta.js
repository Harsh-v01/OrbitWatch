/*
 * Interpretation layer.
 *
 * Everything here is derived from fields the backend actually
 * sends (name, type, operator, category, country, mission,
 * color, elevation, maxElevation). Nothing is looked up from a
 * hardcoded table of satellites.
 */

import { DASH, hasValue } from "./format";

const CATEGORY_LABELS = {
  station: "Space station",
  science: "Science / Earth observation",
  weather: "Weather",
  communication: "Communications",
  navigation: "Navigation",
  india: "Indian mission",
  other: "Catalog object",
};

const COLOR_BY_CATEGORY = {
  station: "station",
  science: "science",
  weather: "weather",
  communication: "comms",
  navigation: "science",
  india: "india",
};

/*
 * India detection uses the real provider metadata. tleCache
 * sets country/category on merged entries and derives
 * `featured` from country === "India", so all three agree;
 * featured is only trusted when country is absent.
 */
export function isIndian(satellite) {
  if (!satellite) return false;

  const country =
    typeof satellite.country === "string"
      ? satellite.country.trim().toLowerCase()
      : "";

  if (country) return country === "india";
  if (satellite.category === "india") return true;

  return satellite.featured === true;
}

export function categoryLabel(satellite) {
  if (!satellite) return DASH;

  /* The provider's own type string is more specific, so prefer it. */
  if (satellite.type) return satellite.type;

  return CATEGORY_LABELS[satellite.category] ?? CATEGORY_LABELS.other;
}

export function colorKey(satellite) {
  if (!satellite) return "other";
  if (satellite.color) return satellite.color;

  return COLOR_BY_CATEGORY[satellite.category] ?? "other";
}

/*
 * Reads an operator/country line without inventing either half.
 */
export function originLabel(satellite) {
  if (!satellite) return DASH;

  const parts = [];

  if (isIndian(satellite)) {
    parts.push("🇮🇳 INDIA");
  } else if (satellite.country) {
    parts.push(String(satellite.country).toUpperCase());
  }

  if (satellite.operator) parts.push(satellite.operator);

  return parts.length ? parts.join(" · ") : DASH;
}

/*
 * Pass quality thresholds. Interpretation of a real
 * maxElevation figure — not a substitute for one.
 */
export function passQuality(maxElevation) {
  if (!hasValue(maxElevation)) {
    return {
      label: "Unknown",
      tone: "neutral",
      detail: "Peak elevation was not reported for this pass.",
    };
  }

  const peak = Number(maxElevation);

  if (peak >= 60) {
    return {
      label: "Excellent visibility",
      tone: "green",
      detail: "Passes high overhead — easy to find and follow.",
    };
  }

  if (peak >= 30) {
    return {
      label: "Good visibility",
      tone: "amber",
      detail: "Clears most rooftops and trees comfortably.",
    };
  }

  return {
    label: "Low visibility",
    tone: "neutral",
    detail: "Stays near the horizon — needs an unobstructed view.",
  };
}

/*
 * Backend status strings: Rising | Setting | Active | Below horizon.
 */
export function statusTone(status) {
  switch (status) {
    case "Rising":
      return "green";
    case "Active":
      return "green";
    case "Setting":
      return "amber";
    case "Below horizon":
      return "neutral";
    default:
      return "neutral";
  }
}

export function isAboveHorizon(satellite) {
  return hasValue(satellite?.elevation) && Number(satellite.elevation) > 0;
}

/*
 * getVisibleSatellites uses minElevation -12, so the list also
 * contains objects just below the horizon. That distinction is
 * worth showing rather than hiding.
 */
export function countAboveHorizon(satellites) {
  if (!Array.isArray(satellites)) return 0;
  return satellites.filter(isAboveHorizon).length;
}

export function elevationPhrase(satellite) {
  if (!hasValue(satellite?.elevation)) return DASH;

  const elevation = Number(satellite.elevation);

  if (elevation <= 0) return "Below your horizon";
  if (elevation < 10) return "Low in the sky";
  if (elevation < 45) return "Clear of the horizon";
  if (elevation < 75) return "High in the sky";

  return "Almost directly overhead";
}

export function searchMatches(satellite, query) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return true;

  return [
    satellite.name,
    satellite.mission,
    satellite.type,
    satellite.operator,
    satellite.country,
    satellite.id,
  ]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .some((value) => String(value).toLowerCase().includes(q));
}
