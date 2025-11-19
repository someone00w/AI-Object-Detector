// src/app/api/user/change-password/route.js
import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/app/lib/apiAuth'
import { prisma } from '@/app/lib/prisma'
import { verifyPassword, hashPassword, validatePassword } from '@/app/lib/auth'

export async function POST(request) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current and new passwords are required' },
        { status: 400 }
      )
    }

    // Validate new password
    const validation = validatePassword(newPassword)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message },
        { status: 400 }
      )
    }

    // Get full user data
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    // Verify current password
    const isValid = await verifyPassword(currentPassword, fullUser.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}