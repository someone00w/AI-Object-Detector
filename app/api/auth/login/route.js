import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyPassword } from '@/app/lib/auth'
import { generateToken } from '@/app/lib/jwt'

export async function POST(request) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user

    // Generate JWT token
    const token = generateToken(userWithoutPassword)

    // Create response with token in HTTP-only cookie
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        user: userWithoutPassword
      },
      { status: 200 }
    )

    // Set cookie (HTTP-only for security)
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}