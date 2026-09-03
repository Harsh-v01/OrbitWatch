import { useEffect, useRef, useState } from "react";
import { getSatellitesAbove } from "../services/satelliteService";

const POLL_MS = 15000;

export function useSatellites(location) {
  const [satellites, setSatellites] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | stale | unavailable | error
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [orbitalData, setOrbitalData] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!location) return undefined;
    let cancelled = false;

    async function load() {
      try {
        const data = await getSatellitesAbove({ lat: location.lat, lng: location.lng });
        if (cancelled) return;
        setSatellites(
          Array.isArray(data.satellites)
            ? data.satellites
            : []
        );
        setUpdatedAt(new Date());
        setOrbitalData(data.orbitalData ?? null);
        setStatus(
          data.orbitalData?.status === "stale"
            ? "stale"
            : "ready"
        );
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        setOrbitalData(err.body?.orbitalData ?? null);
        setStatus((prev) => {
          if (
            prev === "ready" ||
            prev === "stale"
          ) {
            return prev;
          }

          return err.body?.status === "unavailable"
            ? "unavailable"
            : "error";
        });
      }
    }

    load();
    timerRef.current = setInterval(load, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, [location?.lat, location?.lng]);

  return { satellites, status, error, updatedAt, orbitalData };
}
