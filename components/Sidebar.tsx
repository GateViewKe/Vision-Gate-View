'use client'
// components/Sidebar.tsx

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

interface Props {
  onNavigate: () => void
}

export default function Sidebar({ onNavigate }: Props) {
  const { pois, selectedPOI, setSelectedPOI, searchQuery, setSearchQuery, route } = useMapStore()

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

  return (
    <aside style={{
      width: 240, display: 'flex', flexDirection: 'column',
      borderRight: '0.5px solid var(--color-border-tertiary)',
      background: 'var(--color-background-primary)',
      flexShrink: 0, height: '100%',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>GateView</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>JKIA Terminal 1A</div>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search gate, shop, service…"
          style={{ width: '100%', fontSize: 13, padding: '6px 10px' }}
        />
      </div>

      {/* POI List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {Object.entries(groups).map(([type, items]) => (
          <div key={type}>
            <div style={{
              padding: '8px 16px 4px', fontSize: 11, fontWeight: 500,
              color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {TYPE_LABELS[type]}
            </div>
            {items.map(poi => (
              <div
                key={poi.id}
                onClick={() => setSelectedPOI(poi)}
                style={{
                  padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  gap: 10, borderLeft: `2px solid ${selectedPOI?.id === poi.id ? TYPE_COLORS[poi.type] : 'transparent'}`,
                  background: selectedPOI?.id === poi.id ? 'var(--color-background-info)' : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (selectedPOI?.id !== poi.id) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-background-secondary)' }}
                onMouseLeave={e => { if (selectedPOI?.id !== poi.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: TYPE_COLORS[poi.type], flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{poi.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    {poi.description?.split('·')[0].trim() ?? ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Info Panel */}
      <div style={{
        padding: '12px 16px', borderTop: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-secondary)', minHeight: 90,
      }}>
        {selectedPOI ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {selectedPOI.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
              {selectedPOI.description ?? ''}
            </div>
            {route && (
              <div style={{ fontSize: 11, color: 'var(--color-text-info)', marginTop: 6 }}>
                {Math.round(route.distanceMeters)}m · ~{Math.round(route.walkTimeSeconds / 60)} min walk
              </div>
            )}
            <button
              onClick={onNavigate}
              style={{ marginTop: 8, width: '100%', fontSize: 12, padding: '5px 12px', cursor: 'pointer' }}
            >
              {route ? 'Recalculate route' : 'Navigate here'}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Select a location
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
              Click any gate, shop, or service on the map or in the list.
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
