import { useSpaceWeather } from "../../hooks/useSpaceWeather";

export default function SpaceWeather() {
  const { weather, status } = useSpaceWeather();

  return (
    <section className="panel space-weather">
      <div className="panel-head">
        <div>
          <h2>Space weather</h2>
          <p>From NOAA's Space Weather Prediction Center</p>
        </div>
      </div>

      {status === "loading" && !weather && <p className="muted">Reading current conditions…</p>}
      {status === "error" && !weather && <p className="muted">Conditions unavailable right now.</p>}

      {weather && (
        <>
          <p className="weather-summary">
            {weather.kIndexLabel === "Quiet" || weather.kIndexLabel === "Unsettled"
              ? "Geomagnetic conditions are calm — no notable effect on visibility."
              : `Geomagnetic activity is elevated (${weather.kIndexLabel.toLowerCase()}), which can occasionally add faint aurora at high latitudes.`}
          </p>

          <div className="weather-data">
            <div>
              <span>Kp index</span>
              <strong>
                {weather.kIndex ?? "—"} <small>{weather.kIndexLabel}</small>
              </strong>
            </div>
            <div>
              <span>Solar wind</span>
              <strong>
                {weather.solarWindKmS ?? "—"} <small>km/s</small>
              </strong>
            </div>
            <div>
              <span>10.7cm flux</span>
              <strong>
                {weather.solarFlux ?? "—"} <small>sfu</small>
              </strong>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
