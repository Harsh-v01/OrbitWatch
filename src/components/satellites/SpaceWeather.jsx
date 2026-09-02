function SpaceWeather() {
  return (
    <section className="panel space-weather">
      <div className="panel-header">
        <h3>Space weather</h3>
        <span>UPDATED NOW</span>
      </div>

      <div className="weather-content">
        <div className="weather-status">
          <span className="weather-status-dot" />

          <div>
            <strong>Quiet conditions</strong>
          </div>
        </div>

        <p>
          Current solar conditions are calm. Visibility is not
          significantly affected by space weather.
        </p>

        <div className="weather-data">
          <div>
            <span>SOLAR WIND</span>
            <strong>
              412
              <small>km/s</small>
            </strong>
          </div>

          <div>
            <span>KP INDEX</span>
            <strong>
              2
              <small>QUIET</small>
            </strong>
          </div>

          <div>
            <span>SOLAR FLUX</span>
            <strong>
              148
              <small>SFU</small>
            </strong>
          </div>

          <div>
            <span>AURORA</span>
            <strong>
              LOW
              <small>ACTIVITY</small>
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SpaceWeather;