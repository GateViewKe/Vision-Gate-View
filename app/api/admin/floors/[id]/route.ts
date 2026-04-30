import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const terminal = await db.terminal.findUnique({ where: { id: params.id }, include: { pois: true, beacons: true } })
  if (!terminal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ terminal })
}
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const terminal = await db.terminal.update({ where: { id: params.id }, data: { ...(body.name && { name: body.name }), ...(body.floor !== undefined && { floor: Number(body.floor) }), ...(body.floorPlan && { floorPlan: body.floorPlan }) } }).catch(() => null)
  if (!terminal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ terminal })
}
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.pOI.deleteMany({ where: { terminalId: params.id } })
  await db.beacon.deleteMany({ where: { terminalId: params.id } })
  await db.terminal.delete({ where: { id: params.id } }).catch(() => null)
  return NextResponse.json({ deleted: true })
}
