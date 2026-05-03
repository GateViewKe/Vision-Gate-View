'use client'
// app/page.tsx — mobile-first layout with bottom nav bar and slide-up drawer

import { useEffect, useRef, useState, useCallback } from 'react'
import { useMapStore } from '@/lib/store'
import AirportMap from '@/components/AirportMap'
import Sidebar from '@/components/Sidebar'
import FlightBadge from '@/components/FlightBadge'
import type { FloorPlan, POI } from '@/lib/types'

const EMPTY_FLOOR_PLAN: FloorPlan = { walls: [], corridors: [] }

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const animRef = useRef<number>(0)
  const animTRef = useRef(0)
  const positionIntervalRef = useRef<NodeJS.Timeout>()

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
          if (!animating) { setPlayerX(pos.x); setPlayerY(pos.y) }
        })
        .catch(() => {})
    }
    poll()
    positionIntervalRef.current = setInterval(poll, 2000)
    return () => clearInterval(positionIntervalRef.current)
  }, [animating, setPosition])

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

  const { route } = useMapStore()

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f5f5f4' }}>

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 52,
        background: '#fff', borderBottom: '0.5px solid #e5e7eb', flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: '#185FA5', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700,
          }}>G</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>GateView</div>
            <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.2 }}>JKIA · Terminal 1A</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {position && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B6D11', display: 'inline-block' }} />
              ±{Math.round(position.accuracy)}m
            </span>
          )}
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="menu-btn"
            style={{
              width: 36, height: 36, padding: 0, display: 'none',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 18, border: 'none', background: 'transparent',
            }}
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        <Sidebar
          onNavigate={handleNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Map area */}
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

          {/* Zoom controls — larger touch targets on mobile */}
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: '+', action: () => useMapStore.getState().setScale(Math.min(3, useMapStore.getState().scale * 1.2)) },
              { label: '−', action: () => useMapStore.getState().setScale(Math.max(0.4, useMapStore.getState().scale * 0.8)) },
              { label: '↺', action: () => { useMapStore.getState().setScale(1); useMapStore.getState().setOffset(0, 0) } },
            ].map(btn => (
              <button
                key={btn.label}
                onClick={btn.action}
                style={{
                  width: 40, height: 40, fontSize: 18, padding: 0,
                  background: '#fff', border: '0.5px solid #e5e7eb',
                  borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Legend — hidden on small phones, shown on larger screens */}
          <div className="map-legend" style={{
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

          {/* Gate info overlay */}
          {selectedPOI?.type === 'GATE' && selectedPOI.description && (
            <div className="gate-overlay" style={{
              position: 'absolute', top: 12, left: 12,
              background: '#fff', border: '0.5px solid #e5e7eb',
              borderRadius: 10, padding: '10px 14px', maxWidth: 240,
              fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: '#1a1a1a', fontSize: 13 }}>
                {selectedPOI.gateCode} · {selectedPOI.name}
              </div>
              {selectedPOI.description.split('·').map((part, i) => (
                <div key={i} style={{ color: '#6b7280', marginBottom: 2 }}>{part.trim()}</div>
              ))}
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FlightBadge
                  status={
                    selectedPOI.description.toLowerCase().includes('boarding') ? 'BOARDING'
                    : selectedPOI.description.toLowerCase().includes('delayed') ? 'DELAYED'
                    : 'ON_TIME'
                  }
                />
                <button
                  onClick={handleNavigate}
                  className="primary"
                  style={{ fontSize: 11, padding: '3px 10px' }}
                >
                  Go
                </button>
              </div>
              {route && (
                <div style={{ fontSize: 11, color: '#185FA5', marginTop: 5 }}>
                  {Math.round(route.distanceMeters)}m · ~{Math.round(route.walkTimeSeconds / 60)} min
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile bottom bar ──────────────────────────────────────────────── */}
      <nav className="bottom-bar" style={{
        display: 'none',
        alignItems: 'center',
        background: '#fff',
        borderTop: '0.5px solid #e5e7eb',
        padding: '0 8px',
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(56px + env(safe-area-inset-bottom))',
        gap: 4, flexShrink: 0,
        zIndex: 10,
      }}>
        <BottomBarBtn
          icon="🗺"
          label="Map"
          active={!sidebarOpen && !selectedPOI}
          onClick={() => { setSidebarOpen(false); setSelectedPOI(null) }}
        />
        <BottomBarBtn
          icon="☰"
          label="Places"
          active={sidebarOpen}
          onClick={() => setSidebarOpen(v => !v)}
        />
        {selectedPOI && (
          <BottomBarBtn
            icon="→"
            label={route ? `~${Math.round(route.walkTimeSeconds / 60)}m` : 'Go'}
            active
            accent
            onClick={handleNavigate}
          />
        )}
      </nav>

      <style>{`
        @media (max-width: 639px) {
          .menu-btn { display: flex !important; }
          .bottom-bar { display: flex !important; }
          .map-legend { display: none; }
          .gate-overlay { max-width: calc(100vw - 100px) !important; }
        }
      `}</style>
    </main>
  )
}

function BottomBarBtn({
  icon, label, active, accent, onClick,
}: {
  icon: string
  label: string
  active?: boolean
  accent?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 2, height: 52, border: 'none',
        background: accent ? '#185FA5' : 'transparent',
        borderRadius: accent ? 10 : 0,
        color: accent ? '#fff' : active ? '#185FA5' : '#6b7280',
        fontSize: 11, fontWeight: active ? 600 : 400,
        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
        transition: 'color 0.15s',
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      {label}
    </button>
  )
}