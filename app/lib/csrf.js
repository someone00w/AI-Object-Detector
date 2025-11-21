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

export function validateCsrfMiddleware(request) {
  const method = request.method
  
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true }
  }
  
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
  
  // Use temp_session OR token as session ID
  const sessionId = cookies.temp_session || cookies.token
  if (!sessionId) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Session required' },
        { status: 401 }
      )
    }
  }
  
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