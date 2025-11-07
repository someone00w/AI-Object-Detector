import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/jwt'

// Get user from request
export function getUserFromRequest(request) {
  const cookieHeader = request.headers.get('cookie')
  
  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {})

  const token = cookies.token

  if (!token) {
    return null
  }

  return verifyToken(token)
}

// Middleware to require authentication
export function requireAuth(request) {
  const user = getUserFromRequest(request)
  
  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
  }

  return { user }
}

// Middleware to require admin role
export function requireAdmin(request) {
  const user = getUserFromRequest(request)
  
  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
  }

  if (user.role !== 1) {
    return {
      error: NextResponse.json(
        { error: 'Access denied. Admin only.' },
        { status: 403 }
      )
    }
  }

  return { user }
}