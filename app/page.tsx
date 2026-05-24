'use client'
// app/page.tsx

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useMapStore } from '@/lib/store'
import AirportMap from '@/components/AirportMap'
import Sidebar from '@/components/Sidebar'
import FlightBadge from '@/components/FlightBadge'
import TicketLogin from '@/components/TicketLogin'
import { FLOOR_PLANS } from '@/lib/jkia-data'
import type { POI, TicketInfo } from '@/lib/types'

// Three.js must be client-only — no SSR
const AirportMap3D = dynamic(() => import('@/components/AirportMap3D'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: 13 }}>
      Loading 3D view…
    </div>
  ),
})

const SESSION_ID =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

export default function Home() {
  const {
    selectedPOI, setSelectedPOI, setRoute, setPosition, position,
    scale, viewMode, setViewMode, currentFloor, setFloor, setTicketInfo, ticketInfo,
  } = useMapStore()

  const [showLogin, setShowLogin] = useState(true)
  const [playerX, setPlayerX] = useState(380)
  const [playerY, setPlayerY] = useState(290)
  const [animating, setAnimating] = useState(false)
  const [routePath, setRoutePath] = useState<{ x: number; y: number }[] | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const animRef  = useRef<number>(0)
  const animTRef = useRef(0)
  const pollRef  = useRef<NodeJS.Timeout>()

  // Simulated position polling
  useEffect(() => {
    const poll = () =>
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

    poll()
    pollRef.current = setInterval(poll, 2000)
    return () => clearInterval(pollRef.current)
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
          to:   { x: selectedPOI.x, y: selectedPOI.y },
        }),
      })
      const data = await res.json()
      if (data.path) {
        setRoute(data)
        setRoutePath(data.path)
        setAnimating(true)
      }
    } catch (e) {
      console.error('navigate error', e)
    }
  }, [selectedPOI, playerX, playerY, setRoute])

  // Ticket confirm: jump to the gate's floor and select its POI
  const handleTicketConfirm = useCallback((ticket: TicketInfo) => {
    setTicketInfo(ticket)
    setFloor(ticket.floor)
    setShowLogin(false)

    // After floor switch, find the gate POI and select it
    setTimeout(() => {
      const { pois } = useMapStore.getState()
      const gatePOI = pois.find(p => p.gateCode === ticket.gate || p.id === ticket.gate.toLowerCase())
      if (gatePOI) setSelectedPOI(gatePOI)
    }, 50)
  }, [setTicketInfo, setFloor, setSelectedPOI])

  const { route } = useMapStore()

  // Zoom helpers (avoid calling hook inside JSX)
  const zoomIn  = useCallback(() => useMapStore.getState().setScale(Math.min(3,   useMapStore.getState().scale * 1.2)), [])
  const zoomOut = useCallback(() => useMapStore.getState().setScale(Math.max(0.4, useMapStore.getState().scale * 0.8)), [])
  const zoomReset = useCallback(() => { useMapStore.getState().setScale(1); useMapStore.getState().setOffset(0, 0) }, [])

  const floorPlan = FLOOR_PLANS[currentFloor] ?? FLOOR_PLANS[1]

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f5f5f4' }}>

      {/* ── Login modal ─────────────────────────────────────────────────────── */}
      {showLogin && (
        <TicketLogin
          onConfirm={handleTicketConfirm}
          onSkip={() => setShowLogin(false)}
        />
      )}

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 52, flexShrink: 0, zIndex: 10,
        background: '#fff', borderBottom: '0.5px solid #e5e7eb',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: '#185FA5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14, fontWeight: 800,
          }}>G</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>GateView</div>
            <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.1 }}>JKIA Terminal 1A</div>
          </div>
        </div>

        {/* Centre: boarding pass chip */}
        {ticketInfo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#EFF6FF', border: '1px solid #BFDBFE',
            borderRadius: 20, padding: '4px 12px 4px 8px',
            fontSize: 12, cursor: 'pointer',
          }} onClick={() => setShowLogin(true)}>
            <span>✈</span>
            <span style={{ fontWeight: 600, color: '#185FA5' }}>{ticketInfo.flightNumber}</span>
            <span style={{ color: '#6b7280' }}>{ticketInfo.gate}</span>
            <span style={{
              background: '#185FA5', color: '#fff',
              fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 600,
            }}>
              {ticketInfo.boardingTime}
            </span>
          </div>
        )}

        {/* Right: position · 2D/3D toggle · menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {position && (
            <span style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B6D11', display: 'inline-block' }} />
              <span className="hide-xs">±{Math.round(position.accuracy)}m</span>
            </span>
          )}

          {/* 2D / 3D toggle */}
          <div style={{
            display: 'flex', borderRadius: 8, overflow: 'hidden',
            border: '1px solid #e5e7eb', fontSize: 11,
          }}>
            {(['2d', '3d'] as const).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{
                  padding: '4px 10px', border: 'none', cursor: 'pointer',
                  fontWeight: viewMode === m ? 700 : 400,
                  background: viewMode === m ? '#185FA5' : '#fff',
                  color: viewMode === m ? '#fff' : '#6b7280',
                }}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="menu-btn"
            style={{
              width: 36, height: 36, padding: 0, border: 'none',
              background: 'transparent', fontSize: 18, cursor: 'pointer',
              display: 'none', alignItems: 'center', justifyContent: 'center',
            }}
          >☰</button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Sidebar onNavigate={handleNavigate} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Map area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {viewMode === '3d' ? (
            <AirportMap3D
              playerX={playerX}
              playerY={playerY}
              onSelectPOI={handleSelectPOI}
            />
          ) : (
            <AirportMap
              floorPlan={floorPlan}
              playerX={playerX}
              playerY={playerY}
              onSelectPOI={handleSelectPOI}
            />
          )}

          {/* Zoom controls (2D only) */}
          {viewMode === '2d' && (
            <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[{ label: '+', fn: zoomIn }, { label: '−', fn: zoomOut }, { label: '↺', fn: zoomReset }].map(b => (
                <button key={b.label} onClick={b.fn} style={{
                  width: 40, height: 40, fontSize: 18, padding: 0, border: '0.5px solid #e5e7eb',
                  background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{b.label}</button>
              ))}
            </div>
          )}

          {/* Legend (2D, hide on small phones) */}
          {viewMode === '2d' && (
            <div className="map-legend" style={{
              position: 'absolute', bottom: 12, left: 12,
              background: '#fff', border: '0.5px solid #e5e7eb',
              borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#6b7280',
            }}>
              {[['#185FA5','Gates'],['#3B6D11','Shops & Dining'],['#854F0B','Services'],['#993556','Lounges']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c, flexShrink: 0 }} />
                  {l}
                </div>
              ))}
            </div>
          )}

          {/* Gate info overlay */}
          {selectedPOI?.type === 'GATE' && selectedPOI.description && (
            <div className="gate-overlay" style={{
              position: 'absolute', top: 12, left: 12,
              background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 10,
              padding: '10px 14px', maxWidth: 240, fontSize: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>
                {selectedPOI.gateCode} · {selectedPOI.name}
              </div>
              {selectedPOI.description.split('·').map((part, i) => (
                <div key={i} style={{ color: '#6b7280', marginBottom: 2 }}>{part.trim()}</div>
              ))}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FlightBadge
                  status={
                    selectedPOI.description.toLowerCase().includes('boarding') ? 'BOARDING'
                    : selectedPOI.description.toLowerCase().includes('delayed') ? 'DELAYED'
                    : 'ON_TIME'
                  }
                />
                <button onClick={handleNavigate} className="primary" style={{ fontSize: 11, padding: '3px 10px' }}>
                  Go
                </button>
              </div>
              {route && (
                <div style={{ fontSize: 11, color: '#185FA5', marginTop: 6, fontWeight: 500 }}>
                  {Math.round(route.distanceMeters)}m · ~{Math.round(route.walkTimeSeconds / 60)} min walk
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile bottom bar ────────────────────────────────────────────────── */}
      <nav className="bottom-bar" style={{
        display: 'none', alignItems: 'center',
        background: '#fff', borderTop: '0.5px solid #e5e7eb',
        padding: '0 8px', paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(58px + env(safe-area-inset-bottom))',
        gap: 4, flexShrink: 0, zIndex: 10,
      }}>
        <BotBtn icon="🗺" label="Map"    active={!sidebarOpen} onClick={() => setSidebarOpen(false)} />
        <BotBtn icon="☰"  label="Places" active={sidebarOpen}  onClick={() => setSidebarOpen(v => !v)} />
        <BotBtn icon={viewMode === '3d' ? '2D' : '3D'} label={viewMode === '3d' ? '2D Map' : '3D View'}
          active={false} onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')} />
        {ticketInfo ? (
          <BotBtn icon="🎫" label={ticketInfo.gate} active onClick={() => setShowLogin(true)} accent />
        ) : (
          <BotBtn icon="✈" label="My Flight" active={false} onClick={() => setShowLogin(true)} />
        )}
        {selectedPOI && route && (
          <BotBtn icon="→" label={`~${Math.round(route.walkTimeSeconds / 60)}m`} active accent onClick={handleNavigate} />
        )}
      </nav>

      <style>{`
        @media (max-width: 639px) {
          .menu-btn   { display: flex !important; }
          .bottom-bar { display: flex !important; }
          .map-legend { display: none !important; }
          .gate-overlay { max-width: calc(100vw - 110px) !important; }
        }
        @media (max-width: 380px) {
          .hide-xs { display: none !important; }
        }
      `}</style>
    </main>
  )
}

function BotBtn({ icon, label, active, accent, onClick }: {
  icon: string; label: string; active?: boolean; accent?: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 2, height: 52, border: 'none', cursor: 'pointer',
      background: accent ? '#185FA5' : 'transparent',
      borderRadius: accent ? 10 : 0,
      color: accent ? '#fff' : active ? '#185FA5' : '#9ca3af',
      fontSize: 10, fontWeight: active ? 600 : 400,
      WebkitTapHighlightColor: 'transparent',
    }}>
      <span style={{ fontSize: 19 }}>{icon}</span>
      {label}
    </button>
  )
}