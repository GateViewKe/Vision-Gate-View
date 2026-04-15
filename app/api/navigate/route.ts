// app/api/navigate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { astar, estimateWalkTime } from '@/lib/pathfinding'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { from, to } = body as {
      from: { x: number; y: number }
      to: { x: number; y: number }
    }

    if (!from || !to) {
      return NextResponse.json({ error: 'Missing from/to coordinates' }, { status: 400 })
    }

    const path = astar(from, to)

    if (!path) {
      return NextResponse.json({ error: 'No route found' }, { status: 422 })
    }

    const distanceMeters = path.reduce((acc, pt, i) => {
      if (i === 0) return acc
      return acc + Math.hypot(pt.x - path[i - 1].x, pt.y - path[i - 1].y) * 0.05
    }, 0)

    const walkTimeSeconds = estimateWalkTime(path)

    return NextResponse.json({
      path,
      distanceMeters: Math.round(distanceMeters),
      walkTimeSeconds,
    })
  } catch (err) {
    console.error('[/api/navigate]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
