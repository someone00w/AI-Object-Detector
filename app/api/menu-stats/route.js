import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/jwt";

export async function GET(request) {
  try {
    // --- auth: who is this user? ---
    const token = request.cookies.get("token")?.value;
    const user = token ? verifyToken(token) : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // ---- videos in last 24h for this user ----
    const videos24h = await prisma.video.findMany({
      where: {
        user_id: userId,
        capture_time: {
          gte: since,
          lte: now,
        },
      },
      orderBy: { capture_time: "desc" },
    });

    const totalVideos24h = videos24h.length;

    // compute total detections + lastDetectionAt from detection_result JSON
    let totalDetections24h = 0;
    let lastDetectionAt = null;

    for (const v of videos24h) {
      let result = v.detection_result;

      if (typeof result === "string") {
        try {
          result = JSON.parse(result);
        } catch {
          result = null;
        }
      }

      const detectionsCount =
        result?.totalDetections ??
        result?.total_detections ??
        (Array.isArray(result?.detections) ? result.detections.length : 0) ??
        0;

      totalDetections24h += detectionsCount;

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

    // ---- last recorded video for this user (overall) ----
    const lastVideo = await prisma.video.findFirst({
      where: { user_id: userId },
      orderBy: { capture_time: "desc" },
    });

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
    });
  } catch (err) {
    console.error("menu-stats error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
