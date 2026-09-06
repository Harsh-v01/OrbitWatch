import { useEffect, useMemo, useState } from "react";
import { getSatellitePasses } from "../services/satelliteService";

/*
 * Pass predictions for one specific object.
 *
 * This calls the existing backend pass-prediction endpoint
 * (GET /api/satellites/:id/passes), which runs the SGP4
 * horizon-crossing scan server side. No pass time is computed,
 * estimated or interpolated in the browser.
 */

const POLL_MS = 2 * 60 * 1000;

export function useSatellitePasses(catalogNumber, location, { hours = 48 } = {}) {
  const [passes, setPasses] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [orbitalData, setOrbitalData] = useState(null);

  useEffect(() => {
    if (catalogNumber === null || catalogNumber === undefined || !location) {
      setPasses([]);
      setStatus("idle");
      setError(null);
      return undefined;
    }

    let cancelled = false;

    /* Clear immediately so one satellite never shows another's passes. */
    setPasses([]);
    setStatus("loading");
    setError(null);

    function load() {
      getSatellitePasses(catalogNumber, {
        lat: location.lat,
        lng: location.lng,
        hours,
      })
        .then((data) => {
          if (cancelled) return;

          setPasses(Array.isArray(data.passes) ? data.passes : []);
          setOrbitalData(data.orbitalData ?? null);
          setStatus(data.orbitalData?.status === "stale" ? "stale" : "ready");
          setError(null);
        })
        .catch((err) => {
          if (cancelled) return;

          setError(err.message);
          setOrbitalData(err.body?.orbitalData ?? null);
          setStatus(
            err.body?.status === "unavailable" ? "unavailable" : "error"
          );
        });
    }

    load();
    const timer = setInterval(load, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [catalogNumber, location?.lat, location?.lng, hours]);

  /*
   * The scan starts at "now", so the first entry is either in
   * progress or still to come. Guard anyway in case a pass has
   * elapsed between polls.
   */
  const nextPass = useMemo(() => {
    const now = Date.now();

    return (
      passes.find((pass) => new Date(pass.end).getTime() > now) ?? null
    );
  }, [passes]);

  return { passes, nextPass, status, error, orbitalData };
}
