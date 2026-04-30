export interface HeatCell { nx: number; nz: number; intensity: number }
export interface CongestionSnapshot { floorId: number; timestamp: number; cells: HeatCell[]; resolution: number }
export interface CongestionStats { avgIntensity: number; maxIntensity: number; hotZones: number; level: 'low' | 'moderate' | 'high' | 'critical' }

const HOTSPOTS: Record<number, Array<{ nx: number; nz: number; radius: number; baseIntensity: number; peakHour: number; spread: number }>> = {
  0: [
    { nx: 0.16, nz: 0.24, radius: 0.13, baseIntensity: 0.90, peakHour: 8, spread: 0.85 },
    { nx: 0.36, nz: 0.24, radius: 0.11, baseIntensity: 0.80, peakHour: 9, spread: 0.80 },
    { nx: 0.50, nz: 0.57, radius: 0.16, baseIntensity: 0.85, peakHour: 11, spread: 0.80 },
    { nx: 0.20, nz: 0.77, radius: 0.10, baseIntensity: 0.75, peakHour: 10, spread: 0.70 },
    { nx: 0.45, nz: 0.93, radius: 0.12, baseIntensity: 0.55, peakHour: 12, spread: 0.60 },
  ],
  1: [
    { nx: 0.14, nz: 0.15, radius: 0.09, baseIntensity: 0.95, peakHour: 14, spread: 0.88 },
    { nx: 0.38, nz: 0.27, radius: 0.12, baseIntensity: 0.85, peakHour: 8, spread: 0.80 },
    { nx: 0.22, nz: 0.32, radius: 0.09, baseIntensity: 0.75, peakHour: 7, spread: 0.72 },
    { nx: 0.62, nz: 0.32, radius: 0.09, baseIntensity: 0.70, peakHour: 7, spread: 0.68 },
    { nx: 0.20, nz: 0.53, radius: 0.10, baseIntensity: 0.60, peakHour: 13, spread: 0.65 },
    { nx: 0.65, nz: 0.53, radius: 0.10, baseIntensity: 0.65, peakHour: 12, spread: 0.68 },
    { nx: 0.27, nz: 0.87, radius: 0.09, baseIntensity: 0.80, peakHour: 15, spread: 0.75 },
  ],
  2: [
    { nx: 0.50, nz: 0.50, radius: 0.22, baseIntensity: 0.55, peakHour: 13, spread: 0.70 },
    { nx: 0.26, nz: 0.38, radius: 0.10, baseIntensity: 0.30, peakHour: 14, spread: 0.55 },
  ],
}

const timeMultiplier = (peakHour: number, currentHour: number) => {
  const diff = Math.min(Math.abs(currentHour - peakHour), 24 - Math.abs(currentHour - peakHour))
  return Math.max(0.15, 1 - diff * 0.12)
}

const gaussian = (dx: number, dz: number, radius: number, spread: number) => {
  const d = Math.sqrt(dx * dx + dz * dz)
  if (d > radius) return 0
  return Math.exp(-(d * d) / (2 * (radius * spread * 0.4) ** 2))
}

export function simulateCongestion(floorId: number, resolution = 40, hourOfDay?: number): CongestionSnapshot {
  const hour = hourOfDay ?? new Date().getHours()
  const hotspots = HOTSPOTS[floorId] ?? []
  const cells: HeatCell[] = []
  for (let gx = 0; gx < resolution; gx++) {
    for (let gz = 0; gz < resolution; gz++) {
      const nx = (gx + 0.5) / resolution, nz = (gz + 0.5) / resolution
      let intensity = 0
      for (const hs of hotspots) {
        const mul = timeMultiplier(hs.peakHour, hour)
        intensity = Math.max(intensity, gaussian(nx - hs.nx, nz - hs.nz, hs.radius, hs.spread) * hs.baseIntensity * mul)
      }
      cells.push({ nx, nz, intensity: Math.min(1, intensity + 0.03 + Math.random() * 0.02) })
    }
  }
  return { floorId, timestamp: Date.now(), cells, resolution }
}

export function congestionColor(intensity: number): [number, number, number] {
  if (intensity < 0.25) { const t = intensity / 0.25; return [0.10 + 0.06 * t, 0.23 + 0.32 * t, 0.43 - 0.14 * t] }
  if (intensity < 0.5) { const t = (intensity - 0.25) / 0.25; return [0.16 + 0.75 * t, 0.55 - 0.03 * t, 0.29 - 0.17 * t] }
  if (intensity < 0.75) { const t = (intensity - 0.5) / 0.25; return [0.91 + 0.09 * t, 0.52 - 0.32 * t, 0.12 - 0.07 * t] }
  return [1.0, 0.10, 0.05]
}

export function getCongestionStats(snapshot: CongestionSnapshot): CongestionStats {
  const intensities = snapshot.cells.map(c => c.intensity)
  const avg = intensities.reduce((a, b) => a + b, 0) / intensities.length
  const max = Math.max(...intensities)
  const hotZones = intensities.filter(i => i > 0.7).length
  const level = avg < 0.25 ? 'low' : avg < 0.45 ? 'moderate' : avg < 0.65 ? 'high' : 'critical'
  return { avgIntensity: avg, maxIntensity: max, hotZones, level }
}
