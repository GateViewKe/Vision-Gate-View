'use client'
// components/TicketLogin.tsx
// Boarding-pass modal. Enter a ticket number → shows flight info + live countdown.
// Dummy tickets: TK001–TK010. Dismiss to browse without a ticket.

import { useState, useEffect, useRef, useCallback } from 'react'
import type { TicketInfo } from '@/lib/types'

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ON_TIME:   { bg: '#EAF3DE', color: '#3B6D11', label: 'On time' },
  BOARDING:  { bg: '#E6F1FB', color: '#185FA5', label: 'Boarding' },
  DELAYED:   { bg: '#FAEEDA', color: '#854F0B', label: 'Delayed' },
  CANCELLED: { bg: '#FCEBEB', color: '#A32D2D', label: 'Cancelled' },
  DEPARTED:  { bg: '#F1EFE8', color: '#5F5E5A', label: 'Departed' },
}

interface Props {
  onConfirm: (ticket: TicketInfo) => void
  onSkip: () => void
}

// Parse "HH:MM" into today's Date object
function todayAt(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

function useCountdown(target: string) {
  const [diff, setDiff] = useState(0)

  useEffect(() => {
    const tick = () => {
      const ms = todayAt(target).getTime() - Date.now()
      setDiff(ms)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  const totalSec = Math.max(0, Math.floor(diff / 1000))
  const hours    = Math.floor(totalSec / 3600)
  const minutes  = Math.floor((totalSec % 3600) / 60)
  const seconds  = totalSec % 60
  const departed = diff < 0

  return { hours, minutes, seconds, departed, urgent: totalSec < 1800 }
}

function CountdownDisplay({ time, status }: { time: string; status: string }) {
  const { hours, minutes, seconds, departed, urgent } = useCountdown(time)
  if (status === 'CANCELLED') return <span style={{ color: '#A32D2D', fontWeight: 600 }}>Flight cancelled</span>
  if (departed) return <span style={{ color: '#5F5E5A' }}>Departed</span>

  const color = urgent ? '#E24B4A' : '#185FA5'
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
      {hours > 0 && (
        <span style={{ fontSize: 28, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
          {hours}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 2 }}>h</span>
        </span>
      )}
      <span style={{ fontSize: 28, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {String(minutes).padStart(2, '0')}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 2 }}>m</span>
      </span>
      <span style={{ fontSize: 22, fontWeight: 600, color: urgent ? '#E24B4A' : '#6b7280', fontVariantNumeric: 'tabular-nums' }}>
        {String(seconds).padStart(2, '0')}<span style={{ fontSize: 11, fontWeight: 400, marginLeft: 1 }}>s</span>
      </span>
    </div>
  )
}

export default function TicketLogin({ onConfirm, onSkip }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ticket, setTicket] = useState<TicketInfo | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleLookup = useCallback(async () => {
    const num = input.trim().toUpperCase()
    if (!num) return setError('Enter your ticket number')
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/ticket?number=${encodeURIComponent(num)}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Ticket not found')
        setTicket(null)
      } else {
        setTicket(await res.json())
      }
    } catch {
      setError('Could not connect. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [input])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLookup()
  }, [handleLookup])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(10,18,30,0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: '#185FA5', padding: '22px 24px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>✈</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>GateView</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
              JKIA — Terminal 1A · Nairobi
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 24px 20px' }}>
          {!ticket ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
                Enter your ticket number
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 18, lineHeight: 1.5 }}>
                Find it on your booking confirmation or boarding pass. Try <strong>TK001</strong>–<strong>TK010</strong>.
              </div>

              <input
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value.toUpperCase()); setError('') }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. TK001"
                style={{
                  width: '100%', padding: '12px 14px', fontSize: 16,
                  border: `1.5px solid ${error ? '#E24B4A' : '#d1d5db'}`,
                  borderRadius: 10, background: '#f9fafb', color: '#1a1a1a',
                  outline: 'none', letterSpacing: '0.05em', marginBottom: 8,
                }}
              />
              {error && (
                <div style={{ fontSize: 12, color: '#E24B4A', marginBottom: 8 }}>{error}</div>
              )}

              <button
                onClick={handleLookup}
                disabled={loading}
                className="primary"
                style={{
                  width: '100%', padding: '12px', fontSize: 14, fontWeight: 600,
                  borderRadius: 10, marginBottom: 10, opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Looking up…' : 'Find my flight'}
              </button>
              <button
                onClick={onSkip}
                style={{
                  width: '100%', padding: '10px', fontSize: 13,
                  background: 'transparent', border: 'none',
                  color: '#9ca3af', cursor: 'pointer',
                }}
              >
                Browse map without ticket
              </button>
            </>
          ) : (
            <BoardingPass ticket={ticket} onConfirm={() => onConfirm(ticket)} onBack={() => setTicket(null)} />
          )}
        </div>
      </div>
    </div>
  )
}

function BoardingPass({ ticket, onConfirm, onBack }: {
  ticket: TicketInfo
  onConfirm: () => void
  onBack: () => void
}) {
  const st = STATUS_STYLE[ticket.status] ?? STATUS_STYLE.ON_TIME
  const floorLabel = ticket.floor === 0 ? 'Ground' : `Level ${ticket.floor}`

  return (
    <div>
      {/* Passenger */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passenger</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginTop: 2 }}>{ticket.passengerName}</div>
      </div>

      {/* Route row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>{ticket.origin}</div>
          <div style={{ fontSize: 10, color: '#9ca3af' }}>Origin</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ fontSize: 16 }}>✈</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>{ticket.destination}</div>
          <div style={{ fontSize: 10, color: '#9ca3af' }}>Destination</div>
        </div>
      </div>

      {/* Details grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: 12, background: '#f9fafb', borderRadius: 12,
        padding: '14px', marginBottom: 16,
      }}>
        {[
          { label: 'Flight',    value: ticket.flightNumber },
          { label: 'Gate',      value: ticket.gate },
          { label: 'Seat',      value: ticket.seat },
          { label: 'Class',     value: ticket.seatClass },
          { label: 'Boards',    value: ticket.boardingTime },
          { label: 'Departs',   value: ticket.scheduledDeparture },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Status + floor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{
          background: st.bg, color: st.color,
          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 5,
        }}>
          {st.label}{ticket.delayMinutes ? ` +${ticket.delayMinutes}m` : ''}
        </span>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          {ticket.airline} · {floorLabel}
        </span>
      </div>

      {/* Countdown */}
      <div style={{
        background: '#f0f6ff', borderRadius: 12, padding: '12px 14px', marginBottom: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
            Time until {ticket.status === 'BOARDING' ? 'boarding closes' : 'departure'}
          </div>
          <CountdownDisplay
            time={ticket.status === 'BOARDING' ? ticket.boardingTime : ticket.scheduledDeparture}
            status={ticket.status}
          />
        </div>
        <div style={{ fontSize: 32 }}>
          {ticket.status === 'BOARDING' ? '🟢' : ticket.status === 'DELAYED' ? '🟡' : '🔵'}
        </div>
      </div>

      <button
        onClick={onConfirm}
        className="primary"
        style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 600, borderRadius: 10, marginBottom: 8 }}
      >
        Navigate to {ticket.gate} →
      </button>
      <button
        onClick={onBack}
        style={{ width: '100%', padding: '8px', fontSize: 12, background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
      >
        Use a different ticket
      </button>
    </div>
  )
}