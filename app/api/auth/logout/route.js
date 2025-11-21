import { NextResponse } from 'next/server'
import { validateCsrfMiddleware } from '@/app/lib/csrf'

export async function POST(request) {
  // CSRF validation
  const csrfValidation = validateCsrfMiddleware(request)
  if (!csrfValidation.valid) {
    return csrfValidation.error
  }
  
  const response = NextResponse.json(
    { message: 'Logged out successfully' },
    { status: 200 }
  )

  // Clear the token cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0)
  })

  return response
}