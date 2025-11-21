import { NextResponse } from 'next/server'
import { validateCsrfMiddleware } from '@/app/lib/csrf'

export async function POST(request) {
  const csrfValidation = validateCsrfMiddleware(request)
  if (!csrfValidation.valid) {
    return csrfValidation.error
  }
  
  const response = NextResponse.json(
    { message: 'Logged out successfully' },
    { status: 200 }
  )

  // Clear both token and temp_session cookies
  response.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0)
  })
  
  response.cookies.set('temp_session', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0)
  })

  return response
}