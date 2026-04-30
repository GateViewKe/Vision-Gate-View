import { NextRequest, NextResponse } from 'next/server'
import { simulateCongestion, getCongestionStats } from '@/lib/congestion'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const floorId = parseInt(searchParams.get('floorId') ?? '1')
  const resolution = Math.min(60, Math.max(10, parseInt(searchParams.get('resolution') ?? '40')))
  const hour = searchParams.get('hour') ? parseInt(searchParams.get('hour')!) : undefined
  if (isNaN(floorId) || floorId < 0 || floorId > 2) return NextResponse.json({ error: 'floorId must be 0–2' }, { status: 400 })
  const snapshot = simulateCongestion(floorId, resolution, hour)
  return NextResponse.json({ ...snapshot, stats: getCongestionStats(snapshot) }, { headers: { 'Cache-Control': 'public, max-age=15, stale-while-revalidate=30' } })
}
