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

    // 2. Get videos based on user role
    // Admin (role === 1) gets all videos, regular users get only their own
    const whereClause = user.role === 1 ? {} : { user_id: user.id }

    const videos = await prisma.video.findMany({
      where: whereClause,
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
        uploaded_at: true,
        user_id: true,
        user: {
          select: {
            username: true
          }
        }
      }
    })

    // Format the response to include username at the top level
    const formattedVideos = videos.map(video => ({
      id: video.id,
      video_name: video.video_name,
      file_path: video.file_path,
      capture_time: video.capture_time,
      file_size_mb: video.file_size_mb,
      detection_result: video.detection_result,
      uploaded_at: video.uploaded_at,
      user_id: video.user_id,
      username: video.user.username
    }))

    return NextResponse.json(
      { videos: formattedVideos },
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