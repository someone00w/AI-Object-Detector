import { NextResponse } from 'next/response'
import { verifyToken } from '@/app/lib/jwt'
import { prisma } from '@/app/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { sanitizeVideoName } from '@/app/lib/sanitize'

const ALLOWED_VIDEO_TYPES = ['video/webm', 'video/mp4', 'video/x-matroska']
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB

export async function POST(request) {
  try {
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

    const formData = await request.formData()
    const videoFile = formData.get('video')
    const videoName = formData.get('videoName')
    const detectionResult = formData.get('detectionResult')

    // Validate video file
    if (!videoFile || !(videoFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      )
    }

    // Check file size
    if (videoFile.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_VIDEO_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Check file type
    if (!ALLOWED_VIDEO_TYPES.includes(videoFile.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Sanitize video name
    const sanitizedName = sanitizeVideoName(videoName)
    if (!sanitizedName) {
      return NextResponse.json(
        { error: 'Invalid video name' },
        { status: 400 }
      )
    }

    // Generate secure filename
    const timestamp = Date.now()
    const randomHash = crypto.randomBytes(8).toString('hex')
    const extension = videoFile.type === 'video/webm' ? 'webm' : 
                     videoFile.type === 'video/mp4' ? 'mp4' : 'mkv'
    const safeFileName = `${timestamp}_${randomHash}.${extension}`

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'recordings')
    await mkdir(uploadDir, { recursive: true })

    // Save file
    const filePath = path.join(uploadDir, safeFileName)
    const bytes = await videoFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(filePath, buffer)

    // Calculate file size in MB
    const fileSizeMB = videoFile.size / (1024 * 1024)

    // Parse detection result safely
    let parsedDetectionResult = null
    if (detectionResult) {
      try {
        parsedDetectionResult = JSON.parse(detectionResult)
      } catch (error) {
        console.error('Failed to parse detection result:', error)
      }
    }

    // Save to database
    const video = await prisma.video.create({
      data: {
        user_id: user.id,
        video_name: sanitizedName,
        file_url: `/recordings/${safeFileName}`,
        file_size_mb: fileSizeMB,
        capture_time: new Date(),
        detection_result: parsedDetectionResult
      }
    })

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        video_name: video.video_name,
        file_url: video.file_url
      }
    })

  } catch (error) {
    console.error('Video save error:', error)
    return NextResponse.json(
      { error: 'Failed to save video' },
      { status: 500 }
    )
  }
}