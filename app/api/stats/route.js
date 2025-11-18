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
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "week";

    // --- 1) Compute time window based on range ---
    const now = new Date();
    let from = null;

    switch (range) {
      case "24h":
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "week":
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        from = null; // no lower bound
        break;
    }

    const timeFilter = from ? { capture_time: { gte: from } } : {};

    // --- 2) Get current user from token (if available) ---
    const token = request.cookies.get("token")?.value;
    let currentUserId = null;

    if (token) {
      const user = verifyToken(token);
      if (user) {
        currentUserId = user.id;
      }
    }

    // --- 3) Global counts (respecting time filter for videos) ---
    const [totalUsers, totalVideosGlobal, storageAggGlobal] = await Promise.all([
      prisma.user.count(),
      prisma.video.count({
        where: {
          ...timeFilter,
        },
      }),
      prisma.video.aggregate({
        _sum: { file_size_mb: true },
        where: {
          ...timeFilter,
        },
      }),
    ]);

    const totalStorageMbGlobal = storageAggGlobal._sum.file_size_mb
      ? Number(storageAggGlobal._sum.file_size_mb)
      : 0;

    // --- 4) Per-user video count + storage + recent videos (within range) ---
    let userVideoCount = 0;
    let userStorageMb = 0;
    let recentVideos = [];

    if (currentUserId) {
      const [userVideoCountRes, userStorageAgg, recentVideosRes] = await Promise.all([
        prisma.video.count({
          where: {
            user_id: currentUserId,
            ...timeFilter,
          },
        }),
        prisma.video.aggregate({
          _sum: { file_size_mb: true },
          where: {
            user_id: currentUserId,
            ...timeFilter,
          },
        }),
        prisma.video.findMany({
          where: {
            user_id: currentUserId,
            ...timeFilter,
          },
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

    // --- 5) Fetch videos with detection_result within range (user if available, else global) ---
    const videosWithDetections = await prisma.video.findMany({
      where: {
        ...(currentUserId ? { user_id: currentUserId } : {}),
        ...timeFilter,
      },
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

    const denom = userVideoCount > 0 ? userVideoCount : totalVideosGlobal;
    const avgDetectionsPerVideo = denom > 0 ? totalDetections / denom : 0;

    const topLabels = Object.entries(labelCounts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      totalUsers,
      totalVideos: userVideoCount || totalVideosGlobal,
      totalStorageMb: userStorageMb || totalStorageMbGlobal,
      totalDetections,
      avgDetectionsPerVideo,
      topLabels,
      recentVideos,
      range,
    });
  } catch (err) {
    console.error("Error in stats route:", err);
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 }
    );
  }
}
