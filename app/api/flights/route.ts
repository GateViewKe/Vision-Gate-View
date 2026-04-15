// app/api/flights/route.ts
// Flight data endpoint. In production, integrate AviationStack or FlightAware.
// Set AVIATIONSTACK_API_KEY in .env to enable live data.

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

async function fetchLiveFlights(airport: string) {
  const apiKey = process.env.AVIATIONSTACK_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&dep_iata=${airport}&flight_status=active`,
      { next: { revalidate: 60 } }  // cache for 60s
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.data?.map((f: any) => ({
      flightNumber: f.flight.iata,
      airline: f.airline.name,
      destination: f.arrival.airport,
      status: f.flight_status.toUpperCase(),
      scheduledDeparture: f.departure.scheduled,
      estimatedDeparture: f.departure.estimated,
      gate: f.departure.gate,
      delayMinutes: f.departure.delay,
    }))
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const airport = searchParams.get('airport') ?? 'NBO'
  const gate = searchParams.get('gate')

  const liveFlights = await fetchLiveFlights(airport)
  let flights = liveFlights ?? MOCK_FLIGHTS

  if (gate) {
    flights = flights.filter((f: any) => f.gate === gate)
  }

  return NextResponse.json({ flights, source: liveFlights ? 'live' : 'mock' })
}
