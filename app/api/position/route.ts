// app/api/position/route.ts
// Wi-Fi triangulation endpoint.
// POST body: { sessionId: string, readings: [{ macAddress, rssi }] }
// Returns estimated position from beacon RSSI data.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trilaterate, getSimulatedPosition, smoothPosition } from '@/lib/positioning'
import type { BeaconReading } from '@/lib/positioning'

// In-memory position cache for smoothing (per sessionId)
const positionCache = new Map<string, { x: number; y: number; accuracy: number; method: string }>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, readings, simulate } = body as {
      sessionId: string
      readings?: BeaconReading[]
      simulate?: boolean
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    let position: { x: number; y: number; accuracy: number; method: string }

    if (simulate || !readings?.length) {
      // Demo mode: return simulated Lissajous position
      const t = Date.now() / 1000
      const sim = getSimulatedPosition(t)
      position = sim
    } else {
      // Real mode: load beacons from DB and trilaterate
      const macs = readings.map((r) => r.macAddress)
      const anchors = await db.beacon.findMany({
        where: { macAddress: { in: macs } },
      })

      const estimate = trilaterate(readings, anchors)
      if (!estimate) {
        return NextResponse.json({ error: 'Insufficient beacon readings' }, { status: 422 })
      }
      position = estimate
    }

    // Smooth against previous position
    const prev = positionCache.get(sessionId)
    if (prev) {
      const smoothed = smoothPosition(
        { ...prev, method: prev.method as any },
        { ...position, method: position.method as any }
      )
      position = smoothed
    }
    positionCache.set(sessionId, position)

    // Log to DB (fire-and-forget)
    db.positionLog
      .create({
        data: {
          sessionId,
          x: position.x,
          y: position.y,
          floor: 0,
          accuracy: position.accuracy,
          method: position.method,
        },
      })
      .catch(() => {})

    return NextResponse.json({
      ...position,
      timestamp: Date.now(),
    })
  } catch (err) {
    console.error('[/api/position]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
