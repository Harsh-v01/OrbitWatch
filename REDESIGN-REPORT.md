# OrbitWatch frontend redesign — implementation report

## What this was

The frontend was a generic dashboard: equal-weight widgets, a small radar treated as
one card among many, and a telemetry panel reading fields the backend never sent. It
has been rebuilt around the four questions the product actually exists to answer —
where am I observing from, what is above me right now, what am I looking at, and when
will I next be able to see it — with a visual hierarchy that matches that order rather
than giving every panel the same prominence.

The backend was not replaced. The CelesTrak → SatNOGS → disk-cache → stale-serve
fallback chain is intact and was verified working end to end (see *Verification*).
`server/src/services/tleCache.js`, which implements that chain, is byte-identical to
before this work.

## Files changed

### Backend — four additive edits, no removals

| File | Change |
| --- | --- |
| `server/src/services/orbitService.js` | `computeState()` now also derives sub-satellite latitude/longitude via `eciToGeodetic`. `getVisibleSatellites()` emits `latitude`/`longitude`. `getSatelliteState()` emits `status`, lat/long, plus `objectId`, `periodMinutes`, `inclination`, `apogeeKm`, `perigeeKm`, `epoch`, `source`. |
| `server/src/routes/satellites.js` | `orbitalDataState()` now includes `provider`, so the UI can name which source is live and whether it is in cooldown. |
| `server/src/data/trackedSatellites.js` | `categoryColor("india")` returned `"station"`, so Indian missions were painted as space stations. It now returns `"india"`. |
| `server/data/cache/catalog.json` | Touched by the running server refreshing its own cache, not by hand. |

Every added field is computed from the existing SGP4 propagation. No new data source,
no hardcoded orbital elements, no invented pass times.

### Frontend — new files

Shared primitives live in `components/ui/` (`Panel`, `PanelHeader`, `Readout`,
`Badge`, `EmptyState`, `Icon`), layout in `components/layout/` (`TopBar`, `NavTabs`,
`FeedBanner`, `PageHeader`), the instrument in `components/radar/` (`SkyRadar`,
`RadarControls`, `RadarLegend`, `projection.js`), the answer column in
`components/selected/` (`SatelliteIdentity`, `NextPass`, `LiveTelemetry`), context in
`components/secondary/` (`PassSchedule`, `SpaceWeatherStrip`), plus
`components/sky/SkyIntro`, `components/ErrorBoundary`, the hooks `useTheme`,
`useSatellitePasses`, `useSatelliteTrack`, and the four files in `pages/`.

### Frontend — rewritten

`App.jsx` went from 294 lines of embedded UI to 152 lines that own only shared state:
the observer location, the live catalog, the selected object, the active section, and a
single one-second clock for the whole app. Nothing visual lives there any more.

`components/radar/SkyRadar.jsx` was rewritten (1241 lines changed) and
`styles.css` was replaced wholesale (988 lines → 2173).

### Frontend — deleted

Ten files that nothing imported: `telemetry/Telemetry.jsx`,
`telemetry/SelectedSatellite.jsx`, `telemetry/AzimuthCard.jsx`,
`dashboard/DashboardStats.jsx`, `dashboard/SystemStatus.jsx`, `layout/Header.jsx`,
`layout/Sidebar.jsx`, `satellites/SpaceWeather.jsx`, `ui/SectionHeading.jsx`,
`ui/StatCard.jsx`. The now-empty `telemetry/` and `dashboard/` directories went with
them. Two of these were the source of the fabricated-field bug. Nothing still in use
was removed: `SatelliteCatalog`, `UpcomingPasses`, `FeedBanner`, `PageHeader`,
`RadarLegend`, `lib/feed` and `data/stars` are all still imported and were kept.

## What changed functionally

**The fabricated-telemetry bug is fixed.** The old telemetry panel read
`satellite.altitudeKm`, `satellite.velocityKmS` and `satellite.catalogNumber`. None of
those fields have ever existed in the API response. The real names, confirmed against a
live response, are `altitude`, `velocity`, `distance` and `id`. `LiveTelemetry` now
reads those, labels `distance` as "Range", and shows altitude, velocity, azimuth,
elevation, range, latitude and longitude with units.

**Absent data is shown as absent.** `Readout` marks itself `is-absent` when a value
formats to an em dash, and renders it in a lighter weight so a missing measurement can
never be mistaken for a measurement. In `SatelliteIdentity`, rows whose value is
`null`/`undefined`/empty are filtered out entirely rather than being filled with
plausible-sounding text — country and mission are genuinely null for most bulk catalog
objects, so those rows simply disappear.

**Pass predictions come only from the backend predictor.** `useSatellitePasses` calls
`GET /api/satellites/:id/passes` and the UI renders exactly what comes back: start
date and time, duration, maximum elevation, and rise/peak/set azimuths, with an
Excellent/Good/Low reading derived from the returned maximum elevation. The arc drawn
on the radar is that same predicted pass, and the faint solid line is genuinely
observed positions accumulated from previous polls — neither is a decorative trail.

**The radar is the centrepiece, not a widget.** It is an azimuthal-equidistant
projection (`r = RADIUS · (90 − elevation) / 90`) on a 600-unit viewBox, and it takes
roughly 60% of the page width on desktop while the answer column supports it. Zoom is a
real transform about the radar centre —
`translate(300 300) scale(z) translate(-300 -300)` applied to a group inside a
`clipPath` — with markers counter-scaled by `1/z` so they keep a constant on-screen
size as the sky expands beneath them. Labels are budgeted by density (2 to 6 depending
on how crowded the sky is) so a busy pass does not turn into a wall of text, and the
star field is memoised on a 30-second bucket rather than recomputed per frame.

**Selecting anything, anywhere, updates everything in place.** Clicking a radar
marker, a catalog row or a search result sets one piece of state in `App`, and the
identity, next pass, telemetry and schedule panels all re-derive from it. Selecting
from the catalog also switches back to the sky view, so the flow is continuous and
never leaves the user on a page that has silently changed underneath them.

**Colour means category, shape means state.** Objects are coloured by category
(stations, science, weather, comms, India in saffron), while selection is a dashed
reticle and prediction is a dashed arc. Because state is carried by shape rather than
hue, a theme change cannot make selection ambiguous. Indian missions additionally get
an 🇮🇳 INDIA marker in the identity panel.

**Every data state is deliberate UI.** Loading, unavailable, degraded-but-serving-
cache, nothing-above-the-horizon, nothing-selected, tracked-object-has-set, and
no-pass-within-48-hours each have their own worded state. "The object you were tracking
has left your sky" is a real outcome of orbital mechanics, not an error, and is worded
as such. `FeedBanner` renders nothing at all when the feed is healthy, and names the
`CelesTrak → SatNOGS → cache` chain when it is not.

**One panel failing cannot blank the page.** Each region of the sky page is wrapped in
its own `ErrorBoundary`, and every lucide glyph is passed as a prop and rendered
through `ui/Icon`, which returns `null` for a missing or invalid glyph instead of
throwing "Element type is invalid" and unmounting the tree.

**Theme.** Dark, light and system, persisted under `orbitwatch-theme`, with a
`matchMedia` listener (and a Safari `addListener` fallback) so "system" tracks changes
live. Light mode is a cool grey instrument with a pale daytime dome, not a white
rectangle. Crucially, no colour is hardcoded anywhere in the SVG: the dome gradients,
grid lines, star field, category colours and label halos are all custom properties
declared in both themes, which is why switching theme cannot break the radar. The
stylesheet's duplicated theme block — the old file declared `:root` four times, twice
verbatim — is gone; there is now exactly one dark block and one light block.

## Verification

`vite build` **could not be run here, and this is an environment limitation rather than
a code result.** `client/node_modules/@rollup` contains only `rollup-win32-x64-gnu` and
`rollup-win32-x64-msvc`; the dependencies were installed on Windows, and this sandbox is
Linux, so rollup exits with `Cannot find module '@rollup/rollup-linux-x64-gnu'`.
Installing the Linux binary was not possible (the registry returned 403) and doing so
would have polluted your `node_modules` anyway. **Please run `npm run build` in
`client/` on Windows to confirm.**

In its place, everything a build would have caught was checked statically with the
Babel packages already installed, and the backend was checked dynamically by actually
running it:

*Static.* All 42 client modules parse as ESM + JSX. Every relative import resolves to a
real file, and every named and default import exists as an export in its target — this
is what would have caught a stale import left behind by the ten deletions. All 33
lucide icon names were checked against the 6164 real exports of the installed
lucide-react 1.40.0; all are present. No hook is called at module top level or inside a
non-component function, so all React state is declared inside components. All 145 CSS
classes used in JSX have a rule in the stylesheet, all 47 custom properties consumed
are declared, and all 19 radar-critical properties are declared in *both* themes. No
`<button>`, `<div>`, `<span>`, `<input>` or `foreignObject` appears anywhere inside the
`<svg>`; the fullscreen and zoom controls are plain HTML rendered outside it.

*Dynamic.* The server was started and queried. The fallback chain behaved exactly as
designed: CelesTrak failed (no direct egress from the sandbox), SatNOGS failed, and it
served 471 objects from the disk cache flagged `status: "stale", cached: true`, with
provider cooldown reported — which is precisely the degraded state the new `FeedBanner`
is built to explain. `/api/satellites/above` returned 56 objects above the horizon,
`/api/satellites/25544/passes` returned 6 real SGP4 passes, and
`/api/satellites/passes/next` returned 12 scheduled entries. The set of properties the
frontend reads off a satellite (`altitude, azimuth, category, color, country, distance,
elevation, featured, id, latitude, longitude, mission, name, operator, status, type,
velocity`) and off a pass (`durationSeconds, end, endAzimuth, id, maxElevation,
maxElevationAzimuth, maxElevationTime, name, start, startAzimuth`) was extracted from
the source and compared against those live payloads. Every field matches. Nothing is
read that the backend does not send.

The validator is saved at `client/validate.mjs` if you want to re-run it:
`node validate.mjs`.

## How to run it

Two terminals from the project root. Start the API first:

```
npm run server:dev      # Express on http://localhost:8787
```

Then the client:

```
npm run client:dev      # Vite on http://localhost:5173
```

Open http://localhost:5173. Vite proxies `/api` to port 8787, so no environment
variables or extra configuration are needed. All five endpoints the client calls were
confirmed returning 200: `/api/satellites/above`, `/api/satellites/:id`,
`/api/satellites/:id/passes`, `/api/satellites/passes/next` and `/api/space-weather`.

The browser will ask for location permission. If you decline or it times out, the app
falls back to Pune (18.5204, 73.8567) and labels the header "Pune fallback" rather than
silently pretending to know where you are; granting it shows "Live location". The header
always states which of the two you are looking at, and the coordinates beside it are the
ones actually used for every pass prediction.

## Remaining issues worth your attention

**Run the Windows build.** As above, this is the one check I could not perform. The
static analysis makes a compile failure unlikely, but it is not a substitute.

**Three orbital fields come back as zero.** `getSatelliteState()` returns
`periodMinutes: 0`, `apogeeKm: 0` and `perigeeKm: 0` for cached objects, because the
disk cache does not carry the mean-motion values needed to derive them. I deliberately
did not surface these fields anywhere in the UI, so nothing currently displays a
misleading "0 min" — but if you want orbital period or apogee/perigee shown later,
they need deriving from mean motion first, and zero must be treated as unavailable
rather than as a value.

**`operator` arrives as a literal em dash.** The backend sends `operator: "—"` rather
than `null` when the operator is unknown. The identity panel filters on
null/undefined/empty, so that row renders as "—", which reads correctly as unavailable.
It is worth normalising server-side to `null` at some point so the row drops out
entirely, consistent with country and mission.

**Space weather has no live values in my sandbox, but its wiring is verified.**
`GET /api/space-weather` returns 200 with `kIndex: null`, `kIndexLabel: "Unavailable"`,
`solarWindKmS: null`, `solarFlux: null` because NOAA is unreachable from here. The three
fields `SpaceWeatherStrip` reads are exactly `kIndex`, `solarWindKmS` and `solarFlux`,
all of which exist in the payload, and every one falls back to an em dash — so the strip
degrades correctly rather than inventing numbers. On your machine, with NOAA reachable,
it should populate; that is the one behaviour I could observe only in its empty state.

**`ABOUT.md` shows as modified** in git from earlier in this work. Worth a glance
before committing if you did not expect that.
