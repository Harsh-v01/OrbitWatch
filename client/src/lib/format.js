/*
 * Formatting helpers for OrbitWatch.
 *
 * One rule governs this file: if a value is not present in the
 * API response, it is rendered as an em dash. Nothing here
 * invents, estimates or defaults a measurement to zero.
 */

export const DASH = "—";

const DIRECTIONS_16 = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];

/*
 * A value counts as present only when it is a real finite
 * number. null, undefined, "" and NaN are all absent.
 */
export function hasValue(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value))
  );
}

export function number(value, digits = 0) {
  if (!hasValue(value)) return DASH;

  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/* 408 km */
export function km(value, digits = 0) {
  if (!hasValue(value)) return DASH;
  return `${number(value, digits)} km`;
}

/* 7.66 km/s */
export function kms(value) {
  if (!hasValue(value)) return DASH;
  return `${number(value, 2)} km/s`;
}

/* 142° */
export function deg(value, digits = 0) {
  if (!hasValue(value)) return DASH;
  return `${number(value, digits)}°`;
}

/* 142° ESE */
export function bearing(value) {
  if (!hasValue(value)) return DASH;
  return `${number(value, 0)}° ${compass(value)}`;
}

export function compass(azimuth) {
  if (!hasValue(azimuth)) return DASH;

  const index =
    Math.round(((Number(azimuth) % 360) + 360) % 360 / 22.5) % 16;

  return DIRECTIONS_16[index];
}

/* 18.52°N — signed coordinates read as hemispheres. */
export function latitude(value) {
  if (!hasValue(value)) return DASH;
  const n = Number(value);
  return `${Math.abs(n).toFixed(2)}°${n >= 0 ? "N" : "S"}`;
}

export function longitude(value) {
  if (!hasValue(value)) return DASH;
  const n = Number(value);
  return `${Math.abs(n).toFixed(2)}°${n >= 0 ? "E" : "W"}`;
}

/* 6m 12s */
export function duration(seconds) {
  if (!hasValue(seconds)) return DASH;

  const total = Math.max(0, Math.round(Number(seconds)));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;

  if (minutes === 0) return `${rest}s`;

  return `${minutes}m ${String(rest).padStart(2, "0")}s`;
}

function toDate(value) {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }

  if (!value) return null;

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

/* 18:42:31 */
export function clock(value, withSeconds = true) {
  const date = toDate(value);
  if (!date) return DASH;

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
    hour12: false,
  });
}

/* Thu, 3 Sep */
export function dayLabel(value) {
  const date = toDate(value);
  if (!date) return DASH;

  return date.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/*
 * Calendar-aware label so a pass tonight does not read as a
 * date the observer has to decode.
 */
export function relativeDay(value) {
  const date = toDate(value);
  if (!date) return DASH;

  const startOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const days = Math.round(
    (startOfDay(date) - startOfDay(new Date())) / 86400000
  );

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";

  return dayLabel(date);
}

/* 14s ago */
export function since(milliseconds) {
  if (!hasValue(milliseconds)) return DASH;

  const seconds = Math.max(0, Math.round(Number(milliseconds) / 1000));

  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.round(hours / 24)}d ago`;
}

/* in 42 min — used for the next pass countdown. */
export function untilLabel(target, from = Date.now()) {
  const date = toDate(target);
  if (!date) return DASH;

  const delta = date.getTime() - from;

  if (delta <= 0) return "in progress";

  const seconds = Math.round(delta / 1000);
  if (seconds < 60) return `in ${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `in ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (hours < 24) {
    return restMinutes ? `in ${hours}h ${restMinutes}m` : `in ${hours}h`;
  }

  return `in ${Math.round(hours / 24)}d`;
}
