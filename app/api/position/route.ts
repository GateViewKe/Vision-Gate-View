// app/api/position/route.ts
// Static version — always returns simulated position. No database required.

import { NextRequest, NextResponse } from 'next/server'
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

    return NextResponse.json({ ...position, timestamp: Date.now() })
  } catch (err) {
    console.error('[position]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}