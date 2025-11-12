"use client";

import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { load as cocoSSDLoad } from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import { renderPredictions } from "@/utils/render-predictions";
import { motion } from "framer-motion";
import Link from "next/link";

let detectInterval;

const IOU_THRESHOLD = 0.3;     // match threshold for same person
const TRACK_STALE_MS = 1000;   // drop track if unseen for > 1s
const NO_PERSON_STOP_MS = 3000; // stop recording after 3s of no person

function iou(a, b) {
  // a, b: [x, y, w, h]
  const ax2 = a[0] + a[2], ay2 = a[1] + a[3];
  const bx2 = b[0] + b[2], by2 = b[1] + b[3];
  const x1 = Math.max(a[0], b[0]);
  const y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(ax2, bx2);
  const y2 = Math.min(ay2, by2);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = a[2] * a[3];
  const areaB = b[2] * b[3];
  const union = areaA + areaB - inter;
  return union > 0 ? inter / union : 0;
}

const Detectioncuh = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Recording flags and trackers
  const isRecordingRef = useRef(false);
  const cooldownRef = useRef(false);
  const emailCooldownRef = useRef(false);
  const currentDetectionsRef = useRef([]);
  const lastPersonSeenRef = useRef(null);
  const noPersonTimeoutRef = useRef(null);
  const recorderRef = useRef(null);

  // Aggregated per-recording stats (episodes + tracking)
  const recordingStatsRef = useRef(null);
  /*
    {
      startedAt, lastFrameTs,
      classesSeen: Set<string>,
      perClassCounts: Map<class, frames>,
      person: {
        present: boolean,
        episodes: [{start,end?}],
        totalMs: number,
        maxScore: number
      },
      tracking: {
        nextId: number,
        tracks: Map<id, { id, bbox, lastSeenTs, firstSeenTs, maxScore }>,
        seenIds: Set<number>
      }
    }
  */

  // Get user session on component mount
  useEffect(() => {
    fetchUserSession();
  }, []);

  useEffect(() => {
    if (userEmail) {
      runCoco();
    }
    return () => {
      if (detectInterval) clearInterval(detectInterval);
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  // Fetch logged-in user's email from session
  const fetchUserSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUserEmail(data?.user?.email || null);
        console.log('📧 Alerts will be sent to:', data?.user?.email);
      } else {
        console.error('No user session found');
      }
    } catch (error) {
      console.error('Failed to fetch user session:', error);
    } finally {
      setLoadingUser(false);
    }
  };

  // Email notification helper
  const sendEmailNotification = async () => {
    if (!userEmail) {
      console.log('⚠️ No user email available, skipping notification');
      return;
    }
    try {
      console.log("📧 Sending alert email to:", userEmail);
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userEmail,
          subject: "🚨 Person detected by your AI camera",
          text: `Your AI detection system just detected a person at ${new Date().toLocaleString()}.`,
        }),
      });
      const data = await res.json();
      if (data.success) console.log("✅ Email sent successfully!");
      else console.error("❌ Email failed:", data.error);
    } catch (err) {
      console.error("❌ Email error:", err);
    }
  };

  async function runCoco() {
    setIsLoading(true);
    await tf.ready();
    const net = await cocoSSDLoad();
    setIsLoading(false);

    detectInterval = setInterval(() => {
      runObjectDetection(net);
    }, 200);
  }

  async function runObjectDetection(net) {
    if (
      !canvasRef.current ||
      !webcamRef.current ||
      !webcamRef.current.video ||
      webcamRef.current.video.readyState !== 4
    ) {
      return;
    }

    const video = webcamRef.current.video;
    if (!video.videoWidth || !video.videoHeight) return;

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detectedObjects = await net.detect(video, undefined, 0.6);
    currentDetectionsRef.current = detectedObjects;

    const context = canvas.getContext("2d");
    renderPredictions(detectedObjects, context);

    const personDetected = detectedObjects.some((obj) => obj.class === "person");

    if (personDetected && !isRecordingRef.current && !cooldownRef.current) {
      startRecording(net);

      if (!emailCooldownRef.current) {
        emailCooldownRef.current = true;
        sendEmailNotification();
        setTimeout(() => {
          emailCooldownRef.current = false;
        }, 15000);
      }
    }

    if (isRecordingRef.current) {
      if (personDetected) {
        lastPersonSeenRef.current = Date.now();
        if (noPersonTimeoutRef.current) {
          clearTimeout(noPersonTimeoutRef.current);
          noPersonTimeoutRef.current = null;
        }
      } else if (!noPersonTimeoutRef.current) {
        noPersonTimeoutRef.current = setTimeout(() => {
          stopRecording();
        }, NO_PERSON_STOP_MS);
      }
    }
  }

  function startRecording(net) {
    if (!webcamRef.current || !webcamRef.current.video) return;

    const video = webcamRef.current.video;
    if (!video.videoWidth || !video.videoHeight) return;

    isRecordingRef.current = true;
    setIsRecording(true);
    lastPersonSeenRef.current = Date.now();

    // Initialize per-recording stats
    const now = performance.now();
    recordingStatsRef.current = {
      startedAt: now,
      lastFrameTs: now,
      classesSeen: new Set(),
      perClassCounts: new Map(),
      person: {
        present: false,
        episodes: [],
        totalMs: 0,
        maxScore: 0
      },
      tracking: {
        nextId: 1,
        tracks: new Map(),
        seenIds: new Set()
      }
    };

    const recordCanvas = document.createElement("canvas");
    recordCanvas.width = video.videoWidth;
    recordCanvas.height = video.videoHeight;
    const recordCtx = recordCanvas.getContext("2d");

    const stream = recordCanvas.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 2500000,
    });
    const chunks = [];
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const icons = { person: "👤", dog: "🐶", cat: "🐱", car: "🚗" };

    const drawFrame = async () => {
      if (!isRecordingRef.current) return;
      if (!video.videoWidth || !video.videoHeight) {
        requestAnimationFrame(drawFrame);
        return;
      }

      recordCtx.clearRect(0, 0, recordCanvas.width, recordCanvas.height);
      recordCtx.drawImage(video, 0, 0, recordCanvas.width, recordCanvas.height);

      try {
        const detectedObjects = await net.detect(video, undefined, 0.6);

        // ====== STATS AGGREGATION (episodes + per-class) ======
        const ts = performance.now();
        const stats = recordingStatsRef.current;
        if (stats) {
          const classesThisFrame = new Set(detectedObjects.map(o => o.class));
          classesThisFrame.forEach(c => stats.classesSeen.add(c));
          detectedObjects.forEach(o => {
            stats.perClassCounts.set(o.class, (stats.perClassCounts.get(o.class) || 0) + 1);
          });

          const personObjs = detectedObjects.filter(o => o.class === "person");
          const personNow = personObjs.length > 0;
          const bestScore = personObjs.reduce((m, o) => Math.max(m, o.score || 0), 0);
          const dt = Math.max(0, ts - stats.lastFrameTs);

          if (stats.person.present) {
            stats.person.totalMs += dt;
          }
          if (personNow && !stats.person.present) {
            stats.person.present = true;
            stats.person.episodes.push({ start: ts });
          } else if (!personNow && stats.person.present) {
            stats.person.present = false;
            const ep = stats.person.episodes[stats.person.episodes.length - 1];
            if (ep && !ep.end) ep.end = ts;
          }
          if (bestScore > stats.person.maxScore) stats.person.maxScore = bestScore;
          stats.lastFrameTs = ts;
        }

        // ====== LIGHTWEIGHT MULTI-PERSON TRACKING ======
        if (recordingStatsRef.current) {
          const tr = recordingStatsRef.current.tracking;
          const tsNow = performance.now();

          const tracksArr = Array.from(tr.tracks.values());
          const personDetIdxs = [];
          detectedObjects.forEach((o, idx) => { if (o.class === "person") personDetIdxs.push(idx); });

          const matches = [];
          for (const t of tracksArr) {
            let bestIdx = -1;
            let bestIou = 0;
            for (const idx of personDetIdxs) {
              const det = detectedObjects[idx];
              const i = iou(t.bbox, det.bbox);
              if (i > bestIou) {
                bestIou = i;
                bestIdx = idx;
              }
            }
            if (bestIdx >= 0 && bestIou >= IOU_THRESHOLD) {
              matches.push({ trackId: t.id, detIdx: bestIdx, iou: bestIou });
            }
          }

          const chosenDet = new Set();
          const chosenTrack = new Set();
          const finalMatches = [];
          matches
            .sort((a, b) => b.iou - a.iou)
            .forEach(m => {
              if (!chosenDet.has(m.detIdx) && !chosenTrack.has(m.trackId)) {
                chosenDet.add(m.detIdx);
                chosenTrack.add(m.trackId);
                finalMatches.push(m);
              }
            });

          finalMatches.forEach(({ trackId, detIdx }) => {
            const det = detectedObjects[detIdx];
            const t = tr.tracks.get(trackId);
            if (t) {
              t.bbox = det.bbox;
              t.lastSeenTs = tsNow;
              t.maxScore = Math.max(t.maxScore, det.score || 0);
              tr.tracks.set(trackId, t);
            }
          });

          personDetIdxs
            .filter(idx => !chosenDet.has(idx))
            .forEach(idx => {
              const det = detectedObjects[idx];
              const id = tr.nextId++;
              tr.tracks.set(id, {
                id,
                bbox: det.bbox,
                lastSeenTs: tsNow,
                firstSeenTs: tsNow,
                maxScore: det.score || 0
              });
              tr.seenIds.add(id);
            });

          for (const [id, t] of tr.tracks) {
            if (tsNow - t.lastSeenTs > TRACK_STALE_MS) {
              tr.tracks.delete(id);
            }
          }
        }

        // ====== DRAW OVERLAYS ======
        recordCtx.font = "16px system-ui, sans-serif";
        recordCtx.textBaseline = "top";

        const tracksNow = recordingStatsRef.current?.tracking?.tracks || new Map();
        const findTrackIdForBbox = (bbox) => {
          let bestId = null, best = 0;
          for (const t of tracksNow.values()) {
            const i = iou(t.bbox, bbox);
            if (i > best) { best = i; bestId = t.id; }
          }
          return (best >= IOU_THRESHOLD) ? bestId : null;
        };

        detectedObjects.forEach((prediction) => {
          const [x, y, width, height] = prediction.bbox;
          const isPerson = prediction.class === "person";
          const trackId = isPerson ? findTrackIdForBbox(prediction.bbox) : null;

          recordCtx.strokeStyle = isPerson ? "#FF0000" : "#00FFFF";
          recordCtx.lineWidth = 4;
          recordCtx.strokeRect(x, y, width, height);

          recordCtx.fillStyle = `rgba(255, 0, 0, ${isPerson ? 0.2 : 0})`;
          recordCtx.fillRect(x, y, width, height);

          const icon = icons[prediction.class] || "";
          const extra = isPerson && trackId ? ` #${trackId}` : "";
          const label = `${icon} ${prediction.class}${extra} ${(prediction.score * 100).toFixed(1)}%`;
          const textWidth = recordCtx.measureText(label).width;

          recordCtx.fillStyle = isPerson ? "#FF0000" : "#00FFFF";
          recordCtx.fillRect(x, y, textWidth + 6, 20);

          recordCtx.fillStyle = "#000";
          recordCtx.fillText(label, x + 3, y + 3);

          recordCtx.fillStyle = isPerson ? "#FF5555" : "#55FFFF";
          recordCtx.fillRect(x, y + height + 2, width * prediction.score, 4);
        });
      } catch (error) {
        console.error("Detection error during recording:", error);
      }

      requestAnimationFrame(drawFrame);
    };

    drawFrame();

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "video/webm" });

      // ---- FINALIZE STATS ----
      const finalizeStats = () => {
  const stats = recordingStatsRef.current;
  if (!stats) {
    return {
      totalDetections: currentDetectionsRef.current.length,
      objects: currentDetectionsRef.current.map(d => ({ class: d.class, score: d.score }))
    };
  }

  if (stats.person.present) {
    const last = stats.person.episodes[stats.person.episodes.length - 1];
    if (last && !last.end) last.end = performance.now();
    stats.person.present = false;
  }

  const personEpisodes = stats.person.episodes
    .map(ep => ({
      start: ep.start,
      end: ep.end ?? ep.start,
      durationMs: Math.max(0, (ep.end ?? ep.start) - ep.start)
    }))
    .filter(ep => ep.durationMs >= 120);

  const totalPersonDurationMs = personEpisodes.reduce((a, b) => a + b.durationMs, 0);
  const classes = Array.from(stats.classesSeen);
  const perClass = Array.from(stats.perClassCounts.entries()).map(([k, v]) => ({ class: k, frames: v }));

  const tr = stats.tracking;
  const uniquePersons = tr.seenIds.size;
  const tracksSummary = Array.from(tr.tracks.values()).map(t => ({
    id: t.id,
    firstSeenMs: t.firstSeenTs - stats.startedAt,
    lastSeenMs: t.lastSeenTs - stats.startedAt,
    maxScore: t.maxScore
  }));

  return {
    // Changed: use uniquePersons instead of personEpisodes.length
    totalDetections: uniquePersons,
    uniquePersons,
    person: {
      episodes: personEpisodes,
      totalDurationMs: totalPersonDurationMs,
      maxScoreSeen: stats.person.maxScore
    },
    classesSeen: classes,
    perClassFrameCounts: perClass,
    tracks: tracksSummary
  };
};

      const detectionSummary = finalizeStats();

      const formData = new FormData();
      formData.append("video", blob, "recording.webm");
      formData.append("detectionResult", JSON.stringify(detectionSummary));

      try {
        const response = await fetch("/api/videos/save", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Video saved:", data.video);
          alert("Recording saved successfully!");
        } else {
          const errorData = await response.json();
          console.error("❌ Failed to save:", errorData);
          alert(`Failed: ${errorData.error || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Error uploading video");
      }

      cooldownRef.current = true;
      let remaining = 15;
      setCooldownTime(remaining);
      const cooldownInterval = setInterval(() => {
        remaining -= 1;
        setCooldownTime(remaining);
        if (remaining <= 0) {
          clearInterval(cooldownInterval);
          cooldownRef.current = false;
          setCooldownTime(0);
        }
      }, 1000);
    };

    recorder.start();
  }

  function stopRecording() {
    if (recorderRef.current && isRecordingRef.current) {
      recorderRef.current.stop();
      isRecordingRef.current = false;
      setIsRecording(false);
      recorderRef.current = null;
      if (noPersonTimeoutRef.current) {
        clearTimeout(noPersonTimeoutRef.current);
        noPersonTimeoutRef.current = null;
      }
    }
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading user session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b,#020617_80%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(16,185,129,0.12),rgba(56,189,248,0.12))]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[60px_60px]" />

      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 py-6">
        <header className="w-full max-w-6xl mx-auto flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-xl bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_14px_rgba(16,185,129,0.7)]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                DiddyWatch
              </span>
              <span className="text-xs text-slate-500">
                Live AI Object Detection
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm">
            {isRecording && (
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/50 bg-red-500/10 px-3 py-1 text-red-200">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                Recording in progress
              </div>
            )}
            {cooldownTime > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/50 bg-yellow-400/10 px-3 py-1 text-yellow-100">
                <span className="h-2 w-2 rounded-full bg-yellow-300" />
                Cooldown: {cooldownTime}s
              </div>
            )}

            <Link href="/pages/menu">
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.97, y: 0 }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-[11px] sm:text-xs text-slate-200 hover:border-emerald-400/60 hover:text-emerald-300 transition-all"
              >
                <span className="text-lg leading-none">←</span>
                <span>Back to menu</span>
              </motion.button>
            </Link>
          </div>
        </header>

        <main className="w-full max-w-6xl mx-auto flex-1 flex flex-col lg:flex-row gap-8 items-stretch justify-center">
          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-center">
              AI Object Detection
            </h1>
            {isLoading ? (
              <motion.div className="flex flex-col items-center justify-center text-center text-slate-200 h-80 w-full rounded-2xl border border-slate-800 bg-slate-950/70 backdrop-blur-xl">
                <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-emerald-400 border-opacity-80 mb-4" />
                <p className="text-lg font-medium text-emerald-300">
                  Loading AI model...
                </p>
                <p className="text-xs text-slate-500 mt-2 max-w-xs">
                  This may take a few seconds the first time as the model is downloaded.
                </p>
              </motion.div>
            ) : (
              <motion.div className="relative flex justify-center items-center border border-slate-800 rounded-2xl p-2 shadow-[0_0_35px_rgba(15,23,42,0.9)] bg-slate-950/80 backdrop-blur-xl w-full h-full">
                <Webcam ref={webcamRef} className="rounded-xl w-full max-h-[480px] object-cover" muted />
                <canvas ref={canvasRef} className="absolute top-0 left-0 right-0 bottom-0 rounded-xl pointer-events-none" />
              </motion.div>
            )}
          </div>

          <aside className="w-full lg:w-[260px] xl:w-[280px] bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-[0_0_35px_rgba(0,0,0,0.7)] backdrop-blur-xl text-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-200">Session Info</h2>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                    <span className="text-emerald-300">Live</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Model</span>
                  <span className="text-slate-200">COCO-SSD (TensorFlow)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Trigger</span>
                  <span className="text-slate-200">Person detected</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span>Email Alerts</span>
                  <span className="text-slate-200 text-[11px] break-all">
                    {userEmail || 'Loading...'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs text-slate-400 mb-2">How it works:</p>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Auto starts recording when a person is detected.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    Stops if no person seen for 3 seconds.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    Saves clip to your recordings page.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    Sends email alert with cooldown.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                    Tracks unique people per clip.
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-4">
              Ensure browser camera permissions are enabled. Use a well-lit area for better accuracy.
            </p>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default Detectioncuh;