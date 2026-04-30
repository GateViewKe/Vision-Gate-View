import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding GateView — JKIA Terminal 1A...')

  // ── Airport ─────────────────────────────────────────────────────────────
  const airport = await prisma.airport.upsert({
    where: { code: 'JKIA' },
    update: {},
    create: { code: 'JKIA', name: 'Jomo Kenyatta International Airport', city: 'Nairobi', country: 'Kenya' },
  })

  // ── Terminals (3 floors) ─────────────────────────────────────────────────
  const terminals = await Promise.all([
    prisma.terminal.upsert({
      where: { id: 'jkia-l0' }, update: {},
      create: {
        id: 'jkia-l0', airportId: airport.id, name: 'Terminal 1A · L0 Arrivals', floor: 0,
        floorPlan: {
          walls: [{ x: 60, y: 60, w: 680, h: 440 }],
          corridors: [{ x: 80, y: 160, w: 640, h: 60 }, { x: 80, y: 340, w: 640, h: 60 }, { x: 340, y: 160, w: 60, h: 240 }],
          escalators: [{ x: 200, y: 250 }, { x: 560, y: 250 }],
        },
      },
    }),
    prisma.terminal.upsert({
      where: { id: 'jkia-l1' }, update: {},
      create: {
        id: 'jkia-l1', airportId: airport.id, name: 'Terminal 1A · L1 Departures', floor: 1,
        floorPlan: {
          walls: [{ x: 60, y: 60, w: 680, h: 440 }],
          corridors: [{ x: 140, y: 150, w: 520, h: 60 }, { x: 140, y: 350, w: 520, h: 60 }, { x: 330, y: 150, w: 120, h: 260 }],
          escalators: [{ x: 200, y: 250 }, { x: 560, y: 250 }],
        },
      },
    }),
    prisma.terminal.upsert({
      where: { id: 'jkia-l2' }, update: {},
      create: {
        id: 'jkia-l2', airportId: airport.id, name: 'Terminal 1A · L2 Mezzanine', floor: 2,
        floorPlan: {
          walls: [{ x: 120, y: 100, w: 560, h: 360 }],
          corridors: [{ x: 140, y: 200, w: 520, h: 50 }, { x: 140, y: 320, w: 520, h: 50 }],
          escalators: [{ x: 200, y: 270 }, { x: 560, y: 270 }],
        },
      },
    }),
  ])

  const [l0, l1, l2] = terminals

  // ── POIs — L0 Arrivals ───────────────────────────────────────────────────
  const l0pois = [
    { name: 'Check-in Zone A', type: 'CHECKIN' as const, x: 160, y: 120, description: 'Counters 1–10 · Kenya Airways · SkyTeam', openHours: '04:00–23:00' },
    { name: 'Check-in Zone B', type: 'CHECKIN' as const, x: 320, y: 120, description: 'Counters 11–20 · International carriers', openHours: '04:00–23:00' },
    { name: 'Check-in Zone C', type: 'CHECKIN' as const, x: 490, y: 120, description: 'Counters 21–30 · Domestic & regional', openHours: '04:00–23:00' },
    { name: 'Self-Service Kiosks', type: 'CHECKIN' as const, x: 640, y: 120, description: 'Online check-in kiosks · Bag drop' },
    { name: 'Arrivals Immigration', type: 'IMMIGRATION' as const, x: 400, y: 270, description: 'International arrivals passport control · 20 counters' },
    { name: 'Belt 1 — Kenya Airways', type: 'BAGGAGE' as const, x: 140, y: 370, description: 'Kenya Airways arrivals · Belt 1' },
    { name: 'Belt 2 — International', type: 'BAGGAGE' as const, x: 260, y: 370, description: 'International arrivals · Belt 2' },
    { name: 'Belt 3 — International', type: 'BAGGAGE' as const, x: 380, y: 370, description: 'International arrivals · Belt 3' },
    { name: 'Belt 4 — Regional', type: 'BAGGAGE' as const, x: 500, y: 370, description: 'Regional flights · Belt 4' },
    { name: 'Belt 5 — Overflow', type: 'BAGGAGE' as const, x: 620, y: 370, description: 'Overflow · Belt 5' },
    { name: 'KCB Bank & Forex', type: 'SERVICE' as const, x: 110, y: 450, description: 'Banking · Currency exchange · ATM', openHours: '24h' },
    { name: 'Equity Bank ATM', type: 'SERVICE' as const, x: 210, y: 450, description: 'ATM only · 24h access', openHours: '24h' },
    { name: 'Taxi & Car Hire', type: 'SERVICE' as const, x: 380, y: 460, description: 'Licensed taxis · Uber · Bolt · Car rental desks' },
    { name: 'Bus Stop 34', type: 'SERVICE' as const, x: 530, y: 460, description: 'City bus route 34 to Nairobi CBD · Every 30 min' },
    { name: 'Information Desk', type: 'SERVICE' as const, x: 650, y: 450, description: 'KAA customer care · Ground floor' },
    { name: 'Lost & Found', type: 'SERVICE' as const, x: 110, y: 380, description: 'KAA Security · Lost property office' },
  ]

  // ── POIs — L1 Departures ─────────────────────────────────────────────────
  const l1pois = [
    { name: 'Departure Immigration', type: 'IMMIGRATION' as const, x: 380, y: 130, description: 'Passport control · All departing passengers' },
    { name: 'Security Lane A', type: 'SECURITY' as const, x: 190, y: 165, description: 'Priority lanes 1–3 · Business & lounge access' },
    { name: 'Security Lane B', type: 'SECURITY' as const, x: 560, y: 165, description: 'Standard lanes 4–6 · Economy class' },
    { name: 'Gate B10', type: 'GATE' as const, x: 110, y: 75, gateCode: 'B10', description: 'Kenya Airways KQ101 · Mombasa · Boarding 14:30' },
    { name: 'Gate B11', type: 'GATE' as const, x: 210, y: 75, gateCode: 'B11', description: 'Ethiopian Airlines ET318 · Addis Ababa · On time 15:10' },
    { name: 'Gate B12', type: 'GATE' as const, x: 310, y: 75, gateCode: 'B12', description: 'RwandAir WB101 · Kigali · Boarding now' },
    { name: 'Gate B13', type: 'GATE' as const, x: 420, y: 75, gateCode: 'B13', description: 'Qatar Airways QR526 · Doha · Delayed +30min' },
    { name: 'Gate B14', type: 'GATE' as const, x: 530, y: 75, gateCode: 'B14', description: 'Emirates EK722 · Dubai · On time 16:45' },
    { name: 'Gate B15', type: 'GATE' as const, x: 630, y: 75, gateCode: 'B15', description: 'British Airways BA066 · London · On time 17:00' },
    { name: 'Gate B16', type: 'GATE' as const, x: 110, y: 435, gateCode: 'B16', description: 'Kenya Airways KQ202 · Kisumu · On time 15:30' },
    { name: 'Gate B17', type: 'GATE' as const, x: 220, y: 435, gateCode: 'B17', description: 'Jambojet JM211 · Malindi · Boarding 15:00' },
    { name: 'Gate B18', type: 'GATE' as const, x: 350, y: 435, gateCode: 'B18', description: 'South African SA124 · Johannesburg · On time 16:20' },
    { name: 'Gate B19', type: 'GATE' as const, x: 470, y: 435, gateCode: 'B19', description: 'KLM KL566 · Amsterdam · On time 18:00' },
    { name: 'Gate B20', type: 'GATE' as const, x: 570, y: 435, gateCode: 'B20', description: 'Turkish Airlines TK607 · Istanbul · On time 20:30' },
    { name: 'Gate B21', type: 'GATE' as const, x: 660, y: 435, gateCode: 'B21', description: 'Lufthansa LH586 · Frankfurt · On time 21:15' },
    { name: 'Nakumatt Duty Free', type: 'SHOP' as const, x: 175, y: 255, description: 'Duty-free retail · Spirits · Perfume · Electronics', openHours: '05:00–22:00' },
    { name: 'Java House', type: 'DINING' as const, x: 560, y: 255, description: 'Coffee & light meals · Wi-Fi available', openHours: '24h' },
    { name: 'Artcaffe', type: 'DINING' as const, x: 560, y: 345, description: 'Café & bakery · Full menu', openHours: '06:00–21:00' },
    { name: "Hardee's", type: 'DINING' as const, x: 395, y: 255, description: 'American fast food · Full menu', openHours: '24h' },
    { name: 'Amaica Restaurant', type: 'DINING' as const, x: 395, y: 345, description: 'Kenyan cuisine · Local dishes', openHours: '06:00–22:00' },
    { name: 'Pride Lounge', type: 'LOUNGE' as const, x: 170, y: 345, description: 'Kenya Airways Premier World · SkyTeam Sky Priority · Shower, buffet, Wi-Fi' },
    { name: 'Simba Lounge', type: 'LOUNGE' as const, x: 295, y: 345, description: 'SkyTeam business lounge · Quiet zone · Premium bar' },
    { name: 'Restrooms West', type: 'RESTROOM' as const, x: 265, y: 255, description: 'Accessible · Baby change · Prayer direction indicator' },
    { name: 'Restrooms East', type: 'RESTROOM' as const, x: 490, y: 345, description: 'Accessible · Baby change available' },
    { name: 'Prayer Room', type: 'SERVICE' as const, x: 295, y: 255, description: 'Non-denominational quiet space · Wudu facilities' },
    { name: 'Medical Centre', type: 'SERVICE' as const, x: 490, y: 255, description: 'Airport medical · 24h first aid', openHours: '24h' },
  ]

  // ── POIs — L2 Mezzanine ──────────────────────────────────────────────────
  const l2pois = [
    { name: 'Simba Restaurant', type: 'RESTAURANT' as const, x: 390, y: 250, description: 'Full-service restaurant · Panoramic runway views · International & Kenyan cuisine', openHours: '07:00–22:00' },
    { name: 'VIP Suite', type: 'LOUNGE' as const, x: 200, y: 200, description: 'Private VIP suite · Personalised ground handling' },
    { name: 'Conference Room A', type: 'SERVICE' as const, x: 540, y: 200, description: 'Meeting room · 12-person capacity · Available for hire' },
    { name: 'Conference Room B', type: 'SERVICE' as const, x: 540, y: 330, description: 'Meeting room · 8-person capacity · AV equipment' },
    { name: 'Prayer Room', type: 'SERVICE' as const, x: 200, y: 330, description: 'Upper level quiet space' },
    { name: 'Medical Suite', type: 'SERVICE' as const, x: 390, y: 380, description: 'Extended medical care · Consultation rooms', openHours: '08:00–20:00' },
  ]

  // Create all POIs
  await prisma.pOI.deleteMany({ where: { terminalId: { in: [l0.id, l1.id, l2.id] } } })
  for (const p of l0pois) await prisma.pOI.create({ data: { ...p, terminalId: l0.id } })
  for (const p of l1pois) await prisma.pOI.create({ data: { ...p, terminalId: l1.id } })
  for (const p of l2pois) await prisma.pOI.create({ data: { ...p, terminalId: l2.id } })

  // ── Beacons ──────────────────────────────────────────────────────────────
  await prisma.beacon.deleteMany({ where: { airportId: airport.id } })
  const beacons = [
    // L0
    { mac: 'AA:BB:CC:DD:EE:01', label: 'Check-in Zone A', floor: 0, x: 160, y: 130, tid: l0.id },
    { mac: 'AA:BB:CC:DD:EE:02', label: 'Central L0', floor: 0, x: 400, y: 260, tid: l0.id },
    { mac: 'AA:BB:CC:DD:EE:03', label: 'Baggage Hall', floor: 0, x: 600, y: 260, tid: l0.id },
    // L1
    { mac: 'AA:BB:CC:DD:EE:04', label: 'Gates B10–B12', floor: 1, x: 200, y: 190, tid: l1.id },
    { mac: 'AA:BB:CC:DD:EE:05', label: 'Central Spine L1', floor: 1, x: 400, y: 190, tid: l1.id },
    { mac: 'AA:BB:CC:DD:EE:06', label: 'Gates B14–B15', floor: 1, x: 600, y: 190, tid: l1.id },
    { mac: 'AA:BB:CC:DD:EE:07', label: 'Lower Concourse W', floor: 1, x: 200, y: 360, tid: l1.id },
    { mac: 'AA:BB:CC:DD:EE:08', label: 'Lower Concourse C', floor: 1, x: 400, y: 360, tid: l1.id },
    { mac: 'AA:BB:CC:DD:EE:09', label: 'Gates B19–B21', floor: 1, x: 600, y: 360, tid: l1.id },
    // L2
    { mac: 'AA:BB:CC:DD:EE:0A', label: 'Mezzanine Central', floor: 2, x: 390, y: 260, tid: l2.id },
    { mac: 'AA:BB:CC:DD:EE:0B', label: 'VIP Area', floor: 2, x: 200, y: 230, tid: l2.id },
    { mac: 'AA:BB:CC:DD:EE:0C', label: 'Conference Zone', floor: 2, x: 540, y: 230, tid: l2.id },
  ]
  for (const b of beacons) {
    await prisma.beacon.create({ data: { macAddress: b.mac, label: b.label, floor: b.floor, x: b.x, y: b.y, txPower: -59, airportId: airport.id, terminalId: b.tid } })
  }

  console.log(`✅ Seeded: ${airport.name}`)
  console.log(`   3 floors · ${l0pois.length + l1pois.length + l2pois.length} POIs · ${beacons.length} beacons`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
