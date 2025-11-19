import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/jwt'
import { prisma } from '@/app/lib/prisma'
import { sanitizeVideoName } from '@/app/lib/sanitize'

export async function PATCH(request, { params }) {
  try {
    const { id } = params
    const videoId = parseInt(id)

    if (isNaN(videoId)) {
      return NextResponse.json(
        { error: 'Invalid video ID' },
        { status: 400 }
      )
    }

    // Verify authentication
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {})

    const token = cookies.token
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

    const body = await request.json()
    const { video_name } = body

    // Sanitize video name
    const sanitizedName = sanitizeVideoName(video_name)
    
    if (!sanitizedName) {
      return NextResponse.json(
        { error: 'Invalid video name format' },
        { status: 400 }
      )
    }

    // Check if video exists and belongs to user
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    if (video.user_id !== user.id && user.role !== 1) {
      return NextResponse.json(
        { error: 'Not authorized to edit this video' },
        { status: 403 }
      )
    }

    // Update video name
    const updated = await prisma.video.update({
      where: { id: videoId },
      data: { video_name: sanitizedName }
    })

    return NextResponse.json({
      success: true,
      video: updated
    })

  } catch (error) {
    console.error('Update video error:', error)
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    )
  }
}