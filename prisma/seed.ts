// prisma/seed.ts
import { PrismaClient, POIType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding GateView database...')

  const airport = await prisma.airport.upsert({
    where: { code: 'JKIA' },
    update: {
      name: 'Jomo Kenyatta International Airport',
      city: 'Nairobi',
      country: 'Kenya',
    },
    create: {
      code: 'JKIA',
      name: 'Jomo Kenyatta International Airport',
      city: 'Nairobi',
      country: 'Kenya',
    },
  })

  const terminal = await prisma.terminal.upsert({
    where: { airportId_code: { airportId: airport.id, code: 'T1A' } },
    update: {
      name: 'Terminal 1A',
      floor: 1,
      floorPlan: {
        walls: [{ x: 60, y: 60, w: 680, h: 460 }],
        corridors: [
          { x: 140, y: 160, w: 520, h: 60 },
          { x: 140, y: 360, w: 520, h: 60 },
          { x: 340, y: 160, w: 120, h: 260 },
        ],
      },
    },
    create: {
      airportId: airport.id,
      code: 'T1A',
      name: 'Terminal 1A',
      floor: 1,
      floorPlan: {
        walls: [{ x: 60, y: 60, w: 680, h: 460 }],
        corridors: [
          { x: 140, y: 160, w: 520, h: 60 },
          { x: 140, y: 360, w: 520, h: 60 },
          { x: 340, y: 160, w: 120, h: 260 },
        ],
      },
    },
  })

  // Avoid duplicate POIs when the seed is run multiple times.
  await prisma.pOI.deleteMany({ where: { terminalId: terminal.id } })

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
    { name: 'Nairobi Duty Free', type: POIType.SHOP, x: 170, y: 240, description: 'Duty-free retail · Spirits, perfume, electronics', openHours: '05:00–22:00' },
    { name: 'Java House', type: POIType.DINING, x: 580, y: 240, description: 'Coffee & light meals · Wi-Fi available', openHours: '24h' },
    { name: 'Artcaffe', type: POIType.DINING, x: 580, y: 340, description: 'Café & bakery · Full menu', openHours: '06:00–21:00' },
    { name: 'Pride Lounge', type: POIType.LOUNGE, x: 170, y: 340, description: 'Kenya Airways business lounge · Shower, buffet, Wi-Fi' },
    { name: 'Restrooms', type: POIType.RESTROOM, x: 400, y: 240, description: 'Restrooms & baby change · Accessible facilities available' },
    { name: 'Medical Centre', type: POIType.SERVICE, x: 400, y: 340, description: 'Airport medical · Open 24h · First aid & consultation', openHours: '24h' },
    { name: 'Security Checkpoint', type: POIType.SECURITY, x: 360, y: 160, description: 'Security screening · Prepare boarding pass and ID' },
    { name: 'Check-in Counters', type: POIType.CHECKIN, x: 250, y: 420, description: 'Kenya Airways and partner airline counters' },
  ]

  for (const poi of pois) {
    await prisma.pOI.create({ data: { ...poi, terminalId: terminal.id } })
  }

  const tickets = [
    {
      ticketNumber: 'TK001', passengerName: 'Evans Chemekeki', flightNumber: 'KQ 402', airline: 'Kenya Airways',
      origin: 'NBO', destination: 'LHR', gate: 'B15', floor: 1, seat: '14A', seatClass: 'Business',
      scheduledDeparture: '17:00', boardingTime: '16:25', status: 'ON_TIME', terminalId: terminal.id,
    },
    {
      ticketNumber: 'TK002', passengerName: 'Amina Wanjiku', flightNumber: 'WB 101', airline: 'RwandAir',
      origin: 'NBO', destination: 'KGL', gate: 'B12', floor: 1, seat: '21C', seatClass: 'Economy',
      scheduledDeparture: '15:20', boardingTime: '14:45', status: 'BOARDING', terminalId: terminal.id,
    },
    {
      ticketNumber: 'TK003', passengerName: 'Brian Otieno', flightNumber: 'QR 526', airline: 'Qatar Airways',
      origin: 'NBO', destination: 'DOH', gate: 'B13', floor: 1, seat: '08F', seatClass: 'Business',
      scheduledDeparture: '16:45', boardingTime: '16:05', status: 'DELAYED', delayMinutes: 30, terminalId: terminal.id,
    },
    {
      ticketNumber: 'TK004', passengerName: 'Mary Njeri', flightNumber: 'EK 722', airline: 'Emirates',
      origin: 'NBO', destination: 'DXB', gate: 'B14', floor: 1, seat: '32B', seatClass: 'Economy',
      scheduledDeparture: '16:45', boardingTime: '16:10', status: 'ON_TIME', terminalId: terminal.id,
    },
    {
      ticketNumber: 'TK005', passengerName: 'David Mwangi', flightNumber: 'BA 066', airline: 'British Airways',
      origin: 'NBO', destination: 'LHR', gate: 'B15', floor: 1, seat: '04A', seatClass: 'First',
      scheduledDeparture: '17:00', boardingTime: '16:20', status: 'ON_TIME', terminalId: terminal.id,
    },
    {
      ticketNumber: 'TK006', passengerName: 'Grace Achieng', flightNumber: 'AF 840', airline: 'Air France',
      origin: 'NBO', destination: 'CDG', gate: 'B16', floor: 1, seat: '18D', seatClass: 'Economy',
      scheduledDeparture: '18:30', boardingTime: '17:55', status: 'ON_TIME', terminalId: terminal.id,
    },
    {
      ticketNumber: 'TK007', passengerName: 'Peter Kariuki', flightNumber: 'TK 636', airline: 'Turkish Airlines',
      origin: 'NBO', destination: 'IST', gate: 'B17', floor: 1, seat: '11E', seatClass: 'Economy',
      scheduledDeparture: '21:30', boardingTime: '20:50', status: 'ON_TIME', terminalId: terminal.id,
    },
    {
      ticketNumber: 'TK008', passengerName: 'Fatima Hassan', flightNumber: 'MS 735', airline: 'EgyptAir',
      origin: 'NBO', destination: 'CAI', gate: 'B18', floor: 1, seat: '06C', seatClass: 'Business',
      scheduledDeparture: '20:45', boardingTime: '20:10', status: 'BOARDING', terminalId: terminal.id,
    },
    {
      ticketNumber: 'TK009', passengerName: 'James Kimani', flightNumber: 'KQ 100', airline: 'Kenya Airways',
      origin: 'NBO', destination: 'AMS', gate: 'B10', floor: 1, seat: '22A', seatClass: 'Economy',
      scheduledDeparture: '23:45', boardingTime: '23:05', status: 'ON_TIME', terminalId: terminal.id,
    },
    {
      ticketNumber: 'TK010', passengerName: 'Linda Chebet', flightNumber: 'KQ 202', airline: 'Kenya Airways',
      origin: 'NBO', destination: 'KIS', gate: 'B11', floor: 1, seat: '17B', seatClass: 'Economy',
      scheduledDeparture: '15:30', boardingTime: '14:55', status: 'ON_TIME', terminalId: terminal.id,
    },
  ]

  for (const ticket of tickets) {
    await prisma.ticket.upsert({
      where: { ticketNumber: ticket.ticketNumber },
      update: ticket,
      create: ticket,
    })
  }

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
      update: { ...beacon, airportId: airport.id, terminalId: terminal.id },
      create: { ...beacon, airportId: airport.id, terminalId: terminal.id },
    })
  }

  console.log('✅ Seed complete')
  console.log(`   Airport: ${airport.name} (${airport.code})`)
  console.log(`   Terminal: ${terminal.name} (${terminal.code})`)
  console.log(`   POIs: ${pois.length}`)
  console.log(`   Tickets: ${tickets.length}`)
  console.log(`   Beacons: ${beacons.length}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => prisma.$disconnect())
