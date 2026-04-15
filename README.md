# GateView — Intelligent 3D Airport Experience Platform

Real-time indoor navigation, flight intelligence, and passenger analytics for airports.

## Stack

- **Framework**: Next.js 14 (App Router)
- **3D/2D Map**: Canvas 2D (upgrade path: Three.js via `@react-three/fiber`)
- **State**: Zustand
- **Database**: PostgreSQL + Prisma ORM
- **Positioning**: Wi-Fi triangulation (log-distance path loss model)
- **Pathfinding**: A* with diagonal movement + path smoothing
- **Language**: TypeScript

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL
```

### 3. Set up the database

```bash
# Push schema to your PostgreSQL instance
npm run db:push

# Seed with JKIA Terminal 1A demo data
npm run db:seed
```

### 4. Run the dev server

```bash
npm run dev
# Open http://localhost:3000
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/map?terminalId=` | Floor plan + POI data |
| `POST` | `/api/navigate` | A* route from `{from}` to `{to}` |
| `POST` | `/api/position` | Wi-Fi triangulation / simulated position |
| `GET` | `/api/flights?airport=NBO&gate=B12` | Flight data (mock or live) |

### Navigate example

```bash
curl -X POST http://localhost:3000/api/navigate \
  -H "Content-Type: application/json" \
  -d '{"from":{"x":160,"y":300},"to":{"x":630,"y":90}}'
```

### Position example (simulated)

```bash
curl -X POST http://localhost:3000/api/position \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-123","simulate":true}'
```

### Position example (real Wi-Fi readings)

```bash
curl -X POST http://localhost:3000/api/position \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "device-abc",
    "readings": [
      {"macAddress":"AA:BB:CC:DD:EE:01","rssi":-62},
      {"macAddress":"AA:BB:CC:DD:EE:02","rssi":-71},
      {"macAddress":"AA:BB:CC:DD:EE:04","rssi":-80}
    ]
  }'
```

## Wi-Fi Positioning

The positioning engine uses the **log-distance path loss model**:

```
distance = 10 ^ ((TxPower - RSSI) / (10 × n))
```

Where `n = 2.7` (indoor path loss exponent). Position is estimated via **weighted centroid** (weight = 1/d²) across all visible access points.

To use real positioning:
1. Deploy Wi-Fi access points and record their `macAddress`, `x`, `y` coordinates in the `Beacon` table
2. Scan Wi-Fi from the passenger device and POST RSSI readings to `/api/position`
3. The engine returns `{ x, y, accuracy, method }` with Kalman-like smoothing

## Expanding the Map

The floor plan is stored as JSON in `Terminal.floorPlan`:

```json
{
  "walls": [{ "x": 60, "y": 60, "w": 680, "h": 460 }],
  "corridors": [{ "x": 140, "y": 160, "w": 520, "h": 60 }]
}
```

Update via `prisma studio` or a dedicated admin API route.

## Roadmap

- [ ] Three.js 3D map with extruded walls and walkable floors
- [ ] Multi-floor support with elevator/escalator transitions
- [ ] Live flight data via AviationStack API
- [ ] Real-time congestion heatmaps
- [ ] Advertiser dashboard
- [ ] Mobile PWA (iOS/Android)
- [ ] BLE beacon support

## Database Schema

```
Airport → Terminal → POI
Airport → Beacon
PositionLog (per session)
```

Run `npm run db:studio` to browse data visually.

## Live Flight Data

Set `AVIATIONSTACK_API_KEY` in `.env.local` to switch from mock to live flight data.
Free tier: 500 requests/month. Get a key at https://aviationstack.com.
