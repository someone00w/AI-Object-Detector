// src/app/api/user/change-email/route.js
import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/app/lib/apiAuth'
import { prisma } from '@/app/lib/prisma'
import { verifyPassword, validateEmail } from '@/app/lib/auth'
import { generateVerificationToken, generateTokenExpiry, sendVerificationEmail } from '@/app/lib/tokens'

export async function POST(request) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { newEmail, password } = await request.json()

    if (!newEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email
    if (!validateEmail(newEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get full user data
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    // Verify password
    const isValid = await verifyPassword(password, fullUser.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: newEmail }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      )
    }

    // Generate verification token
    const token = generateVerificationToken()
    const expiry = generateTokenExpiry()

    // Store pending email change
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verification_token: token,
        verification_expires: expiry
        // Note: We'll store the new email in a separate field or use a different approach
      }
    })

    // Send verification email to NEW email
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const verificationLink = `${baseUrl}/pages/verify-email/new?token=${token}&email=${encodeURIComponent(newEmail)}`
    
    await sendVerificationEmail(newEmail, verificationLink)

    return NextResponse.json(
      { message: 'Verification email sent' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Change email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}