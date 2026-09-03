import { useEffect, useRef, useState } from "react";
import { getSatellitesAbove } from "../services/satelliteService";

const POLL_MS = 15000;

export function useSatellites(location) {
  const [satellites, setSatellites] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!location) return undefined;
    let cancelled = false;

    async function load() {
      try {
        const data = await getSatellitesAbove({ lat: location.lat, lng: location.lng });
        if (cancelled) return;
        setSatellites(data.satellites);
        setUpdatedAt(new Date());
        setStatus("ready");
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        setStatus((prev) => (prev === "ready" ? "ready" : "error"));
      }
    }

    load();
    timerRef.current = setInterval(load, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, [location?.lat, location?.lng]);

  return { satellites, status, error, updatedAt };
}
