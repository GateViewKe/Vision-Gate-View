'use client'
// components/AirportMap.tsx
// 2D canvas renderer.  Corner flags appear at every turn of the A* route.

import { useEffect, useRef, useCallback } from 'react'
import { useMapStore } from '@/lib/store'
import type { POI, FloorPlan } from '@/lib/types'

const COLORS = {
  floor:       '#F1EFE8', floorBlue: '#E6F1FB', floorBlue2: '#EDF5FF',
  wall:        '#B4B2A9', corridor:  '#FFFFFF',
  GATE:        '#185FA5', GATE_BG:        '#E6F1FB',
  SHOP:        '#3B6D11', SHOP_BG:        '#EAF3DE',
  DINING:      '#3B6D11', DINING_BG:      '#EAF3DE',
  LOUNGE:      '#993556', LOUNGE_BG:      '#FBEAF0',
  RESTROOM:    '#854F0B', RESTROOM_BG:    '#FAEEDA',
  SERVICE:     '#854F0B', SERVICE_BG:     '#FAEEDA',
  SECURITY:    '#A32D2D', SECURITY_BG:    '#FCEBEB',
  CHECKIN:     '#534AB7', CHECKIN_BG:     '#EEEDFE',
  PHARMACY:    '#854F0B', PHARMACY_BG:    '#FAEEDA',
  PRAYER:      '#534AB7', PRAYER_BG:      '#EEEDFE',
  BAGGAGE:     '#5F5E5A', BAGGAGE_BG:     '#F1EFE8',
  IMMIGRATION: '#A32D2D', IMMIGRATION_BG: '#FCEBEB',
  ESCALATOR:   '#185FA5', ESCALATOR_BG:   '#E6F1FB',
  ELEVATOR:    '#185FA5', ELEVATOR_BG:    '#E6F1FB',
  ATM:         '#3B6D11', ATM_BG:         '#EAF3DE',
  INFORMATION: '#185FA5', INFORMATION_BG: '#E6F1FB',
  path:    '#E24B4A',
  player:  '#185FA5',
  text:    '#2C2C2A',
  textMuted: '#888780',
  // Corner flags
  flagPole:    '#B45309',
  flagActive:  '#F59E0B',
  flagPassed:  '#9CA3AF',
  flagText:    '#FFFFFF',
}

const W = 800, H = 580
// Threshold in canvas units: flag greys out once player is this close
const PASSED_DIST = 32

function poiColor(type: string) { return (COLORS as any)[type]           ?? '#888780' }
function poiBg   (type: string) { return (COLORS as any)[`${type}_BG`]  ?? '#F1EFE8' }

// ── Flag drawing helpers ──────────────────────────────────────────────────────

/** Draw one corner flag. Everything is in canvas-world coords (transform already applied). */
function drawFlag(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  index: number,      // 1-based corner number
  passed: boolean,
  waveOffset: number, // pre-computed sin value for animation
) {
  const POLE_H  = 26   // canvas units tall
  const FLAG_W  = 20   // horizontal extent of triangle
  const FLAG_H  = 15   // vertical extent of triangle
  const WAVE    = passed ? 0 : waveOffset * 3   // tip x-offset

  const poleColor = passed ? COLORS.flagPassed : COLORS.flagPole
  const fillColor = passed ? COLORS.flagPassed : COLORS.flagActive

  ctx.save()
  ctx.globalAlpha = passed ? 0.32 : 1

  // Base circle at corner point
  ctx.beginPath()
  ctx.arc(x, y, 4.5, 0, Math.PI * 2)
  ctx.fillStyle = fillColor
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1
  ctx.stroke()

  // Pole (vertical line upward)
  ctx.beginPath()
  ctx.moveTo(x, y - 4)
  ctx.lineTo(x, y - POLE_H)
  ctx.strokeStyle = poleColor
  ctx.lineWidth = 1.8
  ctx.lineCap = 'round'
  ctx.stroke()

  // Flag body — right-pointing triangle with gentle wave on the tip
  const tipX  = x + FLAG_W + WAVE
  const tipY  = y - POLE_H + FLAG_H / 2
  const topX  = x
  const topY  = y - POLE_H
  const botX  = x
  const botY  = y - POLE_H + FLAG_H

  ctx.beginPath()
  ctx.moveTo(topX,  topY)
  ctx.lineTo(tipX,  tipY)
  ctx.lineTo(botX,  botY)
  ctx.closePath()
  ctx.fillStyle   = fillColor
  ctx.fill()
  ctx.strokeStyle = passed ? COLORS.flagPassed : COLORS.flagPole
  ctx.lineWidth   = 0.8
  ctx.stroke()

  // Corner number inside flag
  if (!passed) {
    ctx.fillStyle    = COLORS.flagText
    ctx.font         = 'bold 8px sans-serif'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    // Roughly centre of the triangle
    ctx.fillText(String(index), x + (FLAG_W + WAVE) * 0.38, tipY)
  }

  ctx.restore()
}

/** Draw a small chevron arrow in the middle of each path segment to show direction. */
function drawSegmentArrow(
  ctx: CanvasRenderingContext2D,
  ax: number, ay: number,
  bx: number, by: number,
) {
  const mx   = (ax + bx) / 2
  const my   = (ay + by) / 2
  const ang  = Math.atan2(by - ay, bx - ax)
  const SIZE = 5

  ctx.save()
  ctx.translate(mx, my)
  ctx.rotate(ang)
  ctx.beginPath()
  ctx.moveTo(-SIZE,  -SIZE * 0.6)
  ctx.lineTo(SIZE,    0)
  ctx.lineTo(-SIZE,   SIZE * 0.6)
  ctx.strokeStyle = 'rgba(226,75,74,0.65)'
  ctx.lineWidth   = 1.5
  ctx.lineJoin    = 'round'
  ctx.lineCap     = 'round'
  ctx.stroke()
  ctx.restore()
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  floorPlan: FloorPlan
  playerX: number
  playerY: number
  onSelectPOI: (poi: POI) => void
}

export default function AirportMap({ floorPlan, playerX, playerY, onSelectPOI }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)
  const animRef   = useRef<number>(0)
  const dragRef   = useRef({ dragging: false, startX: 0, startY: 0, origOX: 0, origOY: 0 })

  const { pois, selectedPOI, route, scale, offsetX, offsetY, setScale, setOffset } = useMapStore()

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()

    const ox = canvas.width  / 2 - (W / 2) * scale + offsetX
    const oy = canvas.height / 2 - (H / 2) * scale + offsetY
    ctx.translate(ox, oy)
    ctx.scale(scale, scale)

    // ── Floor ───────────────────────────────────────────────────────────────
    for (const r of floorPlan.walls) {
      ctx.beginPath()
      ctx.roundRect(r.x, r.y, r.w, r.h, 6)
      ctx.fillStyle = COLORS.floor
      ctx.fill()
      ctx.strokeStyle = COLORS.wall
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Gate row tints (top & bottom)
    for (const [gy, gh] of [[60, 100], [420, 100]] as [number, number][]) {
      ctx.beginPath()
      ctx.roundRect(60, gy, 680, gh, 4)
      ctx.fillStyle = COLORS.floorBlue
      ctx.fill()
    }

    // Corridors
    for (const c of floorPlan.corridors) {
      ctx.beginPath()
      ctx.roundRect(c.x, c.y, c.w, c.h, 4)
      ctx.fillStyle = COLORS.corridor
      ctx.fill()
      ctx.strokeStyle = COLORS.wall
      ctx.lineWidth = 0.5
      ctx.stroke()
    }

    // ── Route path ───────────────────────────────────────────────────────────
    if (route?.path && route.path.length > 1) {
      const path = route.path

      // Dashed path line
      ctx.beginPath()
      ctx.moveTo(path[0].x, path[0].y)
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y)
      ctx.strokeStyle = COLORS.path
      ctx.lineWidth   = 3
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      ctx.setLineDash([7, 5])
      ctx.stroke()
      ctx.setLineDash([])

      // Directional chevrons on each segment
      for (let i = 0; i < path.length - 1; i++) {
        const seg = Math.hypot(path[i+1].x - path[i].x, path[i+1].y - path[i].y)
        if (seg > 20) {  // only on segments long enough to be legible
          drawSegmentArrow(ctx, path[i].x, path[i].y, path[i+1].x, path[i+1].y)
        }
      }

      // Destination pin
      const dest = path[path.length - 1]
      ctx.beginPath()
      ctx.arc(dest.x, dest.y, 7, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.path
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
      // X marker on destination
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.lineCap = 'round'
      for (const [dx, dy] of [[-3,-3],[3,3],[-3,3],[3,-3]] as [number,number][]) {
        if (dx < 0) { ctx.beginPath(); ctx.moveTo(dest.x + dx, dest.y + dy) }
        else        ctx.lineTo(dest.x + dx, dest.y + dy)
      }
      // simpler: two diagonal lines
      ctx.beginPath(); ctx.moveTo(dest.x - 3, dest.y - 3); ctx.lineTo(dest.x + 3, dest.y + 3); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(dest.x + 3, dest.y - 3); ctx.lineTo(dest.x - 3, dest.y + 3); ctx.stroke()

      // ── Corner flags ───────────────────────────────────────────────────────
      // All intermediate path points are genuine turns (smoothPath removes collinear ones)
      if (path.length > 2) {
        const corners   = path.slice(1, -1)
        const now       = Date.now()

        corners.forEach((pt, idx) => {
          const passed     = Math.hypot(playerX - pt.x, playerY - pt.y) < PASSED_DIST
          const waveOffset = Math.sin(now / 550 + idx * 1.3)   // unique phase per flag
          drawFlag(ctx, pt.x, pt.y, idx + 1, passed, waveOffset)
        })
      }
    }

    // ── POI markers ──────────────────────────────────────────────────────────
    for (const p of pois) {
      const sel    = selectedPOI?.id === p.id
      const radius = sel ? 14 : 11

      ctx.beginPath()
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
      ctx.fillStyle   = sel ? poiColor(p.type) : poiBg(p.type)
      ctx.fill()
      ctx.strokeStyle = poiColor(p.type)
      ctx.lineWidth   = sel ? 2 : 1.5
      ctx.stroke()

      if (scale > 0.6) {
        ctx.fillStyle     = sel ? '#fff' : poiColor(p.type)
        ctx.font          = `${sel ? '600 ' : ''}9px sans-serif`
        ctx.textAlign     = 'center'
        ctx.textBaseline  = 'middle'
        const icon =
          p.type === 'GATE'      ? (p.gateCode ?? p.id.slice(0,3))
          : p.type === 'LOUNGE'  ? 'L'
          : p.type === 'RESTROOM'? 'WC'
          : p.type === 'DINING'  ? '☕'
          : p.type === 'SHOP'    ? '🛍'
          : p.type === 'SECURITY'? '🔒'
          : p.type === 'ESCALATOR'? '▲'
          : p.type === 'ELEVATOR' ? '🔲'
          : p.type === 'PRAYER'   ? '✦'
          : p.type === 'PHARMACY' ? '💊'
          : 'i'
        ctx.fillText(icon, p.x, p.y)

        ctx.fillStyle     = COLORS.text
        ctx.font          = '10px sans-serif'
        ctx.textBaseline  = 'top'
        const label = p.name.length > 14 ? p.name.slice(0,13) + '…' : p.name
        ctx.fillText(label, p.x, p.y + radius + 3)
      }
    }

    // ── Terminal labels ───────────────────────────────────────────────────────
    ctx.font          = '500 13px sans-serif'
    ctx.fillStyle     = COLORS.text
    ctx.textAlign     = 'center'
    ctx.textBaseline  = 'middle'
    ctx.fillText('JKIA Terminal 1A — Departures', 400, 45)
    ctx.font      = '11px sans-serif'
    ctx.fillStyle = COLORS.textMuted
    ctx.fillText('Gates B10–B23 · Levels G / 1 / 2', 400, 545)

    // ── Player ────────────────────────────────────────────────────────────────
    const pulse = Math.sin(Date.now() / 380) * 3
    ctx.beginPath()
    ctx.arc(playerX, playerY, 14 + pulse, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(24,95,165,0.15)'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(playerX, playerY, 9, 0, Math.PI * 2)
    ctx.fillStyle   = COLORS.player
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth   = 2
    ctx.stroke()
    // "You are here" label
    if (scale > 0.7) {
      ctx.fillStyle     = COLORS.player
      ctx.font          = 'bold 9px sans-serif'
      ctx.textAlign     = 'center'
      ctx.textBaseline  = 'bottom'
      ctx.fillText('YOU', playerX, playerY - 12)
    }

    ctx.restore()
    animRef.current = requestAnimationFrame(draw)
  }, [floorPlan, pois, selectedPOI, route, scale, offsetX, offsetY, playerX, playerY])

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  // Resize canvas to container
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const r = el.getBoundingClientRect()
      canvas.width  = r.width
      canvas.height = r.height
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const r  = canvas.getBoundingClientRect()
    const ox = canvas.width  / 2 - (W / 2) * scale + offsetX
    const oy = canvas.height / 2 - (H / 2) * scale + offsetY
    const wx = (e.clientX - r.left  - ox) / scale
    const wy = (e.clientY - r.top   - oy) / scale
    let best: POI | null = null, bestD = Infinity
    for (const p of pois) {
      const d = Math.hypot(p.x - wx, p.y - wy)
      if (d < 22 && d < bestD) { bestD = d; best = p }
    }
    if (best) onSelectPOI(best)
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, origOX: offsetX, origOY: offsetY }
  }
  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragRef.current.dragging) return
    setOffset(dragRef.current.origOX + e.clientX - dragRef.current.startX,
              dragRef.current.origOY + e.clientY - dragRef.current.startY)
  }
  function onMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    const d = dragRef.current
    if (Math.abs(e.clientX - d.startX) < 4 && Math.abs(e.clientY - d.startY) < 4) handleClick(e)
    dragRef.current.dragging = false
  }
  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault()
    setScale(Math.max(0.4, Math.min(3, scale * (e.deltaY < 0 ? 1.1 : 0.9))))
  }

  return (
    <div ref={wrapRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'grab' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
      />
    </div>
  )
}