import { db } from '@/lib/db'

async function getStats() {
  const [pois, beacons, terminals, positions] = await Promise.all([
    db.pOI.count(), db.beacon.count(), db.terminal.count(),
    db.positionLog.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
  ])
  return { pois, beacons, terminals, positions }
}

export default async function AdminDashboard() {
  const stats = await getStats()
  const cards = [
    { label: 'Total POIs', value: stats.pois, color: '#2563EB' },
    { label: 'Beacons', value: stats.beacons, color: '#059669' },
    { label: 'Floors mapped', value: stats.terminals, color: '#7C3AED' },
    { label: 'Positions (24h)', value: stats.positions, color: '#D97706' },
  ]
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Quick actions</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ href: '/admin/pois', label: '+ Add POI' }, { href: '/admin/beacons', label: '+ Add beacon' }, { href: '/admin/floors', label: 'Edit floors' }].map(a => (
            <a key={a.href} href={a.href} style={{ fontSize: 12, padding: '7px 16px', borderRadius: 7, background: '#2563EB', color: '#fff', textDecoration: 'none', fontWeight: 500 }}>{a.label}</a>
          ))}
        </div>
      </div>
    </div>
  )
}
