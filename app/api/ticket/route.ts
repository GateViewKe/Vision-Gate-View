// app/api/ticket/route.ts
// Database-backed ticket lookup.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { FlightStatus, TicketInfo } from '@/lib/types'

function normalizeTicketNumber(value: string) {
  // Common typo fix: users type letter O instead of zero, e.g. TKOO1 -> TK001.
  return value.trim().toUpperCase().replace(/O/g, '0')
}

function toTicketInfo(ticket: any): TicketInfo {
  return {
    ticketNumber: ticket.ticketNumber,
    passengerName: ticket.passengerName,
    flightNumber: ticket.flightNumber,
    airline: ticket.airline,
    airlineLogo: ticket.airlineLogo ?? undefined,
    origin: ticket.origin,
    destination: ticket.destination,
    gate: ticket.gate,
    floor: ticket.floor,
    seat: ticket.seat,
    seatClass: ticket.seatClass,
    scheduledDeparture: ticket.scheduledDeparture,
    boardingTime: ticket.boardingTime,
    status: ticket.status as FlightStatus,
    delayMinutes: ticket.delayMinutes ?? undefined,
    // The UI expects a readable terminal code, not the internal database cuid.
    terminalId: ticket.terminal?.code ?? 'T1A',
  }
}

export async function GET(req: NextRequest) {
  try {
    const rawNumber = req.nextUrl.searchParams.get('number') ?? ''
    const ticketNumber = normalizeTicketNumber(rawNumber)

    if (!ticketNumber) {
      return NextResponse.json({ error: 'Ticket number required' }, { status: 400 })
    }

    const ticket = await db.ticket.findUnique({
      where: { ticketNumber },
      include: { terminal: true },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found. Try TK001, TK002, or TK003.' },
        { status: 404 }
      )
    }

    return NextResponse.json(toTicketInfo(ticket))
  } catch (error) {
    console.error('[api/ticket] lookup failed:', error)
    return NextResponse.json({ error: 'Ticket lookup failed' }, { status: 500 })
  }
}
