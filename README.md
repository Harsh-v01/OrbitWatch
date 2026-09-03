# OrbitWatch

A location-aware satellite sky viewer. Open OrbitWatch, and see which
satellites are actually above the horizon right now — real orbital data,
propagated for your exact coordinates.

## What's real here

- **Live orbital elements.** The server pulls current TLE/GP data for the ISS,
  Tiangong, Hubble, NOAA weather satellites, Earth-observation satellites, and
  a sample of Starlink/OneWeb from [CelesTrak](https://celestrak.org).
- **Real propagation.** Every position (azimuth, elevation, range, altitude,
  velocity) is computed with `satellite.js` (an SGP4 implementation) for your
  actual latitude/longitude — nothing is hardcoded or looked up from a table.
- **Real pass predictions.** Rise/set times come from stepping the propagator
  forward and detecting horizon crossings, not a canned schedule.
- **A real star field.** The sky chart's background stars are plotted from
  each star's catalog RA/Dec, converted to alt/az using your location and the
  current local sidereal time.
- **Real space weather.** Kp index, solar wind speed, and 10.7cm solar flux
  come from NOAA's Space Weather Prediction Center.

## Architecture

```text
OrbitWatch/
├── src/                  React + Vite client
│   ├── components/
│   ├── data/stars.js      bright-star catalog (RA/Dec)
│   ├── lib/astro.js        RA/Dec -> Alt/Az math
│   ├── hooks/               polling hooks for satellites / passes / weather
│   └── services/            fetch wrappers around the API below
└── server/                Express API
    ├── src/services/tleCache.js       fetches + caches TLEs from CelesTrak
    ├── src/services/orbitService.js   satellite.js propagation, look angles, passes
    ├── src/services/spaceWeatherService.js
    └── src/routes/
```

## API

- `GET /api/satellites/above?lat=&lng=&alt=` — everything currently near or
  above your horizon.
- `GET /api/satellites/:catalogNumber?lat=&lng=` — live state for one object
  (works for any valid NORAD catalog number, not just the curated set).
- `GET /api/satellites/:catalogNumber/passes?lat=&lng=&hours=48` — upcoming
  passes for one object.
- `GET /api/satellites/passes/next?lat=&lng=&hours=8&limit=12` — the next
  pass for every tracked object, sorted by time.
- `GET /api/space-weather` — current Kp index, solar wind, solar flux.
