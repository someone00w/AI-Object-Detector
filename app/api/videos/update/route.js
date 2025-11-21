import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/jwt'
import { prisma } from '@/app/lib/prisma'
import { validateCsrfMiddleware } from '@/app/lib/csrf'

export async function PUT(request) {
  // CSRF validation
  const csrfValidation = validateCsrfMiddleware(request)
  if (!csrfValidation.valid) {
    return csrfValidation.error
  }
  
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

    // Get update data
    const body = await request.json()
    const { id, video_name } = body

    if (!id || !video_name) {
      return NextResponse.json(
        { error: 'Video ID and name are required' },
        { status: 400 }
      )
    }

    // Check if video belongs to user
    const existingVideo = await prisma.video.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingVideo) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    if (existingVideo.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update video name
    const updatedVideo = await prisma.video.update({
      where: { id: parseInt(id) },
      data: { video_name }
    })

    return NextResponse.json(
      { 
        message: 'Video updated successfully',
        video: updatedVideo 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Update video error:', error)
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    )
  }
}