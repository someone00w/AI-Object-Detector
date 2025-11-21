import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/jwt";

export async function GET(request) {
  try {
    // ---- Get current user from token cookie ----
    const token = request.cookies.get("token")?.value;
    const currentUser = token ? verifyToken(token) : null;
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = currentUser.id;
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000); // last 24h

    // Determine if user is admin
    const isAdmin = currentUser.role === 1;

    // Build where clause based on role
    // Admin sees all videos, regular users see only their own
    const whereClause24h = {
      capture_time: {
        gte: since,
        lte: now,
      },
      ...(isAdmin ? {} : { user_id: userId }),
    };

    // ---- Videos in last 24h ----
    const videos24h = await prisma.video.findMany({
      where: whereClause24h,
      orderBy: { capture_time: "desc" },
    });

    const totalVideos24h = videos24h.length;
    let totalDetections24h = 0;
    let lastDetectionAt = null;

    // Process detection results from each video
    for (const v of videos24h) {
      let result = v.detection_result;
      
      // Detection_result might be JSON string or object
      if (typeof result === "string") {
        try {
          result = JSON.parse(result);
        } catch (e) {
          result = null;
        }
      }

      // Try different possible shapes of detection_result
      const detectionsCount =
        result?.totalDetections ??
        result?.total_detections ??
        (Array.isArray(result?.detections) ? result.detections.length : 0) ??
        0;

      totalDetections24h += detectionsCount;

      // Get last detection time from JSON or fall back to capture_time
      let candidateTime = null;
      if (result?.lastDetectionTime || result?.last_detection_time) {
        candidateTime = new Date(
          result.lastDetectionTime || result.last_detection_time
        );
      } else if (v.capture_time) {
        candidateTime = v.capture_time;
      }

      if (candidateTime) {
        if (!lastDetectionAt || candidateTime > lastDetectionAt) {
          lastDetectionAt = candidateTime;
        }
      }
    }

    // ---- Last recorded video (overall, not just 24h) ----
    const lastVideo = await prisma.video.findFirst({
      where: isAdmin ? {} : { user_id: userId },
      orderBy: { capture_time: "desc" },
    });

    // Build video URL (use env var if available, otherwise use file_path as-is)
    const baseUrl = process.env.NEXT_PUBLIC_VIDEO_BASE_URL || "";
    const lastVideoPayload = lastVideo
      ? {
          id: lastVideo.id,
          video_name: lastVideo.video_name,
          capture_time: lastVideo.capture_time,
          file_url: baseUrl
            ? `${baseUrl}${lastVideo.file_path}`
            : lastVideo.file_path,
        }
      : null;

    return NextResponse.json({
      stats24h: {
        totalDetections: totalDetections24h,
        totalVideos: totalVideos24h,
        lastDetectionAt: lastDetectionAt ? lastDetectionAt.toISOString() : null,
      },
      lastVideo: lastVideoPayload,
      isAdmin, // Include so frontend knows if data is user-specific or global
    });
  } catch (err) {
    console.error("menu-stats error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}