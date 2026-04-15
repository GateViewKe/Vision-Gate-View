// lib/positioning.ts
// Wi-Fi triangulation using weighted centroid from RSSI readings.
// Production: replace getRSSI() stubs with real AP scan data.

export interface BeaconReading {
  macAddress: string
  rssi: number          // dBm, e.g. -65
}

export interface BeaconAnchor {
  macAddress: string
  x: number
  y: number
  txPower: number       // RSSI at 1m
}

export interface PositionEstimate {
  x: number
  y: number
  accuracy: number      // metres (estimated error radius)
  method: 'wifi' | 'ble' | 'simulated'
}

// Log-distance path loss model: d = 10^((TxPower - RSSI) / (10 * n))
// n = 2.0 is free-space; use 2.5–3.5 indoors depending on environment
const PATH_LOSS_EXPONENT = 2.7

function rssiToDistance(rssi: number, txPower: number): number {
  return Math.pow(10, (txPower - rssi) / (10 * PATH_LOSS_EXPONENT))
}

export function trilaterate(
  readings: BeaconReading[],
  anchors: BeaconAnchor[]
): PositionEstimate | null {
  // Match readings to known anchors
  const matched = readings
    .map((r) => {
      const anchor = anchors.find((a) => a.macAddress === r.macAddress)
      if (!anchor) return null
      const distance = rssiToDistance(r.rssi, anchor.txPower)
      // Weight = 1/d² — closer APs contribute more
      const weight = 1 / Math.max(distance * distance, 0.01)
      return { anchor, distance, weight }
    })
    .filter(Boolean) as { anchor: BeaconAnchor; distance: number; weight: number }[]

  if (matched.length < 2) return null

  // Weighted centroid
  const totalWeight = matched.reduce((s, m) => s + m.weight, 0)
  const x = matched.reduce((s, m) => s + m.anchor.x * m.weight, 0) / totalWeight
  const y = matched.reduce((s, m) => s + m.anchor.y * m.weight, 0) / totalWeight

  // Accuracy estimate: mean weighted distance error
  const avgDist = matched.reduce((s, m) => s + m.distance * m.weight, 0) / totalWeight
  const accuracy = Math.max(avgDist * 0.3, 1.5)  // min 1.5m accuracy

  return { x, y, accuracy, method: 'wifi' }
}

// Simulated position for demo/testing — moves in a slow Lissajous pattern
export function getSimulatedPosition(t: number): PositionEstimate {
  const cx = 400, cy = 290, rx = 180, ry = 110
  return {
    x: cx + rx * Math.sin(t * 0.4),
    y: cy + ry * Math.sin(t * 0.7 + 1),
    accuracy: 3 + Math.sin(t) * 1.5,
    method: 'simulated',
  }
}

// Kalman-like smoothing: blend new estimate with previous
export function smoothPosition(
  prev: PositionEstimate,
  next: PositionEstimate,
  alpha = 0.3
): PositionEstimate {
  return {
    x: prev.x + alpha * (next.x - prev.x),
    y: prev.y + alpha * (next.y - prev.y),
    accuracy: prev.accuracy + alpha * (next.accuracy - prev.accuracy),
    method: next.method,
  }
}
