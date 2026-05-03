'use client'
// components/AirportMap.tsx
// 2D canvas renderer for the airport floor plan.
// Upgrade path: swap this canvas for a Three.js scene in AirportMap3D.tsx

import { useEffect, useRef, useCallback } from 'react'
import { useMapStore } from '@/lib/store'
import type { POI, FloorPlan } from '@/lib/types'

const COLORS = {
  floor: '#F1EFE8',
  floorBlue: '#E6F1FB',
  wall: '#B4B2A9',
  corridor: '#FFFFFF',
  GATE: '#185FA5',
  SHOP: '#3B6D11',
  DINING: '#3B6D11',
  LOUNGE: '#993556',
  RESTROOM: '#854F0B',
  SERVICE: '#854F0B',
  SECURITY: '#A32D2D',
  CHECKIN: '#534AB7',
  GATE_BG: '#E6F1FB',
  SHOP_BG: '#EAF3DE',
  DINING_BG: '#EAF3DE',
  LOUNGE_BG: '#FBEAF0',
  RESTROOM_BG: '#FAEEDA',
  SERVICE_BG: '#FAEEDA',
  SECURITY_BG: '#FCEBEB',
  CHECKIN_BG: '#EEEDFE',
  path: '#E24B4A',
  player: '#185FA5',
  text: '#2C2C2A',
  textMuted: '#888780',
}

const W = 800, H = 580

function poiColor(type: string) {
  return (COLORS as any)[type] ?? '#888780'
}
function poiBg(type: string) {
  return (COLORS as any)[`${type}_BG`] ?? '#F1EFE8'
}

interface Props {
  floorPlan: FloorPlan
  playerX: number
  playerY: number
  onSelectPOI: (poi: POI) => void
}

export default function AirportMap({ floorPlan, playerX, playerY, onSelectPOI }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origOX: 0, origOY: 0 })

  const { pois, selectedPOI, route, scale, offsetX, offsetY, setScale, setOffset } = useMapStore()

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()

    const ox = canvas.width / 2 - (W / 2) * scale + offsetX
    const oy = canvas.height / 2 - (H / 2) * scale + offsetY
    ctx.translate(ox, oy)
    ctx.scale(scale, scale)

    // Draw floor
    for (const r of floorPlan.walls) {
      ctx.beginPath()
      ctx.roundRect(r.x, r.y, r.w, r.h, 6)
      ctx.fillStyle = COLORS.floor
      ctx.fill()
      ctx.strokeStyle = COLORS.wall
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
    // Gate rows tinted blue
    ctx.beginPath()
    ctx.roundRect(60, 60, 680, 100, 4)
    ctx.fillStyle = COLORS.floorBlue
    ctx.fill()
    ctx.beginPath()
    ctx.roundRect(60, 420, 680, 100, 4)
    ctx.fillStyle = COLORS.floorBlue
    ctx.fill()

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

    // Route
    if (route?.path && route.path.length > 1) {
      ctx.beginPath()
      ctx.moveTo(route.path[0].x, route.path[0].y)
      for (let i = 1; i < route.path.length; i++) {
        ctx.lineTo(route.path[i].x, route.path[i].y)
      }
      ctx.strokeStyle = COLORS.path
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.setLineDash([7, 5])
      ctx.stroke()
      ctx.setLineDash([])
      const dest = route.path[route.path.length - 1]
      ctx.beginPath()
      ctx.arc(dest.x, dest.y, 6, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.path
      ctx.fill()
    }

    // POIs
    for (const p of pois) {
      const isSelected = selectedPOI?.id === p.id
      const radius = isSelected ? 14 : 11
      ctx.beginPath()
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = isSelected ? poiColor(p.type) : poiBg(p.type)
      ctx.fill()
      ctx.strokeStyle = poiColor(p.type)
      ctx.lineWidth = isSelected ? 2 : 1.5
      ctx.stroke()

      if (scale > 0.6) {
        ctx.fillStyle = isSelected ? '#fff' : poiColor(p.type)
        ctx.font = `${isSelected ? '500 ' : ''}9px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const label = p.type === 'GATE' ? (p.gateCode ?? p.id.slice(0, 3))
          : p.type === 'LOUNGE' ? 'L'
          : p.type === 'RESTROOM' ? 'WC'
          : 'S'
        ctx.fillText(label, p.x, p.y)

        ctx.fillStyle = COLORS.text
        ctx.font = '10px sans-serif'
        ctx.textBaseline = 'top'
        const displayName = p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name
        ctx.fillText(displayName, p.x, p.y + radius + 3)
      }
    }

    // Labels
    ctx.font = '500 13px sans-serif'
    ctx.fillStyle = COLORS.text
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('JKIA Terminal 1A — Departures', 400, 45)
    ctx.font = '11px sans-serif'
    ctx.fillStyle = COLORS.textMuted
    ctx.fillText('Gates B10–B18 · Lower Concourse', 400, 495)

    // Player (blue dot with pulse)
    const pulse = Math.sin(Date.now() / 400) * 3
    ctx.beginPath()
    ctx.arc(playerX, playerY, 14 + pulse, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(24,95,165,0.15)'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(playerX, playerY, 9, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.player
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

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
      canvas.width = r.width
      canvas.height = r.height
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const r = canvas.getBoundingClientRect()
    const cx = e.clientX - r.left
    const cy = e.clientY - r.top
    const ox = canvas.width / 2 - (W / 2) * scale + offsetX
    const oy = canvas.height / 2 - (H / 2) * scale + offsetY
    const wx = (cx - ox) / scale
    const wy = (cy - oy) / scale

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
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setOffset(dragRef.current.origOX + dx, dragRef.current.origOY + dy)
  }
  function onMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    const d = dragRef.current
    if (Math.abs(e.clientX - d.startX) < 4 && Math.abs(e.clientY - d.startY) < 4) {
      handleClick(e)
    }
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
