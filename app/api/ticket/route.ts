import { NextRequest, NextResponse } from 'next/server'
import { getSimulatedPosition, smoothPosition } from '@/lib/positioning'
 
// In-memory smoothing cache with 5-min TTL to prevent unbounded growth (bug fix)
const cache = new Map<string, { pos: ReturnType<typeof getSimulatedPosition>; ts: number }>()
const TTL = 5 * 60 * 1000
 
function evict() {
  const now = Date.now()
  for (const [k, v] of cache) if (now - v.ts > TTL) cache.delete(k)
}
 
export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    evict()
    const t = Date.now() / 1000
    const raw = getSimulatedPosition(t)
    const entry = cache.get(sessionId)
    const position = entry ? smoothPosition(entry.pos, raw) : raw
    cache.set(sessionId, { pos: position, ts: Date.now() })
    return NextResponse.json({ ...position, timestamp: Date.now() })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}
 