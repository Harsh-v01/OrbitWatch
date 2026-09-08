# OrbitWatch
### Current Status : Work In progress
OrbitWatch is a live satellite sky tracker built around real orbital propagation.

## Structure

```text
OrbitWatch/
├── client/        # React + Vite frontend
└── server/        # Express API + satellite.js orbital engine
```

## Run locally

### Frontend

```bash
cd client
npm install
npm run dev
```

The Vite client runs on `http://localhost:5173`.

### Backend

In another terminal:

```bash
cd server
npm install
npm run dev
```

The API runs on `http://localhost:8787`.

The client proxies `/api` requests to the backend.

## Orbital data

OrbitWatch prefers CelesTrak OMM data and falls back to the SatNOGS DB TLE feed when CelesTrak is unavailable. A local disk cache is used so a previously successful catalog can continue to serve as stale data when providers are unreachable.

No synthetic satellite positions are generated when there is no usable orbital data.

## Frontend

The client is componentized into:

- layout and navigation
- live sky radar
- satellite catalog
- upcoming passes
- telemetry
- space weather
- reusable UI primitives

The radar remains a custom SVG visualization because its geometry is driven by the orbital calculations rather than a generic dashboard chart.
