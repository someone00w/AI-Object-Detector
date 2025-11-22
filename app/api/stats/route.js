import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/jwt";

// Extract detection count and class info from your specific detection_result format
function parseDetectionResult(det) {
  if (!det) return { count: 0, classes: {} };

  // Handle JSON string
  if (typeof det === "string") {
    try {
      det = JSON.parse(det);
    } catch (err) {
      return { count: 0, classes: {} };
    }
  }

  // Your format has totalDetections at the top level
  const count = det.totalDetections || 0;
  
  // Extract class counts from perClassFrameCounts or classesSeen
  const classes = {};
  
  if (det.perClassFrameCounts && typeof det.perClassFrameCounts === 'object') {
    // Use frame counts as detection counts (more accurate)
    Object.entries(det.perClassFrameCounts).forEach(([className, frameCount]) => {
      classes[className] = Math.ceil(frameCount / 30); // Approximate detections from frames (assuming 30fps)
    });
  } else if (det.classesSeen && Array.isArray(det.classesSeen)) {
    // Fallback: distribute totalDetections among classes
    const numClasses = det.classesSeen.length;
    det.classesSeen.forEach(className => {
      classes[className] = Math.ceil(count / numClasses);
    });
  } else if (count > 0) {
    // If we have detections but no class info, use "Unknown"
    classes["Unknown"] = count;
  }

  return { count, classes };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "week";

    // --- 1) Time window from range ---
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
        from = null;
        break;
    }

    const timeFilter = from ? { capture_time: { gte: from } } : {};

    // --- 2) Current user from JWT ---
    const token = request.cookies.get("token")?.value;
    let currentUser = null;

    if (token) {
      try {
        currentUser = verifyToken(token);
      } catch (err) {
        console.warn("Invalid token in stats route:", err?.message);
      }
    }

    if (!currentUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const isAdmin = currentUser.role === 1;

    // --- 3) Build where clause based on role ---
    const userFilter = isAdmin ? {} : { user_id: currentUser.id };

    // --- 4) Global basics (respecting user filter) ---
    const [totalUsers, totalVideos, storageAgg] = await Promise.all([
      isAdmin ? prisma.user.count() : Promise.resolve(1),
      prisma.video.count({
        where: {
          ...userFilter,
          ...timeFilter,
        },
      }),
      prisma.video.aggregate({
        _sum: { file_size_mb: true },
        where: {
          ...userFilter,
          ...timeFilter,
        },
      }),
    ]);

    const totalStorageMb = storageAgg._sum.file_size_mb
      ? Number(storageAgg._sum.file_size_mb)
      : 0;

    // --- 5) Recent videos ---
    const recentVideos = await prisma.video.findMany({
      where: {
        ...userFilter,
        ...timeFilter,
      },
      orderBy: { capture_time: "desc" },
      take: 6,
      select: {
        id: true,
        video_name: true,
        capture_time: true,
        file_size_mb: true,
      },
    });

    // --- 6) Detection counts + labels for selected range ---
    const videosWithDetections = await prisma.video.findMany({
      where: {
        ...userFilter,
        ...timeFilter,
      },
      select: {
        id: true,
        detection_result: true,
      },
    });

    let totalDetections = 0;
    const labelCounts = {};
    let videosWithDetectionData = 0;

    for (const video of videosWithDetections) {
      const { count, classes } = parseDetectionResult(video.detection_result);
      
      if (count > 0) {
        totalDetections += count;
        videosWithDetectionData++;
        
        // Aggregate class counts
        Object.entries(classes).forEach(([className, classCount]) => {
          labelCounts[className] = (labelCounts[className] || 0) + classCount;
        });
      }
    }

    const avgDetectionsPerVideo = videosWithDetectionData > 0 
      ? totalDetections / videosWithDetectionData 
      : 0;

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
      range,
      isAdmin,
    });
  } catch (err) {
    console.error("Error in stats route:", err);
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 }
    );
  }
}