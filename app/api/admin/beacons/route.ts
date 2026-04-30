import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const terminalId = searchParams.get('terminalId') ?? undefined
  const floor = searchParams.get('floor')
  const beacons = await db.beacon.findMany({ where: { ...(terminalId ? { terminalId } : {}), ...(floor !== null && floor !== '' ? { floor: parseInt(floor!) } : {}) }, orderBy: [{ floor: 'asc' }] })
  return NextResponse.json({ beacons, total: beacons.length })
}
export async function POST(req: NextRequest) {
  const body = await req.json()
  const mac = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(body.macAddress ?? '') ? body.macAddress.toUpperCase() : null
  if (!mac || !body.airportId || !body.terminalId) return NextResponse.json({ error: 'macAddress, airportId, terminalId required' }, { status: 400 })
  const exists = await db.beacon.findUnique({ where: { macAddress: mac } })
  if (exists) return NextResponse.json({ error: 'MAC address already registered' }, { status: 409 })
  const beacon = await db.beacon.create({ data: { macAddress: mac, airportId: body.airportId, terminalId: body.terminalId, x: Number(body.x ?? 200), y: Number(body.y ?? 250), floor: Number(body.floor ?? 0), txPower: Number(body.txPower ?? -59), label: body.label } })
  await db.auditLog.create({ data: { action: 'CREATE', entity: 'Beacon', entityId: beacon.id } })
  return NextResponse.json({ beacon }, { status: 201 })
}
