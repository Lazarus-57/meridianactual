# Meridian

**Real-time 3D global surveillance. Every satellite. Every flight. Live.**

Meridian is an interactive 3D globe application for tracking spacecraft and aviation in real time. Built for the modern web — rendered in Three.js, propagated with SGP4 orbital mechanics, and deployed at the edge.

---

## Features

### Spacecraft Mode
- **79 satellites** tracked across NASA, ESA, ISRO, JAXA, CNSA, NOAA, EUMETSAT, GPS/Galileo, and commercial operators
- Real TLE orbital data from Celestrak, propagated client-side via SGP4 (`satellite.js`) — no mocked positions
- 12 satellite type categories with distinct SVG icons and color coding
- Live orbit path rendering with antimeridian-safe path splitting
- Animated ground track ring for selected satellite
- Sidebar telemetry: position, velocity, altitude, inclination, orbital period, apogee/perigee, instruments, launch date, mass
- 30-second position refresh

### Aviation Mode
- **176+ live aircraft** via ADS-B transponder data (adsb.lol)
- Airplane icons rotated by live heading
- Sidebar: airline (ICAO callsign lookup), aircraft type, registration, altitude (ft), ground speed (kts/km/h), mach number, true airspeed, heading, vertical speed, squawk — emergency codes 7700/7600/7500 highlighted
- 15-second position refresh

### Launches
- **15+ upcoming rocket launches** from Launch Library 2 (TheSpaceDevs)
- Rocket markers placed at launch pads
- Sidebar: live T-minus countdown, mission description, rocket, provider, orbit, pad

### Conflict Overlay
- 8 geopolitical markers across the Middle East with situation summaries
- Semi-transparent GeoJSON polygon over the Israel-Iran / Gulf tension region

### Globe & UX
- NASA night Earth texture with CartoCDN tile overlay (dark in space mode, voyager in aviation mode)
- Cyan atmosphere in space mode, sky-blue in aviation mode
- Auto-rotate in space mode; pauses on interaction, resumes after 10s idle
- Agency filter panel (10 agencies, multi-select, live satellite count per agency)
- Geolocate button — animates globe to your current position
- Status bar: live SAT / ROCKETS / AIRCRAFT counts

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| 3D Globe | react-globe.gl (Three.js) |
| Orbital mechanics | satellite.js (SGP4/SDP4) |
| Language | TypeScript 5 |
| Deployment | Vercel |

---

## Data Sources

| Data | Source | Refresh |
|---|---|---|
| Satellite TLEs | tle.ivanstanojevic.me | 30s (10min server cache) |
| Upcoming launches | Launch Library 2 (thespacedevs.com) | 15min |
| Live aircraft | adsb.lol ADS-B network | 15s (60s server cache) |
| Conflict zones | Static (hardcoded) | — |

All external API calls are proxied through Next.js API routes to avoid CORS issues and protect rate limits.

---

## Project Structure

```
app/
├── page.tsx                  # Landing page (animated starfield, counters, CTA)
├── globals.css               # Global styles + keyframe animations
├── layout.tsx                # Root layout (fonts, metadata)
├── components/
│   └── MapContainer.tsx      # Core globe component — all modes, markers, sidebars
├── tracker/
│   └── page.tsx              # Tracker shell — dynamically loads MapContainer (no SSR)
└── api/
    ├── tle/route.ts          # TLE proxy — 80 NORAD IDs, batched fetches
    ├── launches/route.ts     # Launches proxy — LL2 API
    └── aircraft/route.ts     # Aircraft proxy — adsb.lol, India region, unit conversion
```

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No API keys required for core functionality. The TLE, launch, and ADS-B sources are public.

---

## Architecture Notes

- **No SSR for the globe** — `MapContainer` is loaded via `next/dynamic` with `ssr: false`. Three.js / WebGL requires a browser environment.
- **Mode switching** — The Globe is given `key={mode}`, forcing a full remount on space ↔ aviation toggle to cleanly swap tile engines and reset camera state.
- **Marker memoization** — Markers are split into `htmlElements` (stable, data-driven) and `selectedLabel` (selection state only) to prevent full marker rebuilds on every click.
- **Orbit paths** — 180-point SGP4 propagation centered on current time, split into segments at the antimeridian (any longitude jump > 180°) to prevent screen-crossing artifacts.
- **Unit normalization** — adsb.lol returns feet and knots; the server route converts to SI (meters, m/s) for the Aircraft interface; the frontend converts back to display units.

---

## Versioning

- **Mk.1** — Current release. Space tracking, aviation mode, launches, conflict overlay.
- **Mk.2** — Planned.

---

*Meridian — built by Joshua.*
