// prisma/seed.ts
import { PrismaClient, POIType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding GateView database...')

  const airport = await prisma.airport.upsert({
    where: { code: 'JKIA' },
    update: {},
    create: {
      code: 'JKIA',
      name: 'Jomo Kenyatta International Airport',
      city: 'Nairobi',
      country: 'Kenya',
    },
  })

  const terminal = await prisma.terminal.upsert({
    where: { id: 'terminal-1a' },
    update: {},
    create: {
      id: 'terminal-1a',
      airportId: airport.id,
      name: 'Terminal 1A',
      floor: 0,
      floorPlan: {
        walls: [
          { x: 60, y: 60, w: 680, h: 460 },
        ],
        corridors: [
          { x: 140, y: 160, w: 520, h: 60 },
          { x: 140, y: 360, w: 520, h: 60 },
          { x: 340, y: 160, w: 120, h: 260 },
        ],
      },
    },
  })

  const pois = [
    { name: 'Gate B10', type: POIType.GATE, x: 130, y: 90, gateCode: 'B10', description: 'Kenya Airways KQ101 to Mombasa · Boarding 14:30' },
    { name: 'Gate B11', type: POIType.GATE, x: 230, y: 90, gateCode: 'B11', description: 'Ethiopian Airlines ET318 to Addis Ababa · On time 15:10' },
    { name: 'Gate B12', type: POIType.GATE, x: 330, y: 90, gateCode: 'B12', description: 'RwandAir WB101 to Kigali · Boarding now' },
    { name: 'Gate B13', type: POIType.GATE, x: 430, y: 90, gateCode: 'B13', description: 'Qatar Airways QR526 to Doha · Delayed 30min' },
    { name: 'Gate B14', type: POIType.GATE, x: 530, y: 90, gateCode: 'B14', description: 'Emirates EK722 to Dubai · On time 16:45' },
    { name: 'Gate B15', type: POIType.GATE, x: 630, y: 90, gateCode: 'B15', description: 'British Airways BA066 to London · On time 17:00' },
    { name: 'Gate B16', type: POIType.GATE, x: 130, y: 480, gateCode: 'B16', description: 'Kenya Airways KQ202 to Kisumu · On time 15:30' },
    { name: 'Gate B17', type: POIType.GATE, x: 280, y: 480, gateCode: 'B17', description: 'Jambojet JM211 to Malindi · Boarding 15:00' },
    { name: 'Gate B18', type: POIType.GATE, x: 430, y: 480, gateCode: 'B18', description: 'South African Airways SA124 to JHB · On time 16:20' },
    { name: 'Nakumatt Duty Free', type: POIType.SHOP, x: 170, y: 240, description: 'Duty-free retail · Spirits, perfume, electronics', openHours: '05:00–22:00' },
    { name: 'Java House', type: POIType.DINING, x: 580, y: 240, description: 'Coffee & light meals · Wi-Fi available', openHours: '24h' },
    { name: 'Artcaffe', type: POIType.DINING, x: 580, y: 340, description: 'Café & bakery · Full menu', openHours: '06:00–21:00' },
    { name: 'Pride Lounge', type: POIType.LOUNGE, x: 170, y: 340, description: 'Kenya Airways business lounge · Shower, buffet, Wi-Fi' },
    { name: 'Restrooms', type: POIType.RESTROOM, x: 400, y: 240, description: 'Restrooms & baby change · Accessible facilities available' },
    { name: 'Medical Centre', type: POIType.SERVICE, x: 400, y: 340, description: 'Airport medical · Open 24h · First aid & consultation', openHours: '24h' },
    { name: 'Currency Exchange', type: POIType.SERVICE, x: 620, y: 480, description: 'KCB Forex · KES, USD, EUR, GBP, AED', openHours: '06:00–22:00' },
  ]

  for (const poi of pois) {
    await prisma.pOI.create({ data: { ...poi, terminalId: terminal.id } })
  }

  // Seed Wi-Fi beacons (positions correspond to real-world AP locations)
  const beacons = [
    { macAddress: 'AA:BB:CC:DD:EE:01', x: 200, y: 190, txPower: -59 },
    { macAddress: 'AA:BB:CC:DD:EE:02', x: 400, y: 190, txPower: -59 },
    { macAddress: 'AA:BB:CC:DD:EE:03', x: 600, y: 190, txPower: -59 },
    { macAddress: 'AA:BB:CC:DD:EE:04', x: 200, y: 390, txPower: -59 },
    { macAddress: 'AA:BB:CC:DD:EE:05', x: 400, y: 390, txPower: -59 },
    { macAddress: 'AA:BB:CC:DD:EE:06', x: 600, y: 390, txPower: -59 },
    { macAddress: 'AA:BB:CC:DD:EE:07', x: 400, y: 290, txPower: -59 },
  ]

  for (const beacon of beacons) {
    await prisma.beacon.upsert({
      where: { macAddress: beacon.macAddress },
      update: {},
      create: { ...beacon, airportId: airport.id, terminalId: terminal.id },
    })
  }

  console.log('✅ Seed complete')
  console.log(`   Airport: ${airport.name} (${airport.code})`)
  console.log(`   Terminal: ${terminal.name}`)
  console.log(`   POIs: ${pois.length}`)
  console.log(`   Beacons: ${beacons.length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
