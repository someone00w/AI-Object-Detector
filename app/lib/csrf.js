import crypto from 'crypto'
import { NextResponse } from 'next/server'

const csrfTokens = new Map()

export function generateCsrfToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex')
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + 3600000 // 1 hour
  })
  
  // Cleanup expired tokens
  for (const [id, data] of csrfTokens.entries()) {
    if (data.expires < Date.now()) {
      csrfTokens.delete(id)
    }
  }
  
  return token
}

export function validateCsrfToken(sessionId, token) {
  const record = csrfTokens.get(sessionId)
  
  if (!record) return false
  if (record.expires < Date.now()) {
    csrfTokens.delete(sessionId)
    return false
  }
  if (record.token !== token) return false
  
  return true
}

/**
 * Middleware to validate CSRF token on state-changing requests (POST, PUT, PATCH, DELETE)
 * Safe methods (GET, HEAD, OPTIONS) are exempt from CSRF validation
 */
export function validateCsrfMiddleware(request) {
  const method = request.method
  
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true }
  }
  
  // Get session ID from cookie
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Session required' },
        { status: 401 }
      )
    }
  }
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {})
  
  const sessionId = cookies.token // Using JWT token as session ID
  if (!sessionId) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Session required' },
        { status: 401 }
      )
    }
  }
  
  // Get CSRF token from header
  const csrfToken = request.headers.get('x-csrf-token')
  if (!csrfToken) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'CSRF token required' },
        { status: 403 }
      )
    }
  }
  
  // Validate CSRF token
  const isValid = validateCsrfToken(sessionId, csrfToken)
  if (!isValid) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Invalid or expired CSRF token' },
        { status: 403 }
      )
    }
  }
  
  return { valid: true, sessionId }
}