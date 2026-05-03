// app/api/map/route.ts
// Static version — no database required. Swap for the DB version when you add Postgres.

import { NextResponse } from 'next/server'

const FLOOR_PLAN = {
  walls: [{ x: 60, y: 60, w: 680, h: 460 }],
  corridors: [
    { x: 140, y: 160, w: 520, h: 60 },
    { x: 140, y: 360, w: 520, h: 60 },
    { x: 340, y: 160, w: 120, h: 260 },
  ],
}

const POIS = [
  { id: 'b10', name: 'Gate B10', type: 'GATE', x: 130, y: 90,  gateCode: 'B10', description: 'Kenya Airways KQ101 to Mombasa · Boarding 14:30' },
  { id: 'b11', name: 'Gate B11', type: 'GATE', x: 230, y: 90,  gateCode: 'B11', description: 'Ethiopian Airlines ET318 to Addis Ababa · On time 15:10' },
  { id: 'b12', name: 'Gate B12', type: 'GATE', x: 330, y: 90,  gateCode: 'B12', description: 'RwandAir WB101 to Kigali · Boarding now' },
  { id: 'b13', name: 'Gate B13', type: 'GATE', x: 430, y: 90,  gateCode: 'B13', description: 'Qatar Airways QR526 to Doha · Delayed 30min' },
  { id: 'b14', name: 'Gate B14', type: 'GATE', x: 530, y: 90,  gateCode: 'B14', description: 'Emirates EK722 to Dubai · On time 16:45' },
  { id: 'b15', name: 'Gate B15', type: 'GATE', x: 630, y: 90,  gateCode: 'B15', description: 'British Airways BA066 to London · On time 17:00' },
  { id: 'b16', name: 'Gate B16', type: 'GATE', x: 130, y: 480, gateCode: 'B16', description: 'Kenya Airways KQ202 to Kisumu · On time 15:30' },
  { id: 'b17', name: 'Gate B17', type: 'GATE', x: 280, y: 480, gateCode: 'B17', description: 'Jambojet JM211 to Malindi · Boarding 15:00' },
  { id: 'b18', name: 'Gate B18', type: 'GATE', x: 430, y: 480, gateCode: 'B18', description: 'South African Airways SA124 to JHB · On time 16:20' },
  { id: 'shop1',  name: 'Nakumatt Duty Free', type: 'SHOP',     x: 170, y: 240, description: 'Duty-free retail · Spirits, perfume, electronics', openHours: '05:00–22:00' },
  { id: 'cafe1',  name: 'Java House',         type: 'DINING',   x: 580, y: 240, description: 'Coffee & light meals · Wi-Fi available', openHours: '24h' },
  { id: 'cafe2',  name: 'Artcaffe',           type: 'DINING',   x: 580, y: 340, description: 'Café & bakery · Full menu', openHours: '06:00–21:00' },
  { id: 'lounge', name: 'Pride Lounge',       type: 'LOUNGE',   x: 170, y: 340, description: 'Kenya Airways business lounge · Shower, buffet, Wi-Fi' },
  { id: 'wc1',    name: 'Restrooms',          type: 'RESTROOM', x: 400, y: 240, description: 'Restrooms & baby change · Accessible facilities available' },
  { id: 'med1',   name: 'Medical Centre',     type: 'SERVICE',  x: 400, y: 340, description: 'Airport medical · Open 24h · First aid & consultation', openHours: '24h' },
  { id: 'fx1',    name: 'Currency Exchange',  type: 'SERVICE',  x: 620, y: 480, description: 'KCB Forex · KES, USD, EUR, GBP, AED', openHours: '06:00–22:00' },
]

export async function GET() {
  return NextResponse.json({
    terminal: {
      id: 'terminal-1a',
      name: 'Terminal 1A',
      floor: 0,
      floorPlan: FLOOR_PLAN,
      airport: { code: 'JKIA', name: 'Jomo Kenyatta International Airport', city: 'Nairobi' },
    },
    pois: POIS,
  })
}