export default function SettingsPage() {
  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Settings</h1>
      {[
        { title: 'Airport', fields: [{ label: 'Airport name', value: 'Jomo Kenyatta International Airport' }, { label: 'IATA', value: 'NBO' }, { label: 'City', value: 'Nairobi, Kenya' }] },
        { title: 'Positioning', fields: [{ label: 'Path loss exponent', value: '2.7' }, { label: 'Smoothing alpha', value: '0.3' }, { label: 'Min beacons', value: '2' }] },
        { title: 'Flight data', fields: [{ label: 'AviationStack API key', value: '' }, { label: 'Refresh (seconds)', value: '60' }] },
      ].map(s => (
        <div key={s.title} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', fontSize: 13, fontWeight: 600 }}>{s.title}</div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {s.fields.map(f => (
              <div key={f.label}>
                <label style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input defaultValue={f.value} style={{ width: '100%', fontSize: 12, padding: '6px 8px', border: '1px solid #E5E7EB', borderRadius: 6 }} />
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end' }}>
            <button style={{ fontSize: 12, padding: '6px 14px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Save</button>
          </div>
        </div>
      ))}
    </div>
  )
}
