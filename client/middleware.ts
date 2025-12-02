import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Admin routes protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const adminSession = request.cookies.get('adminSession')?.value
    
    if (!adminSession && !request.nextUrl.pathname.includes('/login') && !request.nextUrl.pathname.includes('/register')) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Voter routes protection
  if (request.nextUrl.pathname.startsWith('/voter')) {
    const voterSession = request.cookies.get('voterSession')?.value
    
    if (!voterSession && !request.nextUrl.pathname.includes('/login') && !request.nextUrl.pathname.includes('/register')) {
      return NextResponse.redirect(new URL('/voter/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/voter/:path*',
  ],
}