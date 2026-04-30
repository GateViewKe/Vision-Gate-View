import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const terminalId = searchParams.get('terminalId') ?? 'jkia-l1'
  try {
    const terminal = await db.terminal.findUnique({
      where: { id: terminalId },
      include: { pois: { orderBy: { type: 'asc' } }, airport: { select: { code: true, name: true, city: true } } },
    })
    if (!terminal) return NextResponse.json({ error: 'Terminal not found' }, { status: 404 })
    return NextResponse.json({ terminal: { id: terminal.id, name: terminal.name, floor: terminal.floor, floorPlan: terminal.floorPlan, airport: terminal.airport }, pois: terminal.pois })
  } catch (e) {
    console.error('[/api/map]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
