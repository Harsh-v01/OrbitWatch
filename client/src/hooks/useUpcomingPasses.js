import { useEffect, useState } from "react";
import { getUpcomingPasses } from "../services/satelliteService";

const POLL_MS = 5 * 60 * 1000;

export function useUpcomingPasses(location, { hours = 8, limit = 12 } = {}) {
  const [passes, setPasses] = useState([]);
  const [status, setStatus] = useState("loading");
  const [orbitalData, setOrbitalData] = useState(null);

  useEffect(() => {
    if (!location) return undefined;
    let cancelled = false;

    function load() {
      setStatus((prev) => (prev === "ready" ? prev : "loading"));
      getUpcomingPasses({ lat: location.lat, lng: location.lng, hours, limit })
        .then((data) => {
          if (cancelled) return;
          setPasses(
            Array.isArray(data.passes)
              ? data.passes
              : []
          );
          setOrbitalData(data.orbitalData ?? null);
          setStatus(
            data.orbitalData?.status === "stale"
              ? "stale"
              : "ready"
          );
        })
        .catch((error) => {
          if (cancelled) return;
          setOrbitalData(error.body?.orbitalData ?? null);
          setStatus(
            error.body?.status === "unavailable"
              ? "unavailable"
              : "error"
          );
        });
    }

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [location?.lat, location?.lng, hours, limit]);

  return { passes, status, orbitalData };
}
