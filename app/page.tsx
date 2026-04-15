'use client'
// app/page.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { useMapStore } from '@/lib/store'
import AirportMap from '@/components/AirportMap'
import Sidebar from '@/components/Sidebar'
import FlightBadge from '@/components/FlightBadge'
import type { FloorPlan, POI } from '@/lib/types'

const EMPTY_FLOOR_PLAN: FloorPlan = { walls: [], corridors: [] }

// Session ID for position tracking
const SESSION_ID = typeof crypto !== 'undefined'
  ? crypto.randomUUID()
  : Math.random().toString(36).slice(2)

export default function Home() {
  const { setPOIs, selectedPOI, setSelectedPOI, setRoute, setPosition, position } = useMapStore()
  const [floorPlan, setFloorPlan] = useState<FloorPlan>(EMPTY_FLOOR_PLAN)
  const [loading, setLoading] = useState(true)
  const [playerX, setPlayerX] = useState(160)
  const [playerY, setPlayerY] = useState(300)
  const [animating, setAnimating] = useState(false)
  const [routePath, setRoutePath] = useState<{ x: number; y: number }[] | null>(null)
  const animRef = useRef<number>(0)
  const animTRef = useRef(0)
  const positionIntervalRef = useRef<NodeJS.Timeout>()

  // Load map data
  useEffect(() => {
    fetch('/api/map?terminalId=terminal-1a')
      .then(r => r.json())
      .then(data => {
        setPOIs(data.pois)
        setFloorPlan(data.terminal.floorPlan as FloorPlan)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [setPOIs])

  // Poll simulated position every 2s
  useEffect(() => {
    const poll = () => {
      fetch('/api/position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: SESSION_ID, simulate: true }),
      })
        .then(r => r.json())
        .then(pos => {
          setPosition(pos)
          if (!animating) {
            setPlayerX(pos.x)
            setPlayerY(pos.y)
          }
        })
        .catch(() => {})
    }
    poll()
    positionIntervalRef.current = setInterval(poll, 2000)
    return () => clearInterval(positionIntervalRef.current)
  }, [animating, setPosition])

  // Animate player along route
  useEffect(() => {
    if (!animating || !routePath || routePath.length < 2) return
    animTRef.current = 0

    const step = () => {
      animTRef.current += 0.014
      const t = animTRef.current
      const total = routePath.length - 1
      const idx = Math.floor(t * total)
      const frac = (t * total) % 1

      if (idx >= total) {
        setPlayerX(routePath[total].x)
        setPlayerY(routePath[total].y)
        setAnimating(false)
        return
      }
      const a = routePath[idx], b = routePath[idx + 1]
      setPlayerX(a.x + (b.x - a.x) * frac)
      setPlayerY(a.y + (b.y - a.y) * frac)
      animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animRef.current)
  }, [animating, routePath])

  const handleSelectPOI = useCallback((poi: POI) => {
    setSelectedPOI(poi)
    setRoute(null)
    setRoutePath(null)
  }, [setSelectedPOI, setRoute])

  const handleNavigate = useCallback(async () => {
    if (!selectedPOI) return
    try {
      const res = await fetch('/api/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: { x: playerX, y: playerY },
          to: { x: selectedPOI.x, y: selectedPOI.y },
        }),
      })
      const data = await res.json()
      if (data.path) {
        setRoute(data)
        setRoutePath(data.path)
        setAnimating(true)
      }
    } catch (err) {
      console.error('Navigation error', err)
    }
  }, [selectedPOI, playerX, playerY, setRoute])

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f5f4' }}>
      {/* Top bar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 52, background: '#fff',
        borderBottom: '0.5px solid #e5e7eb', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: '#185FA5', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 600,
          }}>G</div>
          <span style={{ fontSize: 15, fontWeight: 500 }}>GateView</span>
          <span style={{
            fontSize: 11, color: '#185FA5', background: '#E6F1FB',
            padding: '2px 8px', borderRadius: 4,
          }}>JKIA Terminal 1A</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#6b7280' }}>
          {position && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#3B6D11', display: 'inline-block',
              }} />
              Position active · ±{Math.round(position.accuracy)}m
            </span>
          )}
          <span>Floor 0 · Departures</span>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar onNavigate={handleNavigate} />

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {loading ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: '#9ca3af', fontSize: 14,
            }}>
              Loading terminal map…
            </div>
          ) : (
            <AirportMap
              floorPlan={floorPlan}
              playerX={playerX}
              playerY={playerY}
              onSelectPOI={handleSelectPOI}
            />
          )}

          {/* Zoom controls */}
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: '+', action: () => useMapStore.getState().setScale(Math.min(3, useMapStore.getState().scale * 1.2)) },
              { label: '−', action: () => useMapStore.getState().setScale(Math.max(0.4, useMapStore.getState().scale * 0.8)) },
              { label: '↺', action: () => { useMapStore.getState().setScale(1); useMapStore.getState().setOffset(0, 0) } },
            ].map(btn => (
              <button key={btn.label} onClick={btn.action} style={{ width: 32, height: 32, fontSize: 16, padding: 0 }}>
                {btn.label}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            background: '#fff', border: '0.5px solid #e5e7eb',
            borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#6b7280',
          }}>
            {[
              { color: '#185FA5', label: 'Gates' },
              { color: '#3B6D11', label: 'Shops & Dining' },
              { color: '#854F0B', label: 'Services' },
              { color: '#993556', label: 'Lounges' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                {label}
              </div>
            ))}
          </div>

          {/* Selected POI flight info overlay */}
          {selectedPOI?.type === 'GATE' && selectedPOI.description && (
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: '#fff', border: '0.5px solid #e5e7eb',
              borderRadius: 8, padding: '10px 14px', maxWidth: 260,
              fontSize: 12,
            }}>
              <div style={{ fontWeight: 500, marginBottom: 6, color: '#1a1a1a' }}>
                {selectedPOI.gateCode} · {selectedPOI.name}
              </div>
              {selectedPOI.description.split('·').map((part, i) => (
                <div key={i} style={{ color: '#6b7280', marginBottom: 2 }}>{part.trim()}</div>
              ))}
              <div style={{ marginTop: 8 }}>
                <FlightBadge
                  status={
                    selectedPOI.description.toLowerCase().includes('boarding') ? 'BOARDING'
                    : selectedPOI.description.toLowerCase().includes('delayed') ? 'DELAYED'
                    : 'ON_TIME'
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
