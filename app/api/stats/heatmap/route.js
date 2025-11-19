import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/jwt";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "week";

    console.log(`🔍 Heatmap data for range="${range}"`);

    // 1) Time window
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

    // 2) Current user (if logged in)
    const token = request.cookies.get("token")?.value;
    let currentUserId = null;

    if (token) {
      try {
        const user = verifyToken(token);
        if (user) currentUserId = user.id;
      } catch (err) {
        console.warn("Invalid token in heatmap route:", err?.message);
      }
    }

    const whereClause = {
      ...(currentUserId ? { user_id: currentUserId } : {}),
      ...timeFilter,
    };

    // 3) Fetch videos for this window
    const videos = await prisma.video.findMany({
      where: whereClause,
      select: {
        capture_time: true,
        detection_result: true,
      },
      orderBy: { capture_time: "asc" },
    });

    const heatmapData = [];

    for (const video of videos) {
      let det = video.detection_result;

      if (typeof det === "string") {
        try {
          det = JSON.parse(det);
        } catch (err) {
          det = null;
        }
      }

      let count = 0;

      // Try to count detections the same way as stats route
      if (det && typeof det === "object") {
        if (typeof det.totalDetections === "number") {
          count = det.totalDetections;
        } else if (Array.isArray(det.detections)) {
          count = det.detections.length;
        } else if (Array.isArray(det.predictions)) {
          count = det.predictions.length;
        }
      }

      // Fallback: at least 1 if we know there was some detection_result
      if (!count && det) count = 1;

      heatmapData.push({
        timestamp: video.capture_time.toISOString(),
        value: count,
      });
    }

    return NextResponse.json({
      success: true,
      data: heatmapData,
      range,
    });
  } catch (error) {
    console.error("❌ Heatmap error:", error);
    return NextResponse.json(
      { success: false, error: "Heatmap fetch failed" },
      { status: 500 }
    );
  }
}
