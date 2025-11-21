import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/jwt'
import { prisma } from '@/app/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { sanitizeVideoName } from '@/app/lib/sanitize'
import { validateCsrfMiddleware } from '@/app/lib/csrf'

const ALLOWED_VIDEO_TYPES = ['video/webm', 'video/mp4', 'video/x-matroska']
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB

export async function POST(request) {
  // CSRF validation
  const csrfValidation = validateCsrfMiddleware(request)
  if (!csrfValidation.valid) {
    return csrfValidation.error
  }
  
  try {
    console.log('📥 Received video save request')
    
    // Verify authentication
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      console.error('❌ No cookie header')
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
      console.error('❌ No token found')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user) {
      console.error('❌ Invalid token')
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id)

    const formData = await request.formData()
    const videoFile = formData.get('video')
    const videoName = formData.get('videoName') || 'Recording'
    const detectionResult = formData.get('detectionResult')

    console.log('📋 Form data:', {
      hasVideo: !!videoFile,
      videoName,
      hasDetectionResult: !!detectionResult,
      videoSize: videoFile?.size,
      videoType: videoFile?.type
    })

    // Validate video file
    if (!videoFile || !(videoFile instanceof Blob)) {
      console.error('❌ No video file provided')
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      )
    }

    // Check file size
    if (videoFile.size > MAX_VIDEO_SIZE) {
      console.error('❌ File too large:', videoFile.size)
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_VIDEO_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Check file type
    if (!ALLOWED_VIDEO_TYPES.includes(videoFile.type)) {
      console.error('❌ Invalid file type:', videoFile.type)
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Sanitize video name
    const sanitizedName = sanitizeVideoName(videoName)
    if (!sanitizedName) {
      console.error('❌ Invalid video name')
      return NextResponse.json(
        { error: 'Invalid video name' },
        { status: 400 }
      )
    }

    console.log('✅ Sanitized name:', sanitizedName)

    // Generate secure filename
    const timestamp = Date.now()
    const randomHash = crypto.randomBytes(8).toString('hex')
    const extension = videoFile.type === 'video/webm' ? 'webm' : 
                     videoFile.type === 'video/mp4' ? 'mp4' : 'mkv'
    const safeFileName = `${sanitizedName}_${timestamp}_${randomHash}.${extension}`

    console.log('📝 Safe filename:', safeFileName)

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'recordings')
    await mkdir(uploadDir, { recursive: true })
    console.log('📁 Upload directory ready:', uploadDir)

    // Save file
    const filePath = path.join(uploadDir, safeFileName)
    const bytes = await videoFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(filePath, buffer)
    console.log('💾 File saved to disk:', filePath)

    // Calculate file size in MB
    const fileSizeMB = videoFile.size / (1024 * 1024)

    // Parse detection result safely
    let parsedDetectionResult = null
    if (detectionResult) {
      try {
        parsedDetectionResult = JSON.parse(detectionResult)
        console.log('✅ Detection result parsed:', parsedDetectionResult)
      } catch (error) {
        console.error('⚠️ Failed to parse detection result:', error)
      }
    }

    // Save to database
    const fileUrl = `/recordings/${safeFileName}`
    console.log('💾 Saving to database...', {
      user_id: user.id,
      video_name: sanitizedName,
      file_path: fileUrl,
      file_size_mb: fileSizeMB
    })

    const video = await prisma.video.create({
      data: {
        user_id: user.id,
        video_name: sanitizedName,
        file_path: fileUrl, // FIX: Use file_path instead of file_url
        file_size_mb: fileSizeMB,
        capture_time: new Date(),
        detection_result: parsedDetectionResult
      }
    })

    console.log('✅ Video saved to database:', video.id)

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        video_name: video.video_name,
        file_path: video.file_path
      }
    })

  } catch (error) {
    console.error('❌ Video save error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to save video',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : undefined
      },
      { status: 500 }
    )
  }
}