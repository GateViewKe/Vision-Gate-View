import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const terminals = await db.terminal.findMany({ include: { airport: { select: { code: true, name: true } }, _count: { select: { pois: true, beacons: true } } }, orderBy: { floor: 'asc' } })
  return NextResponse.json({ terminals })
}
export async function POST(req: NextRequest) {
  const { airportId, name, floor, floorPlan } = await req.json()
  if (!airportId || !name) return NextResponse.json({ error: 'airportId and name required' }, { status: 400 })
  const terminal = await db.terminal.create({ data: { airportId, name, floor: floor ?? 0, floorPlan: floorPlan ?? { walls: [], corridors: [], escalators: [] } } })
  return NextResponse.json({ terminal }, { status: 201 })
}
