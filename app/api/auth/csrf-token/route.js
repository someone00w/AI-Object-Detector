import { NextResponse } from 'next/server'
import { generateCsrfToken } from '@/app/lib/csrf'
import crypto from 'crypto'

/**
 * GET /api/auth/csrf-token
 * Generates and returns a CSRF token for the current session
 * This should be called before making any state-changing requests
 */
export async function GET(request) {
  try {
    // Get or create session ID from cookie
    const cookieHeader = request.headers.get('cookie')
    let sessionId
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {})
      
      // Prefer temp_session, fall back to token, or create new
      sessionId = cookies.temp_session || cookies.token || crypto.randomBytes(16).toString('hex')
    } else {
      // Create temporary session ID for unauthenticated users
      sessionId = crypto.randomBytes(16).toString('hex')
    }
    
    // Generate CSRF token
    const csrfToken = generateCsrfToken(sessionId)
    
    const response = NextResponse.json(
      { csrfToken },
      { status: 200 }
    )
    
    // Set temp_session cookie if no auth token exists
    if (!cookieHeader || !cookieHeader.includes('token=')) {
      response.cookies.set('temp_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 3600 // 1 hour
      })
    }
    
    return response
    
  } catch (error) {
    console.error('CSRF token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}
