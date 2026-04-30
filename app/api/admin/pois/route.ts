import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const terminalId = searchParams.get('terminalId') ?? undefined
  const type = searchParams.get('type') ?? undefined
  const pois = await db.pOI.findMany({ where: { ...(terminalId ? { terminalId } : {}), ...(type ? { type: type as any } : {}) }, include: { terminal: { select: { name: true, floor: true } } }, orderBy: [{ type: 'asc' }, { name: 'asc' }] })
  return NextResponse.json({ pois, total: pois.length })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.name || !body.type || !body.terminalId) return NextResponse.json({ error: 'name, type, terminalId required' }, { status: 400 })
  const poi = await db.pOI.create({ data: { name: body.name.trim(), type: body.type, terminalId: body.terminalId, x: Number(body.x ?? 0), y: Number(body.y ?? 0), description: body.description, gateCode: body.gateCode, openHours: body.openHours } })
  await db.auditLog.create({ data: { action: 'CREATE', entity: 'POI', entityId: poi.id } })
  return NextResponse.json({ poi }, { status: 201 })
}
