// src/app/api/user/update-username/route.js
import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/app/lib/apiAuth'
import { prisma } from '@/app/lib/prisma'
import { sanitizeUsername } from '@/app/lib/sanitize'
import { validateCsrfMiddleware } from '@/app/lib/csrf'

export async function PATCH(request) {
  // CSRF validation
  const csrfValidation = validateCsrfMiddleware(request)
  if (!csrfValidation.valid) {
    return csrfValidation.error
  }
  
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { username } = await request.json()

    // Sanitize username
    const sanitizedUsername = sanitizeUsername(username)
    
    if (!sanitizedUsername) {
      return NextResponse.json(
        { error: 'Invalid username format. Must be 3-30 characters, alphanumeric with - or _' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existing = await prisma.user.findUnique({
      where: { username: sanitizedUsername }
    })

    if (existing && existing.id !== user.id) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      )
    }

    // Update username
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { username: sanitizedUsername },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json(
      { success: true, user: updated },
      { status: 200 }
    )

  } catch (error) {
    console.error('Change username error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}