import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/jwt'

export async function GET(request) {
  try {
    console.log('🔍 Fetching heatmap data...')
    
    // Get current user from token
    const token = request.cookies.get('token')?.value
    let currentUserId = null

    if (token) {
      const user = verifyToken(token)
      if (user) {
        currentUserId = user.id
        console.log('✅ User authenticated:', currentUserId)
      }
    } else {
      console.log('⚠️ No token found')
    }

    // Fetch videos for the current user (or all if no user)
    const whereClause = currentUserId ? { user_id: currentUserId } : {}
    
    console.log('📊 Fetching videos with clause:', whereClause)
    
    const videos = await prisma.video.findMany({
      where: whereClause,
      select: {
        capture_time: true,
        detection_result: true
      },
      orderBy: {
        capture_time: 'asc'
      }
    })

    console.log(`📹 Found ${videos.length} videos`)

    // Process videos into heatmap data with timestamps
    const heatmapData = []

    videos.forEach(video => {
      // Get detection count from video
      let detectionCount = 0
      if (video.detection_result) {
        let det = video.detection_result
        
        // Parse if it's stored as string
        if (typeof det === 'string') {
          try {
            det = JSON.parse(det)
          } catch (e) {
            console.warn('Failed to parse detection_result:', e)
          }
        }
        
        // Extract detection count
        detectionCount = det?.totalDetections || det?.detections || det?.total_detections || 0
      }

      // Add all entries (even with 0 detections for debugging)
      heatmapData.push({
        timestamp: video.capture_time.toISOString(),
        value: detectionCount
      })
    })

    console.log(`✅ Processed ${heatmapData.length} heatmap entries`)

    return NextResponse.json({
      success: true,
      data: heatmapData
    })

  } catch (error) {
    console.error('❌ Error fetching heatmap data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch heatmap data', details: error.message },
      { status: 500 }
    )
  }
}