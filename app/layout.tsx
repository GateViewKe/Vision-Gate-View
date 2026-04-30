import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GateView — JKIA Intelligent Airport Navigation',
  description: 'Real-time 3D airport navigation, flight intelligence, and congestion analytics for Jomo Kenyatta International Airport',
  keywords: ['airport navigation', 'JKIA', 'indoor navigation', 'airport technology'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
