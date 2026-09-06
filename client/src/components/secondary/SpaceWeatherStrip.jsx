import { Sun } from "lucide-react";

import { useSpaceWeather } from "../../hooks/useSpaceWeather";
import { DASH, number } from "../../lib/format";
import Icon from "../ui/Icon";

/*
 * Background context, kept deliberately quiet: a single strip
 * rather than a card competing with the instrument. All three
 * NOAA values are nullable, so each falls back to an em dash.
 */
export default function SpaceWeatherStrip() {
  const { weather, status } = useSpaceWeather();

  const metrics = [
    {
      label: "Kp index",
      value: weather?.kIndex === null || weather?.kIndex === undefined
        ? DASH
        : number(weather.kIndex, 1),
      hint: weather?.kIndexLabel ?? null,
    },
    {
      label: "Solar wind",
      value:
        weather?.solarWindKmS === null || weather?.solarWindKmS === undefined
          ? DASH
          : `${number(weather.solarWindKmS)} km/s`,
      hint: null,
    },
    {
      label: "10.7 cm flux",
      value:
        weather?.solarFlux === null || weather?.solarFlux === undefined
          ? DASH
          : `${number(weather.solarFlux)} sfu`,
      hint: null,
    },
  ];

  return (
    <section className="weather-strip">
      <span className="weather-strip-title">
        <Icon as={Sun} size={13} />
        Space weather
      </span>

      {status === "error" && !weather ? (
        <span className="weather-strip-note">
          NOAA conditions unavailable.
        </span>
      ) : (
        <div className="weather-strip-metrics">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <small>{metric.label}</small>
              <strong>{metric.value}</strong>
              {metric.hint && <em>{metric.hint}</em>}
            </div>
          ))}
        </div>
      )}

      <span className="weather-strip-note">
        Affects radio propagation and auroral activity, not orbital positions.
      </span>
    </section>
  );
}
