import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/jwt";

export async function GET(request) {
  try {
    // Verify authentication to get current user
    const token = request.cookies.get('token')?.value
    let currentUserId = null
    
    if (token) {
      const user = verifyToken(token)
      if (user) {
        currentUserId = user.id
      }
    }

    // Basic counts (keep global for now as per your request)
    const [totalUsers, totalVideos, storageAgg] = await Promise.all([
      prisma.user.count(),
      prisma.video.count(),
      prisma.video.aggregate({
        _sum: { file_size_mb: true },
      }),
    ]);

    // Get recent videos for CURRENT USER ONLY
    const recentVideos = currentUserId 
      ? await prisma.video.findMany({
          where: {
            user_id: currentUserId
          },
          orderBy: { capture_time: "desc" },
          take: 5,
          select: {
            id: true,
            video_name: true,
            capture_time: true,
            file_size_mb: true,
          },
        })
      : [];

    // Prisma Decimal → JS number
    const totalStorageMb = storageAgg._sum.file_size_mb
      ? Number(storageAgg._sum.file_size_mb)
      : 0;

    // Fetch videos with detection_result to compute detection-based stats
    const videosWithDetections = await prisma.video.findMany({
      select: {
        id: true,
        detection_result: true,
        capture_time: true,
      },
    });

    let totalDetections = 0;
    const labelCounts = {};

    for (const video of videosWithDetections) {
      const det = video.detection_result;

      if (!det) continue;

      const detectionsArray = Array.isArray(det)
        ? det
        : Array.isArray(det?.detections)
        ? det.detections
        : [];

      totalDetections += detectionsArray.length;

      for (const d of detectionsArray) {
        const label = d.label || d.class || "unknown";
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      }
    }

    const avgDetectionsPerVideo =
      totalVideos > 0 ? totalDetections / totalVideos : 0;

    const topLabels = Object.entries(labelCounts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      totalUsers,
      totalVideos,
      totalStorageMb,
      totalDetections,
      avgDetectionsPerVideo,
      topLabels,
      recentVideos,
    });
  } catch (err) {
    console.error("Error in /api/stats:", err);
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 }
    );
  }
}