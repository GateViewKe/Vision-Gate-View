import { NextRequest, NextResponse } from 'next/server'
import { astar, estimateWalkTime } from '@/lib/pathfinding'

export async function POST(req: NextRequest) {
  try {
    const { from, to } = await req.json()
    if (!from || !to) return NextResponse.json({ error: 'Missing from/to' }, { status: 400 })
    const path = astar(from, to)
    if (!path) return NextResponse.json({ error: 'No route found' }, { status: 422 })
    const distanceMeters = path.reduce((acc, pt, i) => i === 0 ? acc : acc + Math.hypot(pt.x - path[i-1].x, pt.y - path[i-1].y) * 0.05, 0)
    return NextResponse.json({ path, distanceMeters: Math.round(distanceMeters), walkTimeSeconds: estimateWalkTime(path) })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
