# OrbitWatch

A simple, location-aware satellite sky viewer.

The goal is intentionally straightforward: open OrbitWatch, choose your location, and see which satellites are above the horizon without turning the interface into a complicated control panel.

## Current MVP

- React + Vite
- Responsive desktop/mobile layout
- Browser geolocation with Pune fallback
- Interactive 2D sky dome
- Clickable satellite markers
- Satellite search
- Upcoming pass list
- Selected satellite details
- Simple azimuth/elevation guidance
- Space-weather summary
- Reduced-motion support

The current satellite values are demo data. The UI is structured so the demo data can later be replaced by a real orbital propagation service.

## Run

```bash
npm install
npm run dev
```

## Architecture

```text
src/
├── components/
│   ├── layout/
│   ├── radar/
│   ├── satellites/
│   └── telemetry/
├── data/
├── hooks/
├── services/
├── App.jsx
├── main.jsx
└── styles.css

server/
└── README.md
```

## Next technical step

Connect an Express API to real TLE/GP orbital data and use an orbital propagation library such as satellite.js to calculate observer-relative azimuth, elevation, distance and upcoming passes.

Keep external provider credentials on the server.
