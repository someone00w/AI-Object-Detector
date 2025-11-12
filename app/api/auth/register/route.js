import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { hashPassword, validateEmail, validatePassword } from '@/app/lib/auth'
import { generateVerificationToken, generateTokenExpiry, sendVerificationEmail } from '@/app/lib/tokens'

export async function POST(request) {
  try {
    const body = await request.json()
    const { username, email, password, full_name, role } = body

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      )
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate verification token
    const verificationToken = generateVerificationToken()
    const verificationExpires = generateTokenExpiry()

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        full_name: full_name || null,
        role: role || 2,
        verification_token: verificationToken,
        verification_expires: verificationExpires
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        created_at: true
      }
    })

    // Build verification link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const verificationLink = `${baseUrl}/pages/verify-email?token=${verificationToken}`

    // Send verification email (async, don't wait)
    sendVerificationEmail(email, verificationLink).catch(err => 
      console.error('Failed to send verification email:', err)
    )

    return NextResponse.json(
      { 
        message: 'User registered successfully. Please check your email to verify your account.',
        user 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}