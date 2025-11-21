import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()')
  
  // Content Security Policy (CSP)
  // This prevents XSS attacks by controlling which resources can be loaded
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Next.js dev, unsafe-inline for inline scripts
    "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for styled-components/CSS-in-JS
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://storage.googleapis.com https://www.gstatic.com", // Allow TensorFlow model loading
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ]
  
  // In development, relax CSP for hot reload and TensorFlow
  if (process.env.NODE_ENV === 'development') {
    cspDirectives[1] = "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    cspDirectives[5] = "connect-src 'self' ws: wss: https://storage.googleapis.com https://www.gstatic.com"
  }
  
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  
  // Only allow HTTPS in production
  if (process.env.NODE_ENV === 'production' && 
      request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    )
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}