import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/jwt";

export async function GET(request) {
  try {
    console.log("🔍 Fetching ALL heatmap data (no range filter)...");

    // get user
    const token = request.cookies.get("token")?.value;
    let currentUserId = null;

    if (token) {
      const user = verifyToken(token);
      if (user) currentUserId = user.id;
    }

    const whereClause = currentUserId ? { user_id: currentUserId } : {};

    const videos = await prisma.video.findMany({
      where: whereClause,
      select: {
        capture_time: true,
        detection_result: true,
      },
      orderBy: { capture_time: "asc" },
    });

    const heatmapData = [];

    videos.forEach((video) => {
      let detectionCount = 0;
      let det = video.detection_result;

      if (typeof det === "string") {
        try {
          det = JSON.parse(det);
        } catch (e) {}
      }

      if (det) {
        if (typeof det.totalDetections === "number") detectionCount = det.totalDetections;
        else if (Array.isArray(det.detections)) detectionCount = det.detections.length;
        else if (typeof det.detections === "number") detectionCount = det.detections;
        else if (typeof det.total_detections === "number") detectionCount = det.total_detections;
      }

      heatmapData.push({
        timestamp: video.capture_time.toISOString(),
        value: detectionCount,
      });
    });

    return NextResponse.json({
      success: true,
      data: heatmapData, // ALWAYS full history
    });
  } catch (error) {
    console.error("❌ Heatmap error:", error);
    return NextResponse.json(
      { success: false, error: "Heatmap fetch failed" },
      { status: 500 }
    );
  }
}
