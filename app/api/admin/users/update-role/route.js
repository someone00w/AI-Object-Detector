import { NextResponse } from 'next/server'
import { requireAdmin } from '@/app/lib/apiAuth'
import { prisma } from '@/app/lib/prisma'
import { validateCsrfMiddleware } from '@/app/lib/csrf'

export async function PATCH(request) {
  // CSRF validation
  const csrfValidation = validateCsrfMiddleware(request)
  if (!csrfValidation.valid) {
    return csrfValidation.error
  }
  
  try {
    // Check if user is admin
    const { user, error } = requireAdmin(request)
    if (error) return error

    const body = await request.json()
    const { userId, newRole } = body

    // Validation
    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      )
    }

    // Validate role is either 1 or 2
    if (![1, 2].includes(newRole)) {
      return NextResponse.json(
        { error: 'Role must be 1 (admin) or 2 (user)' },
        { status: 400 }
      )
    }

    // Prevent admin from changing their own role
    if (parseInt(userId) === user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { role: newRole },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    })

    return NextResponse.json(
      { 
        message: 'Role updated successfully',
        user: updatedUser
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Update role error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}