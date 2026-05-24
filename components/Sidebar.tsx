'use client'
// components/Sidebar.tsx

import { useMapStore } from '@/lib/store'
import { FLOOR_META } from '@/lib/jkia-data'
import type { POI } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  GATE:'Gates', SHOP:'Shops', DINING:'Dining', LOUNGE:'Lounges',
  RESTROOM:'Restrooms', SERVICE:'Services', SECURITY:'Security',
  CHECKIN:'Check-in', BAGGAGE:'Baggage', IMMIGRATION:'Immigration',
  PRAYER:'Prayer', PHARMACY:'Pharmacy', ESCALATOR:'Connections',
  ELEVATOR:'Lifts', ATM:'ATMs & Forex', INFORMATION:'Information',
}
const TYPE_COLORS: Record<string, string> = {
  GATE:'#185FA5', SHOP:'#3B6D11', DINING:'#3B6D11', LOUNGE:'#993556',
  RESTROOM:'#854F0B', SERVICE:'#854F0B', SECURITY:'#A32D2D',
  CHECKIN:'#534AB7', BAGGAGE:'#5F5E5A', IMMIGRATION:'#A32D2D',
  PRAYER:'#534AB7', PHARMACY:'#854F0B', ESCALATOR:'#185FA5',
  ELEVATOR:'#185FA5', ATM:'#3B6D11', INFORMATION:'#185FA5',
}
const TYPE_ICONS: Record<string, string> = {
  GATE:'✈', SHOP:'🛍', DINING:'☕', LOUNGE:'🛋', RESTROOM:'🚻',
  SERVICE:'🏥', SECURITY:'🔒', CHECKIN:'🎫', BAGGAGE:'🧳',
  IMMIGRATION:'🛂', PRAYER:'✦', PHARMACY:'💊', ESCALATOR:'▲',
  ELEVATOR:'🔲', ATM:'💳', INFORMATION:'ℹ',
}

// Priority sort so Gates & Lounges always come first
const TYPE_ORDER = ['GATE','LOUNGE','SECURITY','CHECKIN','DINING','SHOP','SERVICE','PHARMACY','PRAYER','RESTROOM','BAGGAGE','IMMIGRATION','ESCALATOR','ELEVATOR','ATM','INFORMATION']

interface Props {
  onNavigate: () => void
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ onNavigate, isOpen, onClose }: Props) {
  const {
    pois, selectedPOI, setSelectedPOI, searchQuery, setSearchQuery,
    route, currentFloor, setFloor,
  } = useMapStore()

  const filtered = searchQuery
    ? pois.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.gateCode ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pois

  const groups = TYPE_ORDER.reduce<Record<string, POI[]>>((acc, type) => {
    const items = filtered.filter(p => p.type === type)
    if (items.length) acc[type] = items
    return acc
  }, {})

  function handleSelectPOI(poi: POI) {
    setSelectedPOI(poi)
    onClose()   // auto-close drawer on mobile
  }

  const content = (
    <SidebarContent
      groups={groups}
      selectedPOI={selectedPOI}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      onSelectPOI={handleSelectPOI}
      onNavigate={() => { onNavigate(); onClose() }}
      route={route}
      currentFloor={currentFloor}
      setFloor={(f) => { setFloor(f); onClose() }}
    />
  )

  return (
    <>
      {/* Desktop */}
      <aside className="sb-desktop">{content}</aside>

      {/* Mobile drawer */}
      <div
        className={`sb-backdrop${isOpen ? ' open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className={`sb-drawer${isOpen ? ' open' : ''}`}>
          <div className="sb-handle-row" onClick={onClose}>
            <div className="sb-handle" />
          </div>
          {content}
        </div>
      </div>

      <style>{`
        .sb-desktop {
          width: 248px; flex-shrink: 0;
          display: flex; flex-direction: column;
          border-right: 0.5px solid var(--color-border-tertiary);
          background: var(--color-background-primary);
          height: 100%; overflow: hidden;
        }
        @media (max-width: 639px) { .sb-desktop { display: none; } }

        .sb-backdrop {
          display: none; position: fixed; inset: 0; z-index: 50;
          background: transparent; pointer-events: none;
          transition: background 0.25s;
        }
        .sb-backdrop.open {
          background: rgba(0,0,0,0.38); pointer-events: all;
        }
        .sb-drawer {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: #fff; border-radius: 18px 18px 0 0;
          max-height: 84vh; display: flex; flex-direction: column;
          transform: translateY(100%); pointer-events: all; overflow: hidden;
          transition: transform 0.32s cubic-bezier(0.32,0.72,0,1);
        }
        .sb-drawer.open { transform: translateY(0); }
        .sb-handle-row {
          display: flex; justify-content: center;
          padding: 10px 0 4px; cursor: pointer; flex-shrink: 0;
        }
        .sb-handle { width: 38px; height: 4px; background: #d1d5db; border-radius: 2px; }
        @media (max-width: 639px) { .sb-backdrop { display: block; } }
      `}</style>
    </>
  )
}

// ── Shared content ────────────────────────────────────────────────────────────
function SidebarContent({
  groups, selectedPOI, searchQuery, setSearchQuery,
  onSelectPOI, onNavigate, route, currentFloor, setFloor,
}: {
  groups: Record<string, POI[]>
  selectedPOI: POI | null
  searchQuery: string
  setSearchQuery: (q: string) => void
  onSelectPOI: (poi: POI) => void
  onNavigate: () => void
  route: any
  currentFloor: number
  setFloor: (f: number) => void
}) {
  return (
    <>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>GateView</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>JKIA Terminal 1A · Nairobi</div>
      </div>

      {/* Floor selector */}
      <div style={{ padding: '8px 12px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Floor</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {FLOOR_META.map(f => (
            <button
              key={f.id}
              onClick={() => setFloor(f.id)}
              style={{
                flex: 1, padding: '6px 4px', fontSize: 11, fontWeight: 600,
                borderRadius: 8, cursor: 'pointer', lineHeight: 1.3,
                background: currentFloor === f.id ? '#185FA5' : '#f3f4f6',
                color: currentFloor === f.id ? '#fff' : '#374151',
                border: `1.5px solid ${currentFloor === f.id ? '#185FA5' : '#e5e7eb'}`,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{ fontSize: 14 }}>{f.shortLabel}</div>
              <div style={{ fontWeight: 400, fontSize: 9, opacity: 0.8 }}>{f.description.split('·')[0].trim()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search gate, shop, lounge…"
          style={{ width: '100%', fontSize: 13, padding: '8px 10px' }}
        />
      </div>

      {/* POI list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {Object.keys(groups).length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            No results for "{searchQuery}"
          </div>
        )}
        {Object.entries(groups).map(([type, items]) => (
          <div key={type}>
            <div style={{
              padding: '8px 16px 3px', fontSize: 10, fontWeight: 600,
              color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px',
            }}>
              {TYPE_ICONS[type]} {TYPE_LABELS[type] ?? type}
            </div>
            {items.map(poi => (
              <div
                key={poi.id}
                onClick={() => onSelectPOI(poi)}
                style={{
                  padding: '9px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  minHeight: 48,
                  borderLeft: `2.5px solid ${selectedPOI?.id === poi.id ? TYPE_COLORS[poi.type] : 'transparent'}`,
                  background: selectedPOI?.id === poi.id ? '#EFF6FF' : 'transparent',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: (TYPE_COLORS[poi.type] ?? '#888') + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  {TYPE_ICONS[poi.type]}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {poi.name}
                  </div>
                  {poi.description && (
                    <div style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {poi.description.split('·')[0].trim()}
                    </div>
                  )}
                </div>
                {poi.openHours && (
                  <div style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>{poi.openHours}</div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Navigation panel */}
      <div style={{
        padding: '12px 16px', borderTop: '0.5px solid var(--color-border-tertiary)',
        background: '#f9fafb', flexShrink: 0,
      }}>
        {selectedPOI ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 20, marginTop: 1 }}>{TYPE_ICONS[selectedPOI.type]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{selectedPOI.name}</div>
                {selectedPOI.description && (
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, lineHeight: 1.5 }}>
                    {selectedPOI.description}
                  </div>
                )}
                {selectedPOI.openHours && (
                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
                    🕐 {selectedPOI.openHours}
                  </div>
                )}
              </div>
            </div>
            {route && (
              <div style={{ fontSize: 11, color: '#185FA5', marginBottom: 6, fontWeight: 500 }}>
                📍 {Math.round(route.distanceMeters)}m · ~{Math.round(route.walkTimeSeconds / 60)} min walk
              </div>
            )}
            <button
              onClick={onNavigate}
              className="primary"
              style={{ width: '100%', fontSize: 13, fontWeight: 600, padding: '9px 12px', borderRadius: 8 }}
            >
              {route ? '↺ Recalculate route' : '→ Navigate here'}
            </button>
          </>
        ) : (
          <div style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', padding: '4px 0' }}>
            Tap a location on the map or in the list above to navigate
          </div>
        )}
      </div>
    </>
  )
}