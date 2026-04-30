export interface BeaconReading { macAddress: string; rssi: number }
export interface BeaconAnchor { macAddress: string; x: number; y: number; txPower: number }
export interface PositionEstimate { x: number; y: number; accuracy: number; method: string }

const PATH_LOSS_EXPONENT = 2.7

const rssiToDistance = (rssi: number, txPower: number) =>
  Math.pow(10, (txPower - rssi) / (10 * PATH_LOSS_EXPONENT))

export function trilaterate(readings: BeaconReading[], anchors: BeaconAnchor[]): PositionEstimate | null {
  const matched = readings
    .map(r => { const a = anchors.find(x => x.macAddress === r.macAddress); if (!a) return null; const d = rssiToDistance(r.rssi, a.txPower); return { anchor: a, distance: d, weight: 1 / Math.max(d * d, 0.01) } })
    .filter(Boolean) as { anchor: BeaconAnchor; distance: number; weight: number }[]
  if (matched.length < 2) return null
  const totalWeight = matched.reduce((s, m) => s + m.weight, 0)
  const x = matched.reduce((s, m) => s + m.anchor.x * m.weight, 0) / totalWeight
  const y = matched.reduce((s, m) => s + m.anchor.y * m.weight, 0) / totalWeight
  const accuracy = Math.max(matched.reduce((s, m) => s + m.distance * m.weight, 0) / totalWeight * 0.3, 1.5)
  return { x, y, accuracy, method: 'wifi' }
}

export function getSimulatedPosition(t: number): PositionEstimate {
  return { x: 400 + 180 * Math.sin(t * 0.4), y: 290 + 110 * Math.sin(t * 0.7 + 1), accuracy: 3 + Math.sin(t) * 1.5, method: 'simulated' }
}

export function smoothPosition(prev: PositionEstimate, next: PositionEstimate, alpha = 0.3): PositionEstimate {
  return { x: prev.x + alpha * (next.x - prev.x), y: prev.y + alpha * (next.y - prev.y), accuracy: prev.accuracy + alpha * (next.accuracy - prev.accuracy), method: next.method }
}
