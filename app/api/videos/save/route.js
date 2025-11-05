import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/jwt'
import { prisma } from '@/app/lib/prisma'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request) {
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

    // 2. Get form data with video file
    const formData = await request.formData()
    const videoFile = formData.get('video')
    const detectionResult = formData.get('detectionResult') // JSON string of detections
    
    if (!videoFile) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      )
    }

    // 3. Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `person_detected_${user.username || user.id}_${timestamp}.webm`
    
    // 4. Save file to public/recordings directory
    const bytes = await videoFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(process.cwd(), 'public', 'recordings', fileName)
    await writeFile(filePath, buffer)

    // 5. Calculate file size in MB
    const fileSizeMB = (buffer.length / (1024 * 1024)).toFixed(2)

    // 6. Save video record to database
    const video = await prisma.video.create({
      data: {
        user_id: user.id,
        video_name: fileName,
        file_path: `/recordings/${fileName}`,
        capture_time: new Date(),
        file_size_mb: parseFloat(fileSizeMB),
        detection_result: detectionResult ? JSON.parse(detectionResult) : null
      }
    })

    return NextResponse.json(
      { 
        message: 'Video saved successfully',
        video 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Save video error:', error)
    return NextResponse.json(
      { error: 'Failed to save video' },
      { status: 500 }
    )
  }
}