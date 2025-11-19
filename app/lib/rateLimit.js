import { NextResponse } from 'next/server'

const rateLimit = new Map()

export function checkRateLimit(identifier, maxRequests = 5, windowMs = 60000) {
  const now = Date.now()
  const record = rateLimit.get(identifier)

  if (!record) {
    rateLimit.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (now > record.resetTime) {
    rateLimit.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (record.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: record.resetTime 
    }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count }
}

export function rateLimitMiddleware(request, maxRequests = 5, windowMs = 60000) {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const { allowed, remaining, resetTime } = checkRateLimit(ip, maxRequests, windowMs)

  if (!allowed) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(resetTime).toISOString()
        }
      }
    )
  }

  return { allowed: true, remaining }
}