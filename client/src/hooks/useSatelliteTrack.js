import { useEffect, useState } from "react";
import { hasValue } from "../lib/format";

/*
 * Observed ground track for the selected object.
 *
 * Every point in this trail is a real azimuth/elevation pair
 * that the backend reported on a previous poll. Nothing is
 * extrapolated forward or backward from the current position.
 * An object that has only just been selected therefore has a
 * short trail, which is honest.
 */

const MAX_POINTS = 40;

export function useSatelliteTrack(satellite, { maxPoints = MAX_POINTS } = {}) {
  const [track, setTrack] = useState({ id: null, points: [] });

  const id = satellite?.id ?? null;
  const azimuth = satellite?.azimuth;
  const elevation = satellite?.elevation;

  useEffect(() => {
    if (id === null) {
      setTrack((previous) =>
        previous.id === null && previous.points.length === 0
          ? previous
          : { id: null, points: [] }
      );
      return;
    }

    if (!hasValue(azimuth) || !hasValue(elevation)) return;

    setTrack((previous) => {
      /* Switching satellites discards the previous history. */
      const points = previous.id === id ? previous.points : [];
      const last = points[points.length - 1];

      if (last && last.azimuth === azimuth && last.elevation === elevation) {
        return previous.id === id ? previous : { id, points };
      }

      const next = [
        ...points,
        { azimuth: Number(azimuth), elevation: Number(elevation) },
      ];

      return {
        id,
        points:
          next.length > maxPoints ? next.slice(next.length - maxPoints) : next,
      };
    });
  }, [id, azimuth, elevation, maxPoints]);

  return track.id === id ? track.points : [];
}
