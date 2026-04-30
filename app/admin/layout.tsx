import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'GateView Admin' }

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/pois', label: 'POIs' },
  { href: '/admin/floors', label: 'Floors' },
  { href: '/admin/beacons', label: 'Beacons' },
  { href: '/admin/settings', label: 'Settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "-apple-system, 'Segoe UI', sans-serif", display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>
        <aside style={{ width: 200, background: '#fff', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>GateView Admin</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>JKIA Terminal 1A</div>
          </div>
          <nav style={{ padding: '8px 0', flex: 1 }}>
            {NAV.map(n => (
              <a key={n.href} href={n.href} style={{ display: 'block', padding: '8px 16px', fontSize: 13, color: '#374151', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {n.label}
              </a>
            ))}
          </nav>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB' }}>
            <a href="/" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none' }}>← Back to map</a>
          </div>
        </aside>
        <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
      </body>
    </html>
  )
}
