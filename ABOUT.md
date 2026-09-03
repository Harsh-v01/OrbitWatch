# About OrbitWatch

## What it is

OrbitWatch is a full-stack web app that shows you which satellites are
currently over your head, and which ones will rise soon — using real orbital
data, not sample/demo values. You give it a location (or it detects one via
your browser), and it tells you what's up there right now, where to look, and
when the next visible pass happens.

It's built for anyone who wants to actually go outside and spot something —
the ISS, a Starlink train, a weather satellite — without needing to know
orbital mechanics first.

## What it does

- **Shows what's overhead right now.** A live sky chart plots every tracked
  object's current position, refreshed automatically.
- **Tells you where to look.** Azimuth (compass direction) and elevation
  (angle above the horizon) for the satellite you've selected, in plain
  language ("Face SE, 38° up").
- **Predicts upcoming passes.** For every tracked object, and in detail for
  whichever one you've selected — start time, duration, and how high it gets.
- **Reports space weather.** Kp index, solar wind speed, and solar flux,
  since geomagnetic activity is part of the "is tonight a good night to look
  up" picture.
- **Lets you search and browse.** Find a satellite by name, or scan the full
  list of currently tracked objects with their live stats.

## What it's built with

**Frontend** — `src/`
- React 18 + Vite
- Plain CSS (no UI framework) — custom design system, see `src/styles.css`
- No external charting library — the sky chart is hand-built SVG

**Backend** — `server/`
- Node.js + Express
- [`satellite.js`](https://github.com/shashwatak/satellite-js) — an SGP4/SDP4
  orbit propagator; this is the same class of model used to generate the
  orbital data in the first place, run in reverse to predict position
- In-memory caching (no database — nothing here needs to persist between
  requests)

**External data sources** (both free, public, no API key required)
- [CelesTrak](https://celestrak.org) — current orbital element sets (TLE/GP
  data) for tracked satellites
- [NOAA SWPC](https://www.swpc.noaa.gov/) — space weather (Kp index, solar
  wind, solar flux)

## How it actually works

1. The backend periodically fetches current orbital elements from CelesTrak
   for a curated list of satellites (see "What it tracks" below) and caches
   them for 2 hours — TLEs don't go stale fast enough to justify fetching
   more often.
2. When the frontend asks "what's above lat/lng right now", the backend runs
   each tracked satellite's orbital elements through `satellite.js` for the
   current timestamp, converts the result into your local sky coordinates
   (azimuth/elevation/range), and returns it.
3. Pass predictions work the same way, but stepped forward in time in small
   increments (15–30 seconds) to find where the satellite's elevation
   crosses 0° — that's a rise or set.
4. The sky chart's background stars aren't decoration — each one has a real
   catalog RA/Dec, converted to your local alt/az using your coordinates and
   the current local sidereal time (`src/lib/astro.js`).
5. The frontend polls the backend every 15 seconds for satellite positions,
   every 5 minutes for space weather and passes, so what you see stays
   current without you refreshing.

Nothing about a satellite's position is hardcoded or looked up from a static
table — if you change your location, every number recalculates for real.

## What it tracks

Not the entire ~10,000+ object catalog — that would be too slow to
propagate live on every request. Instead, a curated set defined in
`server/src/data/trackedSatellites.js`:

- **Always included, by name:** ISS, Tiangong, Hubble, NOAA-20, NOAA-21,
  Terra, Aqua, Landsat 9
- **Sampled from bulk groups:** ~12 Starlink, ~6 OneWeb, plus a handful more
  from the general "stations" and "weather" CelesTrak groups

This keeps the sky chart readable and requests fast. It's easy to track more
or different satellites — add a NORAD catalog number to the named list, or
raise the sample limits / add a new CelesTrak group.

## API endpoints

| Endpoint | What it returns |
|---|---|
| `GET /api/satellites/above?lat=&lng=` | Every tracked object near/above your horizon right now |
| `GET /api/satellites/:catalogNumber?lat=&lng=` | Live state for one object (works for any valid NORAD number) |
| `GET /api/satellites/:catalogNumber/passes?lat=&lng=&hours=48` | Upcoming passes for one object |
| `GET /api/satellites/passes/next?lat=&lng=&hours=8&limit=12` | Next pass for every tracked object, sorted by time |
| `GET /api/space-weather` | Current Kp index, solar wind, solar flux |

## What could be added next

- Track more satellites (GPS, geostationary comms, more science missions) —
  just config changes, no architecture changes needed
- Push updates over WebSockets instead of polling, for smoother real-time
  motion on the sky chart
- A proper database if you want to log pass history or let users save
  favorite satellites/locations
- Moon and planet positions on the sky chart (same alt/az math already used
  for stars would extend to these)
- Light-pollution or cloud-cover data layered onto "is this pass actually
  visible tonight"

## Limitations to know about

- TLE accuracy degrades over time since the last update — the 2-hour cache
  keeps it fresh, but orbital elements themselves are only as good as
  CelesTrak's last refresh of that object.
- Pass prediction step size (15–30s) means very short or very low passes
  could occasionally be missed or slightly mistimed.
- No accessibility/visibility filtering — a "pass" is a horizon crossing,
  not a promise the satellite is bright enough to see with the naked eye
  (the ISS almost always is; a mid-size Starlink at low elevation might not
  be).
