import { useEffect, useState } from "react";
import { getSpaceWeather } from "../services/satelliteService";

const POLL_MS = 5 * 60 * 1000;

export function useSpaceWeather() {
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getSpaceWeather();
        if (cancelled) return;
        setWeather(data);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    }

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return { weather, status };
}
