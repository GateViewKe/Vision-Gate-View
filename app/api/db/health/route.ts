// app/api/db/health/route.ts
// Quick database health check for Railway/Vercel deployments.

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [airports, terminals, pois, flights, tickets] = await Promise.all([
      db.airport.count(),
      db.terminal.count(),
      db.pOI.count(),
      db.flight.count(),
      db.ticket.count(),
    ])

    return NextResponse.json({
      ok: true,
      source: 'database',
      counts: { airports, terminals, pois, flights, tickets },
    })
  } catch (error) {
    console.error('[/api/db/health]', error)
    return NextResponse.json({
      ok: false,
      source: 'database',
      error: 'Database not reachable. Check DATABASE_URL and run Prisma migration/seed.',
    }, { status: 500 })
  }
}
