import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trilaterate, getSimulatedPosition, smoothPosition, type BeaconReading } from '@/lib/positioning'

const cache = new Map<string, { x: number; y: number; accuracy: number; method: string }>()

export async function POST(req: NextRequest) {
  try {
    const { sessionId, readings, simulate } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

    let position: { x: number; y: number; accuracy: number; method: string }

    if (simulate || !readings?.length) {
      position = getSimulatedPosition(Date.now() / 1000)
    } else {
      const macs = (readings as BeaconReading[]).map(r => r.macAddress)
      const anchors = await db.beacon.findMany({ where: { macAddress: { in: macs } } })
      const estimate = trilaterate(readings, anchors)
      if (!estimate) return NextResponse.json({ error: 'Insufficient beacon readings' }, { status: 422 })
      position = estimate
    }

    const prev = cache.get(sessionId)
    if (prev) position = smoothPosition({ ...prev, method: prev.method }, { ...position, method: position.method })
    cache.set(sessionId, position)

    db.positionLog.create({ data: { sessionId, x: position.x, y: position.y, floor: 0, accuracy: position.accuracy, method: position.method } }).catch(() => {})

    return NextResponse.json({ ...position, timestamp: Date.now() })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
