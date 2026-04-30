import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const poi = await db.pOI.findUnique({ where: { id: params.id } })
  if (!poi) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ poi })
}
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const poi = await db.pOI.update({ where: { id: params.id }, data: { ...(body.name && { name: body.name }), ...(body.type && { type: body.type }), ...(body.x !== undefined && { x: Number(body.x) }), ...(body.y !== undefined && { y: Number(body.y) }), ...(body.description !== undefined && { description: body.description }), ...(body.gateCode !== undefined && { gateCode: body.gateCode }), ...(body.openHours !== undefined && { openHours: body.openHours }) } }).catch(() => null)
  if (!poi) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await db.auditLog.create({ data: { action: 'UPDATE', entity: 'POI', entityId: params.id } })
  return NextResponse.json({ poi })
}
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.pOI.delete({ where: { id: params.id } }).catch(() => null)
  await db.auditLog.create({ data: { action: 'DELETE', entity: 'POI', entityId: params.id } })
  return NextResponse.json({ deleted: true })
}
