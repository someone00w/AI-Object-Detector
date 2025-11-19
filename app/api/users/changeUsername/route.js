// src/app/api/user/update-username/route.js
import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/app/lib/apiAuth'
import { prisma } from '@/app/lib/prisma'

export async function PATCH(request) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { username } = await request.json()

    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existing = await prisma.user.findUnique({
      where: { username }
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
      data: { username },
      select: {
        id: true,
        username: true,
        email: true
      }
    })

    return NextResponse.json(
      { message: 'Username updated successfully', user: updated },
      { status: 200 }
    )

  } catch (error) {
    console.error('Update username error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}