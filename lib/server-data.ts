// lib/server-data.ts
// Server-only fallback/demo data used when PostgreSQL is not connected yet.

import { ALL_POIS, FLOOR_PLANS, FLOOR_META } from './jkia-data'
import type { FlightInfo, TicketInfo } from './types'

export const DEFAULT_AIRPORT = {
  code: 'JKIA',
  iataCode: 'NBO',
  icaoCode: 'HKJK',
  name: 'Jomo Kenyatta International Airport',
  city: 'Nairobi',
  country: 'Kenya',
  timezone: 'Africa/Nairobi',
}

export const DEFAULT_TERMINAL = {
  id: 'terminal-1a',
  code: 'T1A',
  name: 'Terminal 1A',
  description: 'International departures, arrivals, shops, lounges, and gates',
  floorCount: 3,
}

export const DEMO_FLIGHTS: FlightInfo[] = [
  { flightNumber: 'KQ101', airline: 'Kenya Airways', origin: 'Nairobi', destination: 'Mombasa', status: 'BOARDING', scheduledDeparture: '14:30', gate: 'B10' },
  { flightNumber: 'ET318', airline: 'Ethiopian Airlines', origin: 'Nairobi', destination: 'Addis Ababa', status: 'ON_TIME', scheduledDeparture: '15:10', gate: 'B11' },
  { flightNumber: 'WB101', airline: 'RwandAir', origin: 'Nairobi', destination: 'Kigali', status: 'BOARDING', scheduledDeparture: '14:50', gate: 'B12' },
  { flightNumber: 'QR526', airline: 'Qatar Airways', origin: 'Nairobi', destination: 'Doha', status: 'DELAYED', scheduledDeparture: '15:30', estimatedDeparture: '16:00', gate: 'B13', delayMinutes: 30 },
  { flightNumber: 'EK722', airline: 'Emirates', origin: 'Nairobi', destination: 'Dubai', status: 'ON_TIME', scheduledDeparture: '16:45', gate: 'B14' },
  { flightNumber: 'BA066', airline: 'British Airways', origin: 'Nairobi', destination: 'London Heathrow', status: 'ON_TIME', scheduledDeparture: '17:00', gate: 'B15' },
  { flightNumber: 'AF840', airline: 'Air France', origin: 'Nairobi', destination: 'Paris CDG', status: 'ON_TIME', scheduledDeparture: '18:30', gate: 'B16' },
  { flightNumber: 'KL568', airline: 'KLM', origin: 'Nairobi', destination: 'Amsterdam', status: 'ON_TIME', scheduledDeparture: '19:00', gate: 'B17' },
  { flightNumber: 'LH589', airline: 'Lufthansa', origin: 'Nairobi', destination: 'Frankfurt', status: 'ON_TIME', scheduledDeparture: '20:00', gate: 'B18' },
  { flightNumber: 'KQ202', airline: 'Kenya Airways', origin: 'Nairobi', destination: 'Kisumu', status: 'ON_TIME', scheduledDeparture: '15:30', gate: 'B19' },
  { flightNumber: 'JM211', airline: 'Jambojet', origin: 'Nairobi', destination: 'Malindi', status: 'BOARDING', scheduledDeparture: '15:00', gate: 'B20' },
  { flightNumber: 'SA124', airline: 'South African Airways', origin: 'Nairobi', destination: 'Johannesburg', status: 'ON_TIME', scheduledDeparture: '16:20', gate: 'B21' },
  { flightNumber: 'FA201', airline: 'FlySafair', origin: 'Nairobi', destination: 'Cape Town', status: 'ON_TIME', scheduledDeparture: '17:45', gate: 'B22' },
  { flightNumber: 'UR110', airline: 'Uganda Airlines', origin: 'Nairobi', destination: 'Entebbe', status: 'ON_TIME', scheduledDeparture: '14:50', gate: 'B23' },
  { flightNumber: 'TK636', airline: 'Turkish Airlines', origin: 'Nairobi', destination: 'Istanbul', status: 'ON_TIME', scheduledDeparture: '21:30', gate: 'C1' },
  { flightNumber: 'MS735', airline: 'EgyptAir', origin: 'Nairobi', destination: 'Cairo', status: 'BOARDING', scheduledDeparture: '20:45', gate: 'C2' },
  { flightNumber: 'LX296', airline: 'Swiss', origin: 'Nairobi', destination: 'Zürich', status: 'ON_TIME', scheduledDeparture: '22:00', gate: 'C3' },
  { flightNumber: 'SN461', airline: 'Brussels Airlines', origin: 'Nairobi', destination: 'Brussels', status: 'ON_TIME', scheduledDeparture: '22:30', gate: 'C4' },
  { flightNumber: 'QR527', airline: 'Qatar Airways', origin: 'Nairobi', destination: 'Doha', status: 'ON_TIME', scheduledDeparture: '23:00', gate: 'C5' },
  { flightNumber: 'KQ100', airline: 'Kenya Airways', origin: 'Nairobi', destination: 'London Heathrow', status: 'ON_TIME', scheduledDeparture: '23:45', gate: 'C6' },
]

export const DEMO_TICKETS: TicketInfo[] = [
  { ticketNumber: 'TK001', passengerName: 'Amina Mwangi', flightNumber: 'WB101', airline: 'RwandAir', origin: 'Nairobi', destination: 'Kigali', gate: 'B12', floor: 1, seat: '14A', seatClass: 'Economy', scheduledDeparture: '14:50', boardingTime: '14:15', status: 'BOARDING', terminalId: 'terminal-1a' },
  { ticketNumber: 'TK002', passengerName: 'David Otieno', flightNumber: 'BA066', airline: 'British Airways', origin: 'Nairobi', destination: 'London Heathrow', gate: 'B15', floor: 1, seat: '2K', seatClass: 'Business', scheduledDeparture: '17:00', boardingTime: '16:20', status: 'ON_TIME', terminalId: 'terminal-1a' },
  { ticketNumber: 'TK003', passengerName: 'Grace Njeri', flightNumber: 'QR526', airline: 'Qatar Airways', origin: 'Nairobi', destination: 'Doha', gate: 'B13', floor: 1, seat: '21C', seatClass: 'Economy', scheduledDeparture: '15:30', boardingTime: '14:55', status: 'DELAYED', delayMinutes: 30, terminalId: 'terminal-1a' },
  { ticketNumber: 'TK004', passengerName: 'Brian Kimani', flightNumber: 'KQ100', airline: 'Kenya Airways', origin: 'Nairobi', destination: 'London Heathrow', gate: 'C6', floor: 2, seat: '6A', seatClass: 'Business', scheduledDeparture: '23:45', boardingTime: '23:05', status: 'ON_TIME', terminalId: 'terminal-1a' },
  { ticketNumber: 'TK005', passengerName: 'Wanjiku Muthoni', flightNumber: 'EK722', airline: 'Emirates', origin: 'Nairobi', destination: 'Dubai', gate: 'B14', floor: 1, seat: '8F', seatClass: 'Business', scheduledDeparture: '16:45', boardingTime: '16:05', status: 'ON_TIME', terminalId: 'terminal-1a' },
  { ticketNumber: 'TK006', passengerName: 'Peter Kariuki', flightNumber: 'JM211', airline: 'Jambojet', origin: 'Nairobi', destination: 'Malindi', gate: 'B20', floor: 1, seat: '18D', seatClass: 'Economy', scheduledDeparture: '15:00', boardingTime: '14:30', status: 'BOARDING', terminalId: 'terminal-1a' },
  { ticketNumber: 'TK007', passengerName: 'Fatima Hassan', flightNumber: 'TK636', airline: 'Turkish Airlines', origin: 'Nairobi', destination: 'Istanbul', gate: 'C1', floor: 2, seat: '1A', seatClass: 'First', scheduledDeparture: '21:30', boardingTime: '20:50', status: 'ON_TIME', terminalId: 'terminal-1a' },
  { ticketNumber: 'TK008', passengerName: 'Samuel Mutua', flightNumber: 'KQ202', airline: 'Kenya Airways', origin: 'Nairobi', destination: 'Kisumu', gate: 'B19', floor: 1, seat: '12B', seatClass: 'Economy', scheduledDeparture: '15:30', boardingTime: '15:00', status: 'ON_TIME', terminalId: 'terminal-1a' },
  { ticketNumber: 'TK009', passengerName: 'Lilian Wairimu', flightNumber: 'LX296', airline: 'Swiss', origin: 'Nairobi', destination: 'Zürich', gate: 'C3', floor: 2, seat: '4D', seatClass: 'Business', scheduledDeparture: '22:00', boardingTime: '21:20', status: 'ON_TIME', terminalId: 'terminal-1a' },
  { ticketNumber: 'TK010', passengerName: 'Joseph Ochieng', flightNumber: 'UR110', airline: 'Uganda Airlines', origin: 'Nairobi', destination: 'Entebbe', gate: 'B23', floor: 1, seat: '19A', seatClass: 'Economy', scheduledDeparture: '14:50', boardingTime: '14:20', status: 'ON_TIME', terminalId: 'terminal-1a' },
]

export function demoMapPayload(floor?: number) {
  const selectedFloor = typeof floor === 'number' ? floor : 1
  return {
    terminal: {
      ...DEFAULT_TERMINAL,
      floor: selectedFloor,
      floorPlan: FLOOR_PLANS[selectedFloor] ?? FLOOR_PLANS[1],
      airport: DEFAULT_AIRPORT,
      floors: FLOOR_META,
    },
    pois: ALL_POIS.filter(p => typeof floor === 'number' ? p.floor === selectedFloor : true),
  }
}

export function demoTicket(ticketNumber: string) {
  return DEMO_TICKETS.find(t => t.ticketNumber.toUpperCase() === ticketNumber.toUpperCase()) ?? null
}

export function demoFlights(gate?: string | null) {
  return gate ? DEMO_FLIGHTS.filter(f => f.gate === gate) : DEMO_FLIGHTS
}
