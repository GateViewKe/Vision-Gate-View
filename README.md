# GateView — JKIA Intelligent Airport Platform

Real-time 3D airport map, indoor navigation, congestion heatmaps, flight intelligence, and admin portal for Jomo Kenyatta International Airport.

---

## 🚀 Deploy to Railway (free, ~5 minutes)

### Step 1 — Push to GitHub

```bash
cd gateview
git init
git add .
git commit -m "Initial GateView deployment"
# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/gateview.git
git push -u origin main
```

### Step 2 — Create Railway project

1. Go to **[railway.app](https://railway.app)** → Sign up with GitHub (free)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `gateview` repository → Railway auto-detects Next.js

### Step 3 — Add PostgreSQL

1. In your Railway project, click **+ New** → **Database** → **Add PostgreSQL**
2. Railway automatically sets `DATABASE_URL` in your environment — done

### Step 4 — Set environment variables

In Railway → your web service → **Variables**, add:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePasswordHere
NODE_ENV=production
```

Optional (for live flight data):
```
AVIATIONSTACK_API_KEY=your_key_from_aviationstack.com
```

### Step 5 — Run database setup

In Railway → your web service → **Settings** → **Deploy** → run these one-time commands:

```bash
# Push schema
npm run db:push

# Seed JKIA data (all 3 floors, 47 POIs, 12 beacons)
npm run db:seed
```

Or use Railway's one-off command runner in the dashboard.

### Step 6 — Deploy

Railway deploys automatically on every `git push`. Your app will be live at:
```
https://gateview-production.up.railway.app
```

---

## 🌐 URL structure

| URL | Description |
|-----|-------------|
| `/` | 3D airport map (passenger view) |
| `/admin` | Admin portal (requires login) |
| `/api/health` | Health check (used by Railway) |

---

## 🔑 Admin login

Default credentials (change in Railway environment variables):
- Username: `admin`
- Password: `gateview-admin`

Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in Railway to override.

---

## 📡 API reference

```bash
# Map data (floor POIs)
GET /api/map?terminalId=jkia-l1

# A* navigation
POST /api/navigate
Body: { "from": {"x":160,"y":300}, "to": {"x":310,"y":75} }

# Wi-Fi positioning (simulated)
POST /api/position
Body: { "sessionId": "demo", "simulate": true }

# Live positioning (real beacons)
POST /api/position
Body: { "sessionId": "device-abc", "readings": [{"macAddress":"AA:BB:CC:DD:EE:04","rssi":-62}] }

# Flight data
GET /api/flights
GET /api/flights?gate=B12

# Congestion heatmap
GET /api/congestion?floorId=1&resolution=40

# Admin CRUD
GET/POST   /api/admin/pois
PATCH/DELETE /api/admin/pois/:id
GET/POST   /api/admin/beacons
PATCH/DELETE /api/admin/beacons/:id
GET/POST   /api/admin/floors
PATCH/DELETE /api/admin/floors/:id
```

---

## 🏗 Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| 3D rendering | Three.js |
| Database | PostgreSQL (Railway managed) |
| ORM | Prisma |
| State | Zustand |
| Positioning | Wi-Fi triangulation (log-distance path loss) |
| Pathfinding | A* with diagonal movement + smoothing |
| Auth | HTTP Basic Auth (middleware.ts) |
| Language | TypeScript |

---

## 📁 Project structure

```
gateview/
├── app/
│   ├── page.tsx                    ← 3D passenger map
│   ├── admin/                      ← Admin portal (4 pages)
│   └── api/
│       ├── health/                 ← Railway health check
│       ├── map/                    ← Floor plan + POI data
│       ├── navigate/               ← A* pathfinding
│       ├── position/               ← Wi-Fi positioning
│       ├── flights/                ← Flight status
│       ├── congestion/             ← Heatmap
│       └── admin/                  ← CRUD (pois, beacons, floors)
├── components/
│   └── AirportMap3D.tsx            ← Three.js 3D scene
├── lib/
│   ├── congestion.ts               ← Heatmap engine
│   ├── pathfinding.ts              ← A* algorithm
│   ├── positioning.ts              ← Wi-Fi triangulation
│   ├── store.ts                    ← Zustand state
│   └── db.ts                       ← Prisma singleton
├── prisma/
│   ├── schema.prisma               ← DB schema (Airport, Terminal, POI, Beacon, PositionLog, AuditLog)
│   └── seed.ts                     ← JKIA seed data (3 floors, 47 POIs, 12 beacons)
├── middleware.ts                   ← Basic auth on /admin
└── railway.toml                    ← Railway deployment config
```

---

## 🗺 JKIA Terminal 1A data

**L0 — Arrivals & Check-in**
- 4 check-in zones (30 counters total)
- 5 baggage carousels
- Arrivals immigration (20 counters)
- KCB Forex, Equity ATM, Taxi/Car hire, Bus stop 34

**L1 — Departures**
- 12 gates: B10–B21
- Departure immigration + 2 security lanes
- Nakumatt Duty Free, Java House, Artcaffe, Hardee's, Amaica
- Pride Lounge + Simba Lounge
- Medical centre, prayer room

**L2 — Mezzanine**
- Simba Restaurant (panoramic views)
- VIP Suite + Conference rooms A & B
- Medical suite

---

## 🔄 Upgrading to live data

**Flight data:** Set `AVIATIONSTACK_API_KEY` — the `/api/flights` route automatically switches from mock to live.

**Congestion:** Replace `simulateCongestion()` in `lib/congestion.ts` with a query against your `PositionLog` table:
```sql
SELECT ROUND(x/10)*10 as gx, ROUND(y/10)*10 as gy, COUNT(*) as density
FROM "PositionLog"
WHERE "createdAt" > NOW() - INTERVAL '5 minutes'
GROUP BY gx, gy
```

**Positioning:** POST real Wi-Fi RSSI readings from passenger devices to `/api/position` with beacon MAC addresses.
