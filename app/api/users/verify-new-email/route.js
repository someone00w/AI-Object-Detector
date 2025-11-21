import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { validateCsrfMiddleware } from '@/app/lib/csrf'

export async function POST(request) {
  // CSRF validation
  const csrfValidation = validateCsrfMiddleware(request)
  if (!csrfValidation.valid) {
    return csrfValidation.error
  }
  
  try {
    const { token, newEmail } = await request.json()

    if (!token || !newEmail) {
      return NextResponse.json(
        { error: 'Token and email are required' },
        { status: 400 }
      )
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        verification_token: token,
        verification_expires: {
          gt: new Date() // Token not expired
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if new email is already taken by another user
    const existingEmail = await prisma.user.findUnique({
      where: { email: newEmail }
    })

    if (existingEmail && existingEmail.id !== user.id) {
      return NextResponse.json(
        { error: 'Email address is already in use' },
        { status: 409 }
      )
    }

    // Update email and clear verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: newEmail,
        email_verified: true,
        verification_token: null,
        verification_expires: null
      }
    })

    return NextResponse.json(
      { message: 'Email changed successfully! Please log in with your new email.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email change' },
      { status: 500 }
    )
  }
}