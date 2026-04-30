import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/admin')) return NextResponse.next()
  const auth = req.headers.get('authorization')
  if (auth) {
    const [scheme, encoded] = auth.split(' ')
    if (scheme === 'Basic' && encoded) {
      const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':')
      if (user === (process.env.ADMIN_USERNAME ?? 'admin') && pass === (process.env.ADMIN_PASSWORD ?? 'gateview-admin')) return NextResponse.next()
    }
  }
  return new NextResponse('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="GateView Admin"' } })
}

export const config = { matcher: ['/admin/:path*'] }
