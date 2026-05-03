// app/api/flights/route.ts — static mock, no DB needed
import { NextRequest, NextResponse } from 'next/server'

const MOCK_FLIGHTS = [
  { flightNumber: 'KQ101', airline: 'Kenya Airways', destination: 'Mombasa', status: 'BOARDING', scheduledDeparture: '14:30', gate: 'B10' },
  { flightNumber: 'ET318', airline: 'Ethiopian Airlines', destination: 'Addis Ababa', status: 'ON_TIME', scheduledDeparture: '15:10', gate: 'B11' },
  { flightNumber: 'WB101', airline: 'RwandAir', destination: 'Kigali', status: 'BOARDING', scheduledDeparture: '14:50', gate: 'B12' },
  { flightNumber: 'QR526', airline: 'Qatar Airways', destination: 'Doha', status: 'DELAYED', scheduledDeparture: '15:30', estimatedDeparture: '16:00', gate: 'B13', delayMinutes: 30 },
  { flightNumber: 'EK722', airline: 'Emirates', destination: 'Dubai', status: 'ON_TIME', scheduledDeparture: '16:45', gate: 'B14' },
  { flightNumber: 'BA066', airline: 'British Airways', destination: 'London Heathrow', status: 'ON_TIME', scheduledDeparture: '17:00', gate: 'B15' },
  { flightNumber: 'KQ202', airline: 'Kenya Airways', destination: 'Kisumu', status: 'ON_TIME', scheduledDeparture: '15:30', gate: 'B16' },
  { flightNumber: 'JM211', airline: 'Jambojet', destination: 'Malindi', status: 'BOARDING', scheduledDeparture: '15:00', gate: 'B17' },
  { flightNumber: 'SA124', airline: 'South African Airways', destination: 'Johannesburg', status: 'ON_TIME', scheduledDeparture: '16:20', gate: 'B18' },
]

export async function GET(req: NextRequest) {
  const gate = new URL(req.url).searchParams.get('gate')
  const flights = gate ? MOCK_FLIGHTS.filter(f => f.gate === gate) : MOCK_FLIGHTS
  return NextResponse.json({ flights, source: 'mock' })
}