import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/jwt'
import { prisma } from '@/app/lib/prisma'
import { unlink } from 'fs/promises'
import path from 'path'
import bcrypt from 'bcryptjs'

export async function DELETE(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get video ID and password from request body
    const body = await request.json()
    const { id, password } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Check if video belongs to user
    const video = await prisma.video.findUnique({
      where: { id: parseInt(id) }
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    if (video.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Verify password
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, dbUser.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Delete video file from filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', video.file_path)
      await unlink(filePath)
    } catch (fileError) {
      console.error('Error deleting file:', fileError)
      // Continue with database deletion even if file deletion fails
    }

    // Delete video record from database
    await prisma.video.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json(
      { message: 'Video deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete video error:', error)
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    )
  }
}