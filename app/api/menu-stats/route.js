import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/jwt";

export async function GET(request) {
  try {
    // ---- get current user from token cookie ----
    const token = request.cookies.get("token")?.value;
    let currentUserId = null;

    if (token) {
      const user = verifyToken(token);
      if (user) currentUserId = user.id;
    }

    if (!currentUserId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000); // last 24h

    // ---- videos in last 24h for THIS user ----
    const videos24h = await prisma.video.findMany({
      where: {
        user_id: currentUserId,
        capture_time: {
          gte: since,
          lte: now,
        },
      },
      orderBy: { capture_time: "desc" },
      take: 50,
    });

    let totalVideos24h = videos24h.length;
    let totalDetections24h = 0;
    let lastDetectionAt = null;

    for (const v of videos24h) {
      let result = v.detection_result;

      // detection_result might be JSON string or object
      if (typeof result === "string") {
        try {
          result = JSON.parse(result);
        } catch (e) {
          result = null;
        }
      }

      // try a few common shapes
      const detectionsCount =
        result?.totalDetections ??
        result?.total_detections ??
        (Array.isArray(result?.detections) ? result.detections.length : 0) ??
        0;

      totalDetections24h += detectionsCount;

      // if you store lastDetectionTime in JSON, use it,
      // otherwise fall back to video capture_time as the “activity time”
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

    // ---- last recorded video overall for this user ----
    const lastVideo = await prisma.video.findFirst({
      where: { user_id: currentUserId },
      orderBy: { capture_time: "desc" },
    });

    // If your file_path is already a public URL, you can just use it.
    // Otherwise prepend some base URL from env.
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
        lastDetectionAt: lastDetectionAt
          ? lastDetectionAt.toISOString()
          : null,
      },
      lastVideo: lastVideoPayload,
    });
  } catch (err) {
    console.error("menu-stats error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
