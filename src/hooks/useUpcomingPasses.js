import { useEffect, useState } from "react";
import { getUpcomingPasses } from "../services/satelliteService";

const POLL_MS = 5 * 60 * 1000;

export function useUpcomingPasses(location, { hours = 8, limit = 12 } = {}) {
  const [passes, setPasses] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!location) return undefined;
    let cancelled = false;

    function load() {
      setStatus((prev) => (prev === "ready" ? prev : "loading"));
      getUpcomingPasses({ lat: location.lat, lng: location.lng, hours, limit })
        .then((data) => {
          if (cancelled) return;
          setPasses(data.passes);
          setStatus("ready");
        })
        .catch(() => {
          if (cancelled) return;
          setStatus("error");
        });
    }

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [location?.lat, location?.lng, hours, limit]);

  return { passes, status };
}
