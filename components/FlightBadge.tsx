'use client'
// components/FlightBadge.tsx

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  ON_TIME:   { bg: '#EAF3DE', color: '#3B6D11', label: 'On time' },
  BOARDING:  { bg: '#E6F1FB', color: '#185FA5', label: 'Boarding' },
  DELAYED:   { bg: '#FAEEDA', color: '#854F0B', label: 'Delayed' },
  DEPARTED:  { bg: '#F1EFE8', color: '#5F5E5A', label: 'Departed' },
  CANCELLED: { bg: '#FCEBEB', color: '#A32D2D', label: 'Cancelled' },
}

interface Props {
  status: string
  flightNumber?: string
  delayMinutes?: number
}

export default function FlightBadge({ status, flightNumber, delayMinutes }: Props) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.ON_TIME
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: style.bg, color: style.color,
      fontSize: 11, fontWeight: 500, padding: '2px 8px',
      borderRadius: 4, whiteSpace: 'nowrap',
    }}>
      {flightNumber && <span style={{ opacity: 0.7 }}>{flightNumber}</span>}
      {style.label}
      {status === 'DELAYED' && delayMinutes && <span>+{delayMinutes}m</span>}
    </span>
  )
}
