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
    let currentUser = null;

    if (token) {
      try {
        currentUser = verifyToken(token);
      } catch (err) {
        console.warn("Invalid token in heatmap route:", err?.message);
      }
    }

    if (!currentUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const isAdmin = currentUser.role === 1;

    // 3) Build where clause
    const whereClause = {
      ...(isAdmin ? {} : { user_id: currentUser.id }),
      ...timeFilter,
    };

    // 4) Fetch videos for this window
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
      
      // Parse JSON string if needed
      if (typeof det === "string") {
        try {
          det = JSON.parse(det);
        } catch (err) {
          det = null;
        }
      }

      // Extract totalDetections from your specific format
      let count = 0;
      
      if (det && typeof det === "object") {
        // Your format has totalDetections at top level
        if (typeof det.totalDetections === "number") {
          count = det.totalDetections;
        }
        // Fallback: if uniquePersons exists, use that
        else if (typeof det.uniquePersons === "number") {
          count = det.uniquePersons;
        }
      }

      // Only add to heatmap if there were detections
      if (count > 0) {
        heatmapData.push({
          timestamp: video.capture_time.toISOString(),
          value: count,
        });
      }
    }

    console.log(`✅ Heatmap: ${heatmapData.length} data points`);

    return NextResponse.json({
      success: true,
      data: heatmapData,
      range,
      isAdmin,
    });
  } catch (error) {
    console.error("❌ Heatmap error:", error);
    return NextResponse.json(
      { success: false, error: "Heatmap fetch failed" },
      { status: 500 }
    );
  }
}