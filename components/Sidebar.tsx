'use client'
// components/Sidebar.tsx — responsive: drawer on mobile, fixed panel on desktop

import { useEffect, useRef } from 'react'
import { useMapStore } from '@/lib/store'
import type { POI } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  GATE: 'Gates', SHOP: 'Shops', DINING: 'Dining',
  LOUNGE: 'Lounges', RESTROOM: 'Restrooms', SERVICE: 'Services',
  SECURITY: 'Security', CHECKIN: 'Check-in',
}

const TYPE_COLORS: Record<string, string> = {
  GATE: '#185FA5', SHOP: '#3B6D11', DINING: '#3B6D11',
  LOUNGE: '#993556', RESTROOM: '#854F0B', SERVICE: '#854F0B',
  SECURITY: '#A32D2D', CHECKIN: '#534AB7',
}

const TYPE_ICONS: Record<string, string> = {
  GATE: '✈', SHOP: '🛍', DINING: '☕',
  LOUNGE: '🛋', RESTROOM: '🚻', SERVICE: '🏥',
  SECURITY: '🔒', CHECKIN: '🎫',
}

interface Props {
  onNavigate: () => void
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ onNavigate, isOpen, onClose }: Props) {
  const { pois, selectedPOI, setSelectedPOI, searchQuery, setSearchQuery, route } = useMapStore()
  const drawerRef = useRef<HTMLDivElement>(null)

  const filtered = searchQuery
    ? pois.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.gateCode ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pois

  const groups = Object.keys(TYPE_LABELS).reduce<Record<string, POI[]>>((acc, type) => {
    const items = filtered.filter(p => p.type === type)
    if (items.length) acc[type] = items
    return acc
  }, {})

  // Close on backdrop tap
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  function handleSelectPOI(poi: POI) {
    setSelectedPOI(poi)
    onClose() // close drawer on mobile after selecting
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="sidebar-desktop">
        <SidebarContent
          groups={groups}
          selectedPOI={selectedPOI}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSelectedPOI={setSelectedPOI}
          onNavigate={onNavigate}
          route={route}
        />
      </aside>

      {/* ── Mobile drawer backdrop ───────────────────────────────────────── */}
      <div
        className={`drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={handleBackdropClick}
      >
        <div ref={drawerRef} className={`drawer ${isOpen ? 'open' : ''}`}>
          {/* Drag handle */}
          <div className="drawer-handle-row" onClick={onClose}>
            <div className="drawer-handle" />
          </div>

          <SidebarContent
            groups={groups}
            selectedPOI={selectedPOI}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSelectedPOI={handleSelectPOI}
            onNavigate={() => { onNavigate(); onClose() }}
            route={route}
            mobile
          />
        </div>
      </div>

      <style>{`
        /* Desktop: fixed left panel */
        .sidebar-desktop {
          width: 240px;
          display: flex;
          flex-direction: column;
          border-right: 0.5px solid var(--color-border-tertiary);
          background: var(--color-background-primary);
          flex-shrink: 0;
          height: 100%;
          overflow: hidden;
        }

        /* Mobile: hide desktop sidebar */
        @media (max-width: 639px) {
          .sidebar-desktop { display: none; }
        }

        /* Backdrop */
        .drawer-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 50;
          background: transparent;
          pointer-events: none;
          transition: background 0.25s;
        }
        .drawer-backdrop.open {
          background: rgba(0,0,0,0.35);
          pointer-events: all;
        }

        /* Drawer panel slides up from bottom */
        .drawer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: #fff;
          border-radius: 16px 16px 0 0;
          max-height: 82vh;
          display: flex;
          flex-direction: column;
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
          pointer-events: all;
          overflow: hidden;
        }
        .drawer.open { transform: translateY(0); }

        .drawer-handle-row {
          display: flex;
          justify-content: center;
          padding: 10px 0 6px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .drawer-handle {
          width: 36px;
          height: 4px;
          background: #d1d5db;
          border-radius: 2px;
        }

        /* Show backdrop on mobile only */
        @media (max-width: 639px) {
          .drawer-backdrop { display: block; }
        }
      `}</style>
    </>
  )
}

/* ── Shared content used in both desktop and mobile ─────────────────────── */
function SidebarContent({
  groups, selectedPOI, searchQuery, setSearchQuery,
  setSelectedPOI, onNavigate, route, mobile = false,
}: {
  groups: Record<string, POI[]>
  selectedPOI: POI | null
  searchQuery: string
  setSearchQuery: (q: string) => void
  setSelectedPOI: (poi: POI) => void
  onNavigate: () => void
  route: any
  mobile?: boolean
}) {
  return (
    <>
      {/* Header — desktop only */}
      {!mobile && (
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>GateView</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 1 }}>JKIA Terminal 1A</div>
        </div>
      )}

      {/* Search */}
      <div style={{
        padding: mobile ? '0 16px 10px' : '10px 12px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        flexShrink: 0,
      }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search gate, shop, service…"
          style={{ width: '100%', fontSize: 14, padding: mobile ? '10px 12px' : '7px 10px' }}
        />
      </div>

      {/* POI list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {Object.entries(groups).map(([type, items]) => (
          <div key={type}>
            <div style={{
              padding: '8px 16px 4px',
              fontSize: 11, fontWeight: 600,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}>
              {TYPE_ICONS[type]} {TYPE_LABELS[type]}
            </div>
            {items.map(poi => (
              <div
                key={poi.id}
                onClick={() => setSelectedPOI(poi)}
                style={{
                  padding: mobile ? '12px 16px' : '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  borderLeft: `2.5px solid ${selectedPOI?.id === poi.id ? TYPE_COLORS[poi.type] : 'transparent'}`,
                  background: selectedPOI?.id === poi.id ? 'var(--color-background-info)' : 'transparent',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.1s',
                  minHeight: mobile ? 52 : 'auto',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: TYPE_COLORS[poi.type] + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15,
                }}>
                  {TYPE_ICONS[poi.type]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{poi.name}</div>
                  <div style={{
                    fontSize: 11, color: 'var(--color-text-secondary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {poi.description?.split('·')[0].trim() ?? ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Info / Navigate panel */}
      <div style={{
        padding: '12px 16px',
        borderTop: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-secondary)',
        flexShrink: 0,
      }}>
        {selectedPOI ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {selectedPOI.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 3, lineHeight: 1.5 }}>
              {selectedPOI.description ?? ''}
            </div>
            {route && (
              <div style={{ fontSize: 11, color: 'var(--color-text-info)', marginTop: 5 }}>
                {Math.round(route.distanceMeters)}m · ~{Math.round(route.walkTimeSeconds / 60)} min walk
              </div>
            )}
            <button
              onClick={onNavigate}
              className="primary"
              style={{
                marginTop: 10, width: '100%',
                fontSize: 13, padding: mobile ? '11px 12px' : '7px 12px',
              }}
            >
              {route ? '↺ Recalculate route' : '→ Navigate here'}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Select a location
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 3, lineHeight: 1.5 }}>
              Tap any gate, shop, or service on the map or in this list.
            </div>
          </>
        )}
      </div>
    </>
  )
}