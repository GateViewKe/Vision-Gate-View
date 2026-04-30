import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const beacon = await db.beacon.update({ where: { id: params.id }, data: { ...(body.x !== undefined && { x: Number(body.x) }), ...(body.y !== undefined && { y: Number(body.y) }), ...(body.floor !== undefined && { floor: Number(body.floor) }), ...(body.txPower !== undefined && { txPower: Number(body.txPower) }), ...(body.label !== undefined && { label: body.label }) } }).catch(() => null)
  if (!beacon) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ beacon })
}
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await db.beacon.delete({ where: { id: params.id } }).catch(() => null)
  return NextResponse.json({ deleted: true })
}
