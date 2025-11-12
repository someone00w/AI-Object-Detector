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

    // Check if user is admin
    if (user.role !== 1) {
      return NextResponse.json(
        { error: 'Access denied. Only administrators can delete videos.' },
        { status: 403 }
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

    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Verify admin password (not the video owner's password)
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, adminUser.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid admin password' },
        { status: 401 }
      )
    }

    // Delete video file from filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', video.file_path)
      await unlink(filePath)
      console.log(`✅ Deleted file: ${filePath}`)
    } catch (fileError) {
      console.error('Error deleting file:', fileError)
      // Continue with database deletion even if file deletion fails
    }

    // Delete video record from database
    await prisma.video.delete({
      where: { id: parseInt(id) }
    })

    console.log(`✅ Admin ${user.username} deleted video ${video.video_name} owned by ${video.user.username}`)

    return NextResponse.json(
      { 
        message: 'Video deleted successfully',
        deletedVideo: {
          id: video.id,
          name: video.video_name,
          owner: video.user.username
        }
      },
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