import { NextResponse } from 'next/server'
import { requireAdmin } from '@/app/lib/apiAuth'
import { prisma } from '@/app/lib/prisma'

// GET all users (Admin only)
export async function GET(request) {
  try {
    // Check if user is admin
    const { user, error } = requireAdmin(request)
    if (error) return error

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({ users }, { status: 200 })

  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE user (Admin only)
export async function DELETE(request) {
  try {
    // Check if user is admin
    const { user, error } = requireAdmin(request)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Prevent admin from deleting themselves
    if (parseInt(userId) === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id: parseInt(userId) }
    })

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}