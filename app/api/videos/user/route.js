import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/jwt'
import { prisma } from '@/app/lib/prisma'

export async function GET(request) {
  try {
    // 1. Verify user authentication
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

    // 2. Get all videos for this user
    const videos = await prisma.video.findMany({
      where: {
        user_id: user.id
      },
      orderBy: {
        capture_time: 'desc' // Most recent first
      },
      select: {
        id: true,
        video_name: true,
        file_path: true,
        capture_time: true,
        file_size_mb: true,
        detection_result: true,
        uploaded_at: true
      }
    })

    return NextResponse.json(
      { videos },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get videos error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}