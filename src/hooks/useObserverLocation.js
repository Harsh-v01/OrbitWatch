import { useCallback, useEffect, useState } from "react";

// Keep one consistent location shape throughout the app.
const fallback = {
  name: "Pune, India",
  lat: 18.5204,
  lng: 73.8567,
  accuracy: 16,
  source: "Fallback"
};

export function useObserverLocation() {
  const [location, setLocation] = useState(fallback);
  const [status, setStatus] = useState("Demo location");

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("Location unavailable");
      return;
    }

    setStatus("Locating…");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({
          name: "Your location",
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: Math.round(coords.accuracy || 0),
          source: "GPS"
        });

        setStatus("Live location");
      },
      () => {
        setLocation(fallback);
        setStatus("Pune fallback");
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 5 * 60 * 1000
      }
    );
  }, []);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  return {
    location,
    status,
    refreshLocation
  };
}