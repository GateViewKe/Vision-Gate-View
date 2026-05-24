// lib/jkia-data.ts
// JKIA Terminal 1 — three-floor layout approximation
// Coordinates use the same 800×580 canvas space for all floors.
// Canvas origin (60,60)–(740,520) = 680×460 terminal footprint.

import type { POI, FloorMeta, FloorPlan } from './types'

// ── Floor plans ───────────────────────────────────────────────────────────────

export const FLOOR_PLANS: Record<number, FloorPlan> = {
  // Ground floor: Arrivals, check-in, immigration, baggage
  0: {
    walls: [{ x: 60, y: 60, w: 680, h: 460 }],
    corridors: [
      { x: 140, y: 150, w: 520, h: 80 },   // check-in hall
      { x: 140, y: 340, w: 520, h: 80 },   // baggage / arrivals hall
      { x: 330, y: 150, w: 140, h: 270 },  // central passage
    ],
  },
  // Level 1: Departures, gates B-series, lounges, shops
  1: {
    walls: [{ x: 60, y: 60, w: 680, h: 460 }],
    corridors: [
      { x: 140, y: 155, w: 520, h: 65 },
      { x: 140, y: 360, w: 520, h: 65 },
      { x: 330, y: 155, w: 140, h: 270 },
    ],
  },
  // Level 2: International pier, gates C-series
  2: {
    walls: [{ x: 60, y: 80, w: 680, h: 420 }],
    corridors: [
      { x: 60,  y: 195, w: 680, h: 110 },  // pier concourse
      { x: 330, y: 80,  w: 140, h: 305 },  // bridge connector
    ],
  },
}

export const FLOOR_META: FloorMeta[] = [
  { id: 0, shortLabel: 'G', name: 'Ground Floor',  description: 'Arrivals · Check-in · Baggage Claim' },
  { id: 1, shortLabel: '1', name: 'Level 1',        description: 'Departures · Gates B · Lounges' },
  { id: 2, shortLabel: '2', name: 'Level 2',        description: 'International Pier · Gates C' },
]

// ── POIs — all floors ─────────────────────────────────────────────────────────

export const ALL_POIS: POI[] = [

  // ╔══════════════════════════════════════════════════════╗
  // ║  FLOOR 0 — Ground / Arrivals                         ║
  // ╚══════════════════════════════════════════════════════╝

  // Check-in islands
  { id: 'ci-kq',  name: 'Kenya Airways Check-in',       type: 'CHECKIN',     floor: 0, x: 175, y: 200, description: 'Counters A1–A12 · Priority & standard lanes', openHours: '03:00–23:00' },
  { id: 'ci-intl',name: 'International Check-in',       type: 'CHECKIN',     floor: 0, x: 370, y: 200, description: 'Counters B1–B20 · All other airlines', openHours: '24h' },
  { id: 'ci-dom', name: 'Domestic Check-in',            type: 'CHECKIN',     floor: 0, x: 570, y: 200, description: 'Counters C1–C8 · Domestic routes', openHours: '05:00–22:00' },

  // Immigration
  { id: 'imm-cit',name: 'Immigration — EA Citizens',    type: 'IMMIGRATION', floor: 0, x: 270, y: 350, description: 'Kenyan & East African Community passports · Fast track lanes' },
  { id: 'imm-vis',name: 'Immigration — Visitors',       type: 'IMMIGRATION', floor: 0, x: 450, y: 350, description: 'All other passports · eTA pre-clearance · 6 lanes' },

  // Baggage carousels
  { id: 'bag-1',  name: 'Carousel 1',                   type: 'BAGGAGE',     floor: 0, x: 150, y: 450, description: 'Domestic arrivals · KQ & Jambojet' },
  { id: 'bag-2',  name: 'Carousel 2',                   type: 'BAGGAGE',     floor: 0, x: 260, y: 450, description: 'Regional arrivals · East & Central Africa' },
  { id: 'bag-3',  name: 'Carousel 3',                   type: 'BAGGAGE',     floor: 0, x: 370, y: 450, description: 'Long-haul arrivals · Middle East & Europe' },
  { id: 'bag-4',  name: 'Carousel 4',                   type: 'BAGGAGE',     floor: 0, x: 480, y: 450, description: 'Long-haul arrivals · Asia & Americas' },
  { id: 'bag-5',  name: 'Carousel 5 — Oversized',       type: 'BAGGAGE',     floor: 0, x: 590, y: 450, description: 'Oversized & sports equipment' },

  // Ground services
  { id: 'gf-kcb',    name: 'KCB Bank & ATM',             type: 'ATM',         floor: 0, x: 175, y: 280, description: 'ATM · Currency exchange · KES, USD, EUR', openHours: '24h' },
  { id: 'gf-equity', name: 'Equity Bank ATM',            type: 'ATM',         floor: 0, x: 300, y: 115, description: 'ATM · M-PESA agent · Forex', openHours: '24h' },
  { id: 'gf-avis',   name: 'Avis Car Hire',              type: 'SERVICE',     floor: 0, x: 500, y: 115, description: 'Car rental · Pre-book online for best rates', openHours: '06:00–22:00' },
  { id: 'gf-hertz',  name: 'Hertz Car Hire',             type: 'SERVICE',     floor: 0, x: 600, y: 115, description: 'Car rental · Free shuttle to car park', openHours: '06:00–22:00' },
  { id: 'gf-kenrent',name: 'Kenya Car Hire',             type: 'SERVICE',     floor: 0, x: 400, y: 115, description: 'Local car rental · 4×4 safari vehicles', openHours: '07:00–22:00' },
  { id: 'gf-info',   name: 'Kenya Tourism Board',        type: 'INFORMATION', floor: 0, x: 370, y: 280, description: 'Tourist info · Maps · National park brochures · SIM cards', openHours: '07:00–22:00' },
  { id: 'gf-med',    name: 'Airport Medical',            type: 'SERVICE',     floor: 0, x: 590, y: 280, description: 'First aid · Yellow fever vaccination · Travel health · 24h', openHours: '24h' },
  { id: 'gf-java',   name: 'Java House Arrivals',        type: 'DINING',      floor: 0, x: 690, y: 200, description: 'Coffee & meals · Meet-and-greet zone', openHours: '05:00–23:00' },
  { id: 'gf-wc1',    name: 'Restrooms',                  type: 'RESTROOM',    floor: 0, x: 175, y: 115, description: 'Ground floor · Accessible · Baby change' },
  { id: 'gf-wc2',    name: 'Restrooms',                  type: 'RESTROOM',    floor: 0, x: 690, y: 350, description: 'Arrivals hall · Accessible' },
  { id: 'gf-esc-up', name: 'Escalator → Level 1',       type: 'ESCALATOR',   floor: 0, x: 380, y: 290, description: 'Up to Departures Level 1' },
  { id: 'gf-lift',   name: 'Lift — All Floors',          type: 'ELEVATOR',    floor: 0, x: 430, y: 290, description: 'Accessible lift · G, 1, 2' },

  // ╔══════════════════════════════════════════════════════╗
  // ║  FLOOR 1 — Departures / Gates B                      ║
  // ╚══════════════════════════════════════════════════════╝

  // Gates — upper concourse
  { id: 'b10', name: 'Gate B10', type: 'GATE', floor: 1, x: 120, y: 90,  gateCode: 'B10', description: 'Kenya Airways KQ101 · Mombasa · Boarding 14:30' },
  { id: 'b11', name: 'Gate B11', type: 'GATE', floor: 1, x: 200, y: 90,  gateCode: 'B11', description: 'Ethiopian Airlines ET318 · Addis Ababa · On time 15:10' },
  { id: 'b12', name: 'Gate B12', type: 'GATE', floor: 1, x: 285, y: 90,  gateCode: 'B12', description: 'RwandAir WB101 · Kigali · Boarding now' },
  { id: 'b13', name: 'Gate B13', type: 'GATE', floor: 1, x: 370, y: 90,  gateCode: 'B13', description: 'Qatar Airways QR526 · Doha · Delayed +30 min' },
  { id: 'b14', name: 'Gate B14', type: 'GATE', floor: 1, x: 455, y: 90,  gateCode: 'B14', description: 'Emirates EK722 · Dubai · On time 16:45' },
  { id: 'b15', name: 'Gate B15', type: 'GATE', floor: 1, x: 540, y: 90,  gateCode: 'B15', description: 'British Airways BA066 · London LHR · On time 17:00' },
  { id: 'b16', name: 'Gate B16', type: 'GATE', floor: 1, x: 625, y: 90,  gateCode: 'B16', description: 'Air France AF840 · Paris CDG · On time 18:30' },
  { id: 'b17', name: 'Gate B17', type: 'GATE', floor: 1, x: 710, y: 175, gateCode: 'B17', description: 'KLM KL568 · Amsterdam AMS · On time 19:00' },
  { id: 'b18', name: 'Gate B18', type: 'GATE', floor: 1, x: 710, y: 295, gateCode: 'B18', description: 'Lufthansa LH589 · Frankfurt FRA · On time 20:00' },

  // Gates — lower concourse
  { id: 'b19', name: 'Gate B19', type: 'GATE', floor: 1, x: 120, y: 490, gateCode: 'B19', description: 'Kenya Airways KQ202 · Kisumu · On time 15:30' },
  { id: 'b20', name: 'Gate B20', type: 'GATE', floor: 1, x: 230, y: 490, gateCode: 'B20', description: 'Jambojet JM211 · Malindi · Boarding 15:00' },
  { id: 'b21', name: 'Gate B21', type: 'GATE', floor: 1, x: 350, y: 490, gateCode: 'B21', description: 'South African SA124 · Johannesburg · On time 16:20' },
  { id: 'b22', name: 'Gate B22', type: 'GATE', floor: 1, x: 470, y: 490, gateCode: 'B22', description: 'FlySafair FA201 · Cape Town · On time 17:45' },
  { id: 'b23', name: 'Gate B23', type: 'GATE', floor: 1, x: 590, y: 490, gateCode: 'B23', description: 'Uganda Airlines UR110 · Entebbe · On time 14:50' },

  // Lounges
  { id: 'pride-l', name: 'Kenya Airways Pride Lounge', type: 'LOUNGE', floor: 1, x: 155, y: 260, description: 'Business & First · KQ & SkyTeam · Shower · Buffet · Spa · Wi-Fi', openHours: '05:00–23:00' },
  { id: 'simba-l', name: 'Simba Lounge',               type: 'LOUNGE', floor: 1, x: 155, y: 395, description: 'Pay-per-entry · Premium bar · Shower · Hot meals · Priority Pass', openHours: '24h' },

  // Security
  { id: 'sec-1',   name: 'Security — Lanes 1–6',  type: 'SECURITY',  floor: 1, x: 310, y: 165, description: 'Standard lanes · Laptop & liquids out · Remove shoes' },
  { id: 'sec-2',   name: 'Security — Fast Track',  type: 'SECURITY',  floor: 1, x: 460, y: 165, description: 'Business & First Class · Priority Pass · PreCheck eligible' },

  // Shops — west side
  { id: 'craft-1', name: 'African Craft & Souvenirs', type: 'SHOP',   floor: 1, x: 155, y: 185, description: 'Maasai beadwork · Wood carvings · Kikoy · Batik', openHours: '06:00–22:00' },

  // Shops — central
  { id: 'books-1', name: 'Tusbooks',                  type: 'SHOP',   floor: 1, x: 370, y: 260, description: 'Books · Magazines · Travel accessories · Newspapers', openHours: '05:30–22:00' },
  { id: 'pharmacy',name: 'Pharmacy Plus',              type: 'PHARMACY',floor:1, x: 370, y: 395, description: 'OTC medicines · Prescriptions · Travel health kits', openHours: '24h' },

  // Shops — east side
  { id: 'duty-e1', name: 'Nairobi Duty Free',          type: 'SHOP',   floor: 1, x: 580, y: 260, description: 'Spirits · Perfume · Electronics · Tobacco · Luxury goods', openHours: '05:00–22:00' },
  { id: 'duty-e2', name: 'World of Whiskies',          type: 'SHOP',   floor: 1, x: 675, y: 260, description: 'Premium Scotch · Bourbon · African craft spirits', openHours: '06:00–22:00' },
  { id: 'tech-1',  name: 'Airport Electronics',        type: 'SHOP',   floor: 1, x: 675, y: 395, description: 'Adaptors · Cables · Headphones · Phone accessories', openHours: '06:00–22:00' },

  // Dining — west
  { id: 'amaica',  name: 'Amaica Restaurant',          type: 'DINING', floor: 1, x: 155, y: 310, description: 'Kenyan cuisine · Nyama choma · Pilau · Ugali · Stews', openHours: '24h' },

  // Dining — east
  { id: 'java-dep',name: 'Java House',                 type: 'DINING', floor: 1, x: 580, y: 395, description: 'Coffee & light meals · Freshly baked · Wi-Fi', openHours: '24h' },
  { id: 'artcaffe',name: 'Artcaffe',                   type: 'DINING', floor: 1, x: 675, y: 310, description: 'Café & bakery · Breakfast · Salads · Sandwiches', openHours: '06:00–21:00' },
  { id: 'burger-1',name: 'Burger Hut',                 type: 'DINING', floor: 1, x: 580, y: 185, description: 'Fast food · Burgers · Fries · Soft drinks · Milkshakes', openHours: '06:00–23:00' },

  // Services — central
  { id: 'prayer-1',name: 'Multi-faith Prayer Room',    type: 'PRAYER', floor: 1, x: 370, y: 310, description: 'Muslim · Christian · All faiths · Wudhu facilities · Quiet room', openHours: '24h' },
  { id: 'wc-n1',   name: 'Restrooms (North)',          type: 'RESTROOM',floor: 1, x: 240, y: 240, description: 'Accessible · Baby change · Shower room' },
  { id: 'wc-n2',   name: 'Restrooms (South)',          type: 'RESTROOM',floor: 1, x: 500, y: 415, description: 'Accessible · Baby change' },
  { id: 'med-1',   name: 'Medical Centre',             type: 'SERVICE', floor: 1, x: 240, y: 415, description: 'Airport doctor · First aid · Pharmacy referral · 24h', openHours: '24h' },
  { id: 'forex-1', name: 'KCB Forex',                  type: 'SERVICE', floor: 1, x: 500, y: 240, description: 'Currency exchange · KES USD EUR GBP AED CNY', openHours: '06:00–22:00' },
  { id: 'esc-up1', name: 'Escalator → Level 2',        type: 'ESCALATOR',floor: 1, x: 665, y: 295, description: 'Up to International Pier · Gates C' },
  { id: 'lift-1',  name: 'Lift — All Floors',          type: 'ELEVATOR', floor: 1, x: 710, y: 395, description: 'Accessible · G / 1 / 2' },

  // ╔══════════════════════════════════════════════════════╗
  // ║  FLOOR 2 — International Pier / Gates C              ║
  // ╚══════════════════════════════════════════════════════╝

  // Gates — upper row
  { id: 'c1', name: 'Gate C1', type: 'GATE', floor: 2, x: 115, y: 140, gateCode: 'C1', description: 'Turkish Airlines TK636 · Istanbul IST · On time 21:30' },
  { id: 'c2', name: 'Gate C2', type: 'GATE', floor: 2, x: 230, y: 140, gateCode: 'C2', description: 'EgyptAir MS735 · Cairo CAI · Boarding 20:45' },
  { id: 'c3', name: 'Gate C3', type: 'GATE', floor: 2, x: 345, y: 140, gateCode: 'C3', description: 'Swiss LX296 · Zürich ZRH · On time 22:00' },
  { id: 'c4', name: 'Gate C4', type: 'GATE', floor: 2, x: 460, y: 140, gateCode: 'C4', description: 'Brussels Airlines SN461 · Brussels BRU · On time 22:30' },
  { id: 'c5', name: 'Gate C5', type: 'GATE', floor: 2, x: 575, y: 140, gateCode: 'C5', description: 'Qatar Airways QR527 · Doha DOH · On time 23:00' },
  { id: 'c6', name: 'Gate C6', type: 'GATE', floor: 2, x: 690, y: 140, gateCode: 'C6', description: 'Kenya Airways KQ100 · London LHR · On time 23:45' },

  // Gates — lower row
  { id: 'c7', name: 'Gate C7', type: 'GATE', floor: 2, x: 115, y: 390, gateCode: 'C7', description: 'Ethiopian Airlines ET319 · Addis Ababa · On time 22:15' },
  { id: 'c8', name: 'Gate C8', type: 'GATE', floor: 2, x: 230, y: 390, gateCode: 'C8', description: 'South African SA125 · Cape Town CPT · Boarding 21:30' },
  { id: 'c9', name: 'Gate C9', type: 'GATE', floor: 2, x: 575, y: 390, gateCode: 'C9', description: 'Air Arabia G9 634 · Sharjah SHJ · On time 23:30' },
  { id: 'c10',name: 'Gate C10',type: 'GATE', floor: 2, x: 690, y: 390, gateCode: 'C10',description: 'Kenya Airways KQ776 · Guangzhou CAN · On time 01:00' },

  // Pier lounges
  { id: 'skyline-l',name: 'Skyline Business Lounge',   type: 'LOUNGE', floor: 2, x: 230, y: 270, description: 'Priority Pass · Dragon Pass · International pier · Full bar · Dining · Shower', openHours: '24h' },
  { id: 'vip-suite', name: 'VIP Suite',                type: 'LOUNGE', floor: 2, x: 460, y: 270, description: 'By appointment · Private check-in · Dedicated security · Butler service' },

  // Pier shops & dining
  { id: 'pier-duty',name: 'Pier Duty Free',            type: 'SHOP',   floor: 2, x: 345, y: 270, description: 'Expanded duty-free · Designer brands · Luxury watches · Fragrances', openHours: '24h' },
  { id: 'pier-java',name: 'Java House Pier',           type: 'DINING', floor: 2, x: 575, y: 270, description: 'Coffee · Pastries · Wi-Fi · Open all night', openHours: '24h' },
  { id: 'pier-snack',name: 'Quickbite',                type: 'DINING', floor: 2, x: 690, y: 270, description: 'Snacks · Sandwiches · Drinks to go', openHours: '24h' },

  // Pier services
  { id: 'pier-wc',  name: 'Restrooms',                 type: 'RESTROOM',floor: 2, x: 115, y: 270, description: 'Accessible · Baby change · Shower room' },
  { id: 'pier-pray',name: 'Prayer Room',               type: 'PRAYER', floor: 2, x: 345, y: 390, description: 'Multi-faith · Qibla direction indicated · Wudhu', openHours: '24h' },
  { id: 'pier-esc', name: 'Escalator ← Level 1',      type: 'ESCALATOR',floor: 2, x: 400, y: 440, description: 'Down to Departures Level 1' },
  { id: 'pier-lift',name: 'Lift — All Floors',         type: 'ELEVATOR', floor: 2, x: 460, y: 440, description: 'Accessible · G / 1 / 2' },
]

// Convenience: pois grouped by floor
export function poisForFloor(floor: number): POI[] {
  return ALL_POIS.filter(p => p.floor === floor)
}