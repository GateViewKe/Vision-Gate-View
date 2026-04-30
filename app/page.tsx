'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useMapStore } from '@/lib/store'

const AirportMap3D = dynamic(() => import('@/components/AirportMap3D'), { ssr: false })

const SESSION_ID = typeof crypto !== 'undefined' ? crypto.randomUUID() : 'demo-' + Math.random().toString(36).slice(2)

const FLOOR_INFO = [
  { id: 'jkia-l0', label: 'L0', sublabel: 'Arrivals', desc: 'Check-in · Baggage · Immigration' },
  { id: 'jkia-l1', label: 'L1', sublabel: 'Departures', desc: 'Gates B10–B21 · Retail · Lounges' },
  { id: 'jkia-l2', label: 'L2', sublabel: 'Upper', desc: 'Simba Restaurant · VIP · Conference' },
]

const TYPE_COLOR: Record<string, string> = {
  GATE:'#2563EB',SHOP:'#059669',DINING:'#059669',LOUNGE:'#9333EA',
  SERVICE:'#D97706',RESTROOM:'#D97706',SECURITY:'#DC2626',
  CHECKIN:'#7C3AED',IMMIGRATION:'#C2410C',BAGGAGE:'#0891B2',RESTAURANT:'#059669',
}
const TYPE_LABEL: Record<string, string> = {
  GATE:'Gates',SHOP:'Shops',DINING:'Dining',LOUNGE:'Lounges',
  SERVICE:'Services',RESTROOM:'Restrooms',SECURITY:'Security',
  CHECKIN:'Check-in',IMMIGRATION:'Immigration',BAGGAGE:'Baggage',RESTAURANT:'Restaurant',
}

export default function Home() {
  const { setRoute, setPosition, position, route, setSearchQuery, searchQuery } = useMapStore()
  const [currentFloor, setCurrentFloor] = useState(1)
  const [heatmapOn, setHeatmapOn] = useState(false)
  const [selectedPOI, setSelectedPOI] = useState<any>(null)
  const [pois, setPOIs] = useState<any[]>([])
  const [floorPlan, setFloorPlan] = useState<any>({ walls: [], corridors: [] })
  const [playerX, setPlayerX] = useState(160)
  const [playerY, setPlayerY] = useState(300)
  const [animating, setAnimating] = useState(false)
  const [routePath, setRoutePath] = useState<any[] | null>(null)
  const [congestionStats, setCongestionStats] = useState<any>(null)
  const animTRef = useRef(0)
  const animRaf = useRef(0)
  const mapRef = useRef<any>(null)

  // Load floor data
  useEffect(() => {
    const floorId = FLOOR_INFO[currentFloor].id
    fetch(`/api/map?terminalId=${floorId}`)
      .then(r => r.json())
      .then(d => { setPOIs(d.pois ?? []); setFloorPlan(d.terminal?.floorPlan ?? { walls: [], corridors: [] }) })
      .catch(() => {})
  }, [currentFloor])

  // Position polling
  useEffect(() => {
    const poll = () => {
      fetch('/api/position', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: SESSION_ID, simulate: true }) })
        .then(r => r.json()).then(pos => { setPosition(pos); if (!animating) { setPlayerX(pos.x); setPlayerY(pos.y) } }).catch(() => {})
    }
    poll(); const id = setInterval(poll, 2000); return () => clearInterval(id)
  }, [animating, setPosition])

  // Congestion
  useEffect(() => {
    fetch(`/api/congestion?floorId=${currentFloor}&resolution=40`)
      .then(r => r.json()).then(d => { setCongestionStats(d.stats); if (heatmapOn && mapRef.current) mapRef.current.updateHeatmap(d, currentFloor) }).catch(() => {})
    const id = setInterval(() => {
      fetch(`/api/congestion?floorId=${currentFloor}&resolution=40`)
        .then(r => r.json()).then(d => { setCongestionStats(d.stats); if (heatmapOn && mapRef.current) mapRef.current.updateHeatmap(d, currentFloor) }).catch(() => {})
    }, 30000)
    return () => clearInterval(id)
  }, [currentFloor, heatmapOn])

  useEffect(() => {
    if (heatmapOn) {
      fetch(`/api/congestion?floorId=${currentFloor}&resolution=40`)
        .then(r => r.json()).then(d => mapRef.current?.updateHeatmap(d, currentFloor)).catch(() => {})
    }
  }, [heatmapOn, currentFloor])

  // Route animation
  useEffect(() => {
    if (!animating || !routePath || routePath.length < 2) return
    animTRef.current = 0
    const step = () => {
      animTRef.current += 0.014
      const total = routePath.length - 1
      const idx = Math.floor(animTRef.current * total)
      const frac = (animTRef.current * total) % 1
      if (idx >= total) { setPlayerX(routePath[total].x); setPlayerY(routePath[total].y); setAnimating(false); return }
      const a = routePath[idx], b = routePath[idx + 1]
      setPlayerX(a.x + (b.x - a.x) * frac); setPlayerY(a.y + (b.y - a.y) * frac)
      animRaf.current = requestAnimationFrame(step)
    }
    animRaf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animRaf.current)
  }, [animating, routePath])

  const handleSelectPOI = useCallback((poi: any) => { setSelectedPOI(poi); setRoute(null); setRoutePath(null) }, [setRoute])

  const handleNavigate = useCallback(async () => {
    if (!selectedPOI) return
    const res = await fetch('/api/navigate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from: { x: playerX, y: playerY }, to: { x: selectedPOI.x, y: selectedPOI.y } }) })
    const data = await res.json()
    if (data.path) { setRoute(data); setRoutePath(data.path); setAnimating(true) }
  }, [selectedPOI, playerX, playerY, setRoute])

  const filtered = searchQuery ? pois.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.gateCode ?? '').toLowerCase().includes(searchQuery.toLowerCase())) : pois
  const groups = Object.keys(TYPE_LABEL).reduce<Record<string, any[]>>((acc, type) => {
    const items = filtered.filter((p: any) => p.type === type)
    if (items.length) acc[type] = items
    return acc
  }, {})

  const statusColor = (d?: string) => d?.toLowerCase().includes('boarding') ? '#2563EB' : d?.toLowerCase().includes('delayed') ? '#F59E0B' : '#10B981'
  const statusLabel = (d?: string) => d?.toLowerCase().includes('boarding') ? 'BOARDING' : d?.toLowerCase().includes('delayed') ? 'DELAYED' : 'ON TIME'
  const congColor = congestionStats ? ({ low: '#10B981', moderate: '#F59E0B', high: '#F97316', critical: '#EF4444' } as any)[congestionStats.level] : '#10B981'

  const S = (v: number) => `style="${v}"`

  return (
    <main style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#060D1A', fontFamily:"-apple-system, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header style={{ height:52, background:'rgba(8,18,36,0.95)', borderBottom:'0.5px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', flexShrink:0, backdropFilter:'blur(12px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #2563EB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#60A5FA', letterSpacing:'-0.5px' }}>GV</div>
          <span style={{ fontSize:15, fontWeight:700, color:'#fff', letterSpacing:'0.3px' }}>Gate<span style={{ color:'#60A5FA' }}>View</span></span>
          <span style={{ fontSize:10, color:'#4A6480', border:'1px solid rgba(255,255,255,0.08)', padding:'3px 10px', borderRadius:20, letterSpacing:'1.2px', fontFamily:'monospace' }}>JKIA · NBO</span>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {FLOOR_INFO.map((f, i) => (
            <button key={i} onClick={() => setCurrentFloor(i)} style={{ fontSize:11, padding:'4px 14px', borderRadius:6, cursor:'pointer', background: currentFloor===i ? '#2563EB' : 'rgba(255,255,255,0.05)', color: currentFloor===i ? '#fff' : '#6B8DAE', border:`0.5px solid ${currentFloor===i ? '#2563EB' : 'rgba(255,255,255,0.08)'}`, fontWeight: currentFloor===i ? 600 : 400 }}>
              {f.label} · {f.sublabel}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {congestionStats && (
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:congColor }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:congColor }} />
              {congestionStats.level.charAt(0).toUpperCase()+congestionStats.level.slice(1)} congestion
            </div>
          )}
          <button onClick={() => setHeatmapOn(h => !h)} style={{ fontSize:11, padding:'4px 12px', borderRadius:6, cursor:'pointer', background: heatmapOn ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)', color: heatmapOn ? '#F59E0B' : '#6B8DAE', border:`0.5px solid ${heatmapOn ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
            {heatmapOn ? '🔥 Hide heatmap' : '🔥 Heatmap'}
          </button>
          {position && (
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'#34D399', fontFamily:'monospace' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#10B981' }} />
              ±{Math.round(position.accuracy)}m
            </div>
          )}
          <a href="/admin" style={{ fontSize:11, padding:'4px 12px', borderRadius:6, color:'#6B8DAE', border:'0.5px solid rgba(255,255,255,0.08)', textDecoration:'none', background:'rgba(255,255,255,0.03)' }}>Admin ↗</a>
        </div>
      </header>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* Sidebar */}
        <aside style={{ width:232, display:'flex', flexDirection:'column', borderRight:'0.5px solid rgba(255,255,255,0.06)', background:'rgba(8,18,36,0.9)', flexShrink:0 }}>
          <div style={{ padding:'10px 12px', borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search gate, shop, service…"
              style={{ width:'100%', fontSize:12, padding:'6px 10px', background:'rgba(255,255,255,0.05)', color:'#E2EAF4', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:6, outline:'none' }} />
          </div>
          <div style={{ padding:'8px 14px 4px', borderBottom:'0.5px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize:10, color:'#2563EB', fontWeight:600 }}>{FLOOR_INFO[currentFloor].label} · {FLOOR_INFO[currentFloor].sublabel}</div>
            <div style={{ fontSize:10, color:'#2E4A63', marginTop:1 }}>{FLOOR_INFO[currentFloor].desc}</div>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {Object.entries(groups).map(([type, items]) => (
              <div key={type}>
                <div style={{ padding:'7px 14px 3px', fontSize:9, fontWeight:600, color:'#1E3448', textTransform:'uppercase', letterSpacing:'0.8px' }}>{TYPE_LABEL[type]}</div>
                {items.map((poi: any) => (
                  <div key={poi.id} onClick={() => handleSelectPOI(poi)}
                    style={{ padding:'7px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:9, borderLeft:`2px solid ${selectedPOI?.id===poi.id ? TYPE_COLOR[poi.type] : 'transparent'}`, background: selectedPOI?.id===poi.id ? `${TYPE_COLOR[poi.type]}18` : 'transparent' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:TYPE_COLOR[poi.type]??'#888', flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:11, color:'#B0C8E0', lineHeight:1.3 }}>{poi.name}</div>
                      <div style={{ fontSize:10, color:'#1E3448' }}>{poi.description?.split('·')[0].trim()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {/* Info panel */}
          <div style={{ padding:'12px 14px', borderTop:'0.5px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.2)', minHeight:96 }}>
            {selectedPOI ? (
              <>
                <div style={{ fontSize:12, fontWeight:600, color:'#E2EAF4', marginBottom:4 }}>{selectedPOI.gateCode ? `${selectedPOI.gateCode} · ` : ''}{selectedPOI.name}</div>
                <div style={{ fontSize:10, color:'#3A5570', lineHeight:1.5, marginBottom:6 }}>{selectedPOI.description}</div>
                {selectedPOI.type === 'GATE' && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                    <div style={{ fontSize:9, fontWeight:600, padding:'2px 8px', borderRadius:4, background:`${statusColor(selectedPOI.description)}22`, color:statusColor(selectedPOI.description), border:`1px solid ${statusColor(selectedPOI.description)}44` }}>
                      {statusLabel(selectedPOI.description)}
                    </div>
                  </div>
                )}
                {route && <div style={{ fontSize:10, color:'#60A5FA', marginBottom:6 }}>{Math.round(route.distanceMeters)}m · ~{Math.max(1, Math.round(route.walkTimeSeconds/60))} min walk</div>}
                <button onClick={handleNavigate} style={{ width:'100%', fontSize:11, padding:'6px', background:'#2563EB', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:500 }}>
                  {route ? 'Recalculate route' : 'Navigate here'}
                </button>
              </>
            ) : <div style={{ fontSize:11, color:'#1E3448', paddingTop:8 }}>Select a location to navigate</div>}
          </div>
        </aside>

        {/* 3D Map */}
        <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
          <AirportMap3D
            playerX={playerX} playerY={playerY}
            currentFloor={currentFloor} heatmapOn={heatmapOn}
            onSelectPOI={handleSelectPOI}
            onFloorTransitionEnd={setCurrentFloor}
            mapRef={mapRef}
          />

          {/* Selected POI overlay */}
          {selectedPOI && (
            <div style={{ position:'absolute', top:14, left:14, background:'rgba(6,13,26,0.92)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px 16px', maxWidth:250, fontSize:12, backdropFilter:'blur(16px)' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:5 }}>{selectedPOI.gateCode ? `${selectedPOI.gateCode} · ` : ''}{selectedPOI.name}</div>
              {selectedPOI.description?.split('·').map((p: string, i: number) => <div key={i} style={{ color:'#4A7090', fontSize:11, marginBottom:2 }}>{p.trim()}</div>)}
              {selectedPOI.openHours && <div style={{ color:'#1E3A50', fontSize:10, marginTop:4 }}>Open {selectedPOI.openHours}</div>}
              {selectedPOI.type === 'GATE' && (
                <div style={{ marginTop:8, display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:600, padding:'3px 10px', borderRadius:5, background:`${statusColor(selectedPOI.description)}22`, color:statusColor(selectedPOI.description), border:`1px solid ${statusColor(selectedPOI.description)}44` }}>
                  {statusLabel(selectedPOI.description)}
                </div>
              )}
              {route && <div style={{ marginTop:8, fontSize:11, color:'#60A5FA' }}>{Math.round(route.distanceMeters)}m · ~{Math.max(1, Math.round(route.walkTimeSeconds/60))} min walk</div>}
              <button onClick={handleNavigate} style={{ marginTop:10, width:'100%', fontSize:12, padding:'6px', background:'#2563EB', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 }}>
                {route ? 'Recalculate route' : 'Navigate here'}
              </button>
            </div>
          )}

          {/* Heatmap legend */}
          {heatmapOn && (
            <div style={{ position:'absolute', bottom:14, right:14, background:'rgba(6,13,26,0.88)', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 14px', backdropFilter:'blur(12px)' }}>
              <div style={{ fontSize:9, color:'#2E4A63', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>Passenger density</div>
              <div style={{ width:130, height:7, borderRadius:4, background:'linear-gradient(to right,#1a3a6e,#2a8a4a,#e8a020,#cc3030)', marginBottom:4 }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'#1E3448' }}><span>Low</span><span>Med</span><span>High</span><span>Critical</span></div>
              {congestionStats && <div style={{ marginTop:6, fontSize:10, color:congColor }}>{congestionStats.hotZones} hot zones · avg {Math.round(congestionStats.avgIntensity*100)}%</div>}
            </div>
          )}

          {/* Legend */}
          <div style={{ position:'absolute', bottom:14, left:14, background:'rgba(6,13,26,0.85)', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 12px', backdropFilter:'blur(12px)' }}>
            {[['#2563EB','Gates'],['#059669','Shops & Dining'],['#D97706','Services'],['#9333EA','Lounges'],['#7C3AED','Check-in'],['#0891B2','Baggage']].map(([c,l]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                <div style={{ width:9, height:9, borderRadius:2, background:c, flexShrink:0 }} />
                <span style={{ fontSize:10, color:'#4A7090' }}>{l}</span>
              </div>
            ))}
          </div>

          <div style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', fontSize:10, color:'#0F2035', pointerEvents:'none' }}>Drag to orbit · Scroll to zoom · Click to select</div>
        </div>
      </div>
    </main>
  )
}
