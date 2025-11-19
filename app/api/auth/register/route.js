import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { hashPassword } from '@/app/lib/auth'
import { generateToken } from '@/app/lib/jwt'
import { generateVerificationToken, generateTokenExpiry, sendVerificationEmail } from '@/app/lib/tokens'
import { sanitizeEmail, sanitizeUsername, sanitizeText } from '@/app/lib/sanitize'

export async function POST(request) {
  try {
    const body = await request.json()
    const { username, email, password, full_name } = body

    // Sanitize inputs
    const sanitizedUsername = sanitizeUsername(username)
    const sanitizedEmail = sanitizeEmail(email)
    const sanitizedFullName = full_name ? sanitizeText(full_name, 100) : null

    // Validate sanitized inputs
    if (!sanitizedUsername) {
      return NextResponse.json(
        { error: 'Invalid username format. Must be 3-30 characters, alphanumeric with - or _' },
        { status: 400 }
      )
    }

    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: sanitizedUsername },
          { email: sanitizedEmail }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate verification token
    const verificationToken = generateVerificationToken()
    const verificationExpiry = generateTokenExpiry()

    // Create user
    const user = await prisma.user.create({
      data: {
        username: sanitizedUsername,
        email: sanitizedEmail,
        password: hashedPassword,
        full_name: sanitizedFullName,
        role: 2,
        email_verified: false,
        verification_token: verificationToken,
        verification_expires: verificationExpiry
      }
    })

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const verificationLink = `${baseUrl}/pages/verify-email?token=${verificationToken}`
    await sendVerificationEmail(sanitizedEmail, verificationLink)

    return NextResponse.json(
      { 
        success: true,
        message: 'Registration successful! Please check your email to verify your account.'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}