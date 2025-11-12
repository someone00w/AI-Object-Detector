import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/jwt";

// Helper: try to normalise detection_result into an array of detections
function extractDetections(det) {
  if (!det) return [];

  // If it's already an array of objects
  if (Array.isArray(det)) {
    if (det.length && typeof det[0] === "object") return det;
    return [];
  }

  // If it's an object that contains arrays (detections, predictions, etc.)
  if (typeof det === "object") {
    // Common keys
    if (Array.isArray(det.detections) && det.detections.length) {
      return det.detections;
    }
    if (Array.isArray(det.predictions) && det.predictions.length) {
      return det.predictions;
    }

    // Fallback: pick any array-of-objects inside the object
    for (const key of Object.keys(det)) {
      const val = det[key];
      if (Array.isArray(val) && val.length && typeof val[0] === "object") {
        return val;
      }
    }
  }

  return [];
}

export async function GET(request) {
  try {
    // 1) Get current user from token (if available)
    const token = request.cookies.get("token")?.value;
    let currentUserId = null;

    if (token) {
      const user = verifyToken(token);
      if (user) {
        currentUserId = user.id;
      }
    }

    // 2) Global counts (you already had this)
    const [totalUsers, totalVideosGlobal, storageAggGlobal] = await Promise.all([
      prisma.user.count(),
      prisma.video.count(),
      prisma.video.aggregate({
        _sum: { file_size_mb: true },
      }),
    ]);

    const totalStorageMbGlobal = storageAggGlobal._sum.file_size_mb
      ? Number(storageAggGlobal._sum.file_size_mb)
      : 0;

    // 3) Per-user video count + storage + recent videos
    let userVideoCount = 0;
    let userStorageMb = 0;
    let recentVideos = [];

    if (currentUserId) {
      const [userVideoCountRes, userStorageAgg, recentVideosRes] = await Promise.all([
        prisma.video.count({
          where: { user_id: currentUserId },
        }),
        prisma.video.aggregate({
          _sum: { file_size_mb: true },
          where: { user_id: currentUserId },
        }),
        prisma.video.findMany({
          where: { user_id: currentUserId },
          orderBy: { capture_time: "desc" },
          take: 5,
          select: {
            id: true,
            video_name: true,
            capture_time: true,
            file_size_mb: true,
          },
        }),
      ]);

      userVideoCount = userVideoCountRes;
      userStorageMb = userStorageAgg._sum.file_size_mb
        ? Number(userStorageAgg._sum.file_size_mb)
        : 0;
      recentVideos = recentVideosRes;
    }

    // 4) Fetch videos with detection_result.
    //    Prefer current user's videos; if no user, fall back to ALL videos.
    const videosWithDetections = await prisma.video.findMany({
      where: currentUserId ? { user_id: currentUserId } : undefined,
      select: {
        id: true,
        detection_result: true,
      },
    });

    let totalDetections = 0;
    const labelCounts = {};

    for (const video of videosWithDetections) {
      let det = video.detection_result;
      if (!det) continue;

      // If stored as string, parse it
      if (typeof det === "string") {
        try {
          det = JSON.parse(det);
        } catch (e) {
          console.warn(
            "Failed to parse detection_result JSON for video",
            video.id,
            "value:",
            video.detection_result
          );
          continue;
        }
      }

      const detectionsArray = extractDetections(det);
      if (!detectionsArray.length) continue;

      totalDetections += detectionsArray.length;

      for (const d of detectionsArray) {
        const label = d.label || d.class || d.name || "unknown";
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      }
    }

    // Use the user's video count for average; fall back to global if 0
    const denom = userVideoCount > 0 ? userVideoCount : totalVideosGlobal;
    const avgDetectionsPerVideo = denom > 0 ? totalDetections / denom : 0;

    const topLabels = Object.entries(labelCounts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 5) Return what your frontend expects
    return NextResponse.json({
      // these are used in your StatisticsPage
      totalUsers,
      totalVideos: userVideoCount || totalVideosGlobal, // "Your Videos" card
      totalStorageMb: userStorageMb || totalStorageMbGlobal, // "Your Storage" card
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
