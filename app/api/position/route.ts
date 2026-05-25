// app/api/position/route.ts
// Returns simulated position and stores position logs when the database is available.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSimulatedPosition, smoothPosition } from '@/lib/positioning'

const positionCache = new Map<string, ReturnType<typeof getSimulatedPosition>>()

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    const t = Date.now() / 1000
    const raw = getSimulatedPosition(t)
    const prev = positionCache.get(sessionId)
    const position = prev ? smoothPosition(prev, raw) : raw

    positionCache.set(sessionId, position)

    // This is optional logging. It must never break the demo UI.
    try {
      await db.positionLog.create({
        data: {
          sessionId,
          x: position.x,
          y: position.y,
          floor: 1,
          accuracy: position.accuracy ?? 5,
          method: 'simulated',
        },
      })
    } catch (logError) {
      console.warn('[api/position] position log skipped:', logError)
    }

    return NextResponse.json({ ...position, timestamp: Date.now() })
  } catch (err) {
    console.error('[api/position]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
