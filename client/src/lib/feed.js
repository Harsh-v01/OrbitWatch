/*
 * Honest wording for the state of the orbital feed.
 *
 * The backend chain is CelesTrak -> SatNOGS -> local cache, and
 * `orbitalData.provider.name` reports which link answered
 * ("celestrak" | "satnogs" | "cache" | "none"). The UI names it
 * rather than implying everything is always live.
 */

import { number, since } from "./format";

const PROVIDER_NAMES = {
  celestrak: "CelesTrak",
  satnogs: "SatNOGS",
  cache: "Local cache",
  none: "No provider",
};

export function providerLabel(orbitalData) {
  const name = orbitalData?.provider?.name;
  if (!name) return null;

  return PROVIDER_NAMES[name] ?? name;
}

export function feedState(status, orbitalData) {
  const count = orbitalData?.count;

  switch (status) {
    case "ready":
      return {
        key: "live",
        label: "LIVE",
        tone: "green",
        headline: "Orbital tracking live",
        detail: count
          ? `Propagating ${number(count)} catalog objects for your position.`
          : "Propagating the active catalog for your position.",
      };

    case "stale":
      return {
        key: "stale",
        label: "CACHED",
        tone: "amber",
        headline: "Using cached orbital elements",
        detail: `The providers are unreachable, so the last good catalog is being propagated${
          orbitalData?.ageMs ? ` · ${since(orbitalData.ageMs)}` : ""
        }.`,
      };

    case "unavailable":
      return {
        key: "unavailable",
        label: "OFFLINE",
        tone: "red",
        headline: "Orbital data unavailable",
        detail:
          "No positions are shown rather than guessed ones. Tracking resumes automatically.",
      };

    case "error":
      return {
        key: "error",
        label: "ERROR",
        tone: "red",
        headline: "Could not reach the tracker",
        detail: "The orbital service did not respond to the last request.",
      };

    default:
      return {
        key: "loading",
        label: "SYNC",
        tone: "neutral",
        headline: "Connecting to the orbital feed",
        detail: "Fetching current orbital elements.",
      };
  }
}
