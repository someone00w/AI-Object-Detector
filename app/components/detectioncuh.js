"use client";
 
import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { load as cocoSSDLoad } from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import { renderPredictions } from "@/utils/render-predictions";
import { motion } from "framer-motion";
import Link from "next/link";
import SettingsPanel from "@/app/components/SettingsPanel";
 
let detectInterval;
 
const IOU_THRESHOLD = 0.3;
const TRACK_STALE_MS = 1000;
 
function iou(a, b) {
  const [ax, ay, aw, ah] = a;
  const [bx, by, bw, bh] = b;
  const xA = Math.max(ax, bx);
  const yA = Math.max(ay, by);
  const xB = Math.min(ax + aw, bx + bw);
  const yB = Math.min(ay + ah, by + bh);
  const inter = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const areaA = aw * ah;
  const areaB = bw * bh;
  const union = areaA + areaB - inter;
  return union > 0 ? inter / union : 0;
}
 
const Detectioncuh = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [noPersonStopTime, setNoPersonStopTime] = useState(5);
  const [webcamReady, setWebcamReady] = useState(false);
 
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const isRecordingRef = useRef(false);
  const emailCooldownRef = useRef(false);
  const currentDetectionsRef = useRef([]);
  const lastPersonSeenRef = useRef(null);
  const noPersonTimeoutRef = useRef(null);
  const recorderRef = useRef(null);
  const recordingStatsRef = useRef(null);
 
  // Fetch user session on mount
  useEffect(() => {
    console.log('🔍 Debug - loadingUser:', loadingUser, 'webcamReady:', webcamReady);
    console.log('🔍 Debug - loadingUser:', loadingUser, 'webcamReady:', webcamReady);
    fetchUserSession();
    fetchNoPersonStopTime();
  }, []);
 
  // Fetch noPersonStopTime from API
  const fetchNoPersonStopTime = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setNoPersonStopTime(data.settings.noPersonStopTime);
          console.log('⚙️ Stop time loaded:', data.settings.noPersonStopTime);
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };
 
  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChanged = (event) => {
      if (event.detail.noPersonStopTime) {
        setNoPersonStopTime(event.detail.noPersonStopTime);
        console.log('⚙️ Stop time updated:', event.detail.noPersonStopTime);
      }
    };
 
    window.addEventListener('settingsChanged', handleSettingsChanged);
   
    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChanged);
    };
  }, []);
 
  // Start AI model when webcam is ready AND user session is loaded
  useEffect(() => {
    console.log('🔍 Debug - Checking if should start AI:', { webcamReady, loadingUser });
    console.log('🔍 Debug - Checking if should start AI:', { webcamReady, loadingUser });
    if (webcamReady && !loadingUser) {
      console.log('✅ Starting AI model - Webcam ready and user session loaded');
      runCoco();
    }
    return () => {
      if (detectInterval) clearInterval(detectInterval);
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webcamReady, loadingUser]);
 
  // Webcam ready handler
  const handleWebcamReady = (stream) => {
    console.log('📹 onUserMedia fired - Webcam is ready', stream);
  const handleWebcamReady = (stream) => {
    console.log('📹 onUserMedia fired - Webcam is ready', stream);
    setWebcamReady(true);
  };
 
  // Handle webcam errors
  const handleWebcamError = (error) => {
    console.error('❌ Webcam error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
  };
 
  // Additional check: Monitor webcam ref changes
  useEffect(() => {
    console.log('🎥 Starting webcam polling...');
    let pollCount = 0;
   
    const checkWebcam = setInterval(() => {
      pollCount++;
      console.log(`🎥 Poll #${pollCount} - webcamRef.current exists:`, !!webcamRef.current);
     
      if (webcamRef.current?.video) {
        const video = webcamRef.current.video;
        console.log('🎥 Webcam state:', {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          paused: video.paused,
          srcObject: !!video.srcObject
        });
       
        if (video.readyState === 4 && video.videoWidth > 0 && !webcamReady) {
          console.log('📹 Webcam detected as ready via polling');
          setWebcamReady(true);
          clearInterval(checkWebcam);
        }
      } else {
        console.log('⏳ Waiting for webcam ref...');
      }
    }, 1000);
 
    // Cleanup after 15 seconds
    const timeout = setTimeout(() => {
      console.log('⚠️ Webcam polling timeout after 15 seconds');
      clearInterval(checkWebcam);
    }, 15000);
   
    return () => {
      clearInterval(checkWebcam);
      clearTimeout(timeout);
    };
  }, [webcamReady]);
 
  // Fetch logged-in user's email from session
  const fetchUserSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUserEmail(data?.user?.email || null);
        console.log('✅ User session loaded:', data?.user?.email);
      } else {
        console.warn('⚠️ Not authenticated - notifications will be disabled');
        setUserEmail(null);
      }
    } catch (error) {
      console.error('❌ Failed to fetch user session:', error);
      setUserEmail(null);
    } finally {
      // FIX: Always set loadingUser to false
      setLoadingUser(false);
    }
  };
 
  // Send email notification to all enabled recipients
  const sendEmailNotification = async () => {
    if (!userEmail) {
      console.warn('⚠️ Skipping email - user not authenticated');
      return;
    }
 
    try {
      // Fetch all enabled email recipients for this user
      const response = await fetch('/api/settings/email-recipients/emails');
      if (!response.ok) {
        console.error('Failed to fetch email recipients');
        return;
      }
 
      const data = await response.json();
      const recipients = data.recipients.filter(r => r.enabled);
 
      if (recipients.length === 0) {
        console.warn('⚠️ No enabled email recipients found');
        return;
      }
 
      console.log(`📧 Sending alerts to ${recipients.length} recipient(s)`);
     
      // Send email to all recipients
      for (const recipient of recipients) {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: recipient.email,
            subject: "🚨 Person detected by your AI camera",
            text: `Your AI detection system just detected a person at ${new Date().toLocaleString()}.`,
          }),
        });
       
        const data = await res.json();
        if (data.success) {
          console.log(`✅ Email sent successfully to ${recipient.email}`);
        } else {
          console.error(`❌ Email failed for ${recipient.email}:`, data.error);
        }
      }
    } catch (err) {
      console.error("❌ Email error:", err);
    }
  };
 
  async function runCoco() {
    console.log('🔍 runCoco called');
    console.log('🔍 runCoco called');
    setIsLoading(true);
    try {
      console.log('🔍 Waiting for TensorFlow...');
      console.log('🔍 Waiting for TensorFlow...');
      await tf.ready();
      console.log('🧠 TensorFlow ready');
     
      console.log('🔍 Loading COCO-SSD model...');
      const net = await cocoSSDLoad();
      console.log('✅ COCO-SSD model loaded');
     
      setIsLoading(false);
 
      detectInterval = setInterval(() => {
        runObjectDetection(net);
      }, 200);
    } catch (error) {
      console.error('❌ Model loading failed:', error);
      setIsLoading(false);
    }
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
 
    if (personDetected && !isRecordingRef.current) {
      startRecording(net);
 
      // Only send email if user is authenticated
      if (userEmail && !emailCooldownRef.current) {
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
        }, noPersonStopTime * 1000);
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
        const ts = performance.now();
        const detectedObjects = currentDetectionsRef.current || [];
 
        const stats = recordingStatsRef.current;
        if (stats) {
          let personNow = false;
          let bestScore = 0;
          for (const obj of detectedObjects) {
            stats.classesSeen.add(obj.class);
            const cnt = stats.perClassCounts.get(obj.class) || 0;
            stats.perClassCounts.set(obj.class, cnt + 1);
            if (obj.class === "person") {
              personNow = true;
              if (obj.score > bestScore) bestScore = obj.score;
            }
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
            for (const detIdx of personDetIdxs) {
              const det = detectedObjects[detIdx];
              const score = iou(t.bbox, det.bbox);
              if (score > bestIou) { bestIou = score; bestIdx = detIdx; }
            }
            if (bestIdx >= 0 && bestIou >= IOU_THRESHOLD) {
              matches.push({ track: t, detIdx: bestIdx });
            }
          }
 
          const unmatchedDets = personDetIdxs.filter(
            idx => !matches.some(m => m.detIdx === idx)
          );
 
          for (const m of matches) {
            const det = detectedObjects[m.detIdx];
            m.track.bbox = det.bbox;
            m.track.lastSeen = tsNow;
          }
 
          for (const detIdx of unmatchedDets) {
            const det = detectedObjects[detIdx];
            const newTrack = { id: tr.nextId++, bbox: det.bbox, lastSeen: tsNow };
            tr.tracks.set(newTrack.id, newTrack);
            tr.seenIds.add(newTrack.id);
          }
 
          for (const [id, t] of tr.tracks.entries()) {
            if (tsNow - t.lastSeen > TRACK_STALE_MS) tr.tracks.delete(id);
          }
        }
 
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
 
          recordCtx.fillStyle = isPerson ? "rgba(255,0,0,0.2)" : "rgba(0,255,255,0)";
          recordCtx.fillRect(x, y, width, height);
 
          const icon = icons[prediction.class] || "❓";
          const label = isPerson && trackId !== null
            ? `${icon} ${prediction.class} (ID: ${trackId}) ${Math.round(prediction.score * 100)}%`
            : `${icon} ${prediction.class} ${Math.round(prediction.score * 100)}%`;
 
          const textWidth = recordCtx.measureText(label).width;
          const textX = x;
          const textY = y > 30 ? y - 28 : y + height + 4;
 
          recordCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
          recordCtx.fillRect(textX, textY, textWidth + 8, 24);
 
          recordCtx.fillStyle = isPerson ? "#FF0000" : "#00FFFF";
          recordCtx.fillText(label, textX + 4, textY + 4);
        });
      } catch (err) {
        console.error("Frame draw error:", err);
      }
 
      requestAnimationFrame(drawFrame);
    };
 
    drawFrame();
    recorder.start();
    console.log("🔴 Recording started");
 
    recorder.onstop = async () => {
      console.log("🛑 Recording stopped");
      const blob = new Blob(chunks, { type: "video/webm" });
 
      const finalizeStats = () => {
        const stats = recordingStatsRef.current;
        if (!stats) return {};
 
        const stoppedAt = performance.now();
        const totalDurationMs = stoppedAt - stats.startedAt;
 
        const personEpisodes = stats.person.episodes.map(ep => {
          const s = ep.start - stats.startedAt;
          const e = ep.end ? ep.end - stats.startedAt : totalDurationMs;
          return { startMs: Math.round(s), endMs: Math.round(e) };
        });
 
        let totalPersonDurationMs = 0;
        for (const ep of stats.person.episodes) {
          const e = ep.end || stoppedAt;
          const dur = e - ep.start;
          if (dur > 0) totalPersonDurationMs += dur;
        }
 
        const classes = Array.from(stats.classesSeen);
        const perClass = {};
        for (const [cls, count] of stats.perClassCounts.entries()) {
          perClass[cls] = count;
        }
 
        const tracksSummary = {};
        const seenIdArr = Array.from(stats.tracking.seenIds);
        for (const id of seenIdArr) {
          tracksSummary[`track_${id}`] = { id };
        }
        const uniquePersons = seenIdArr.length;
 
        return {
          totalDurationMs: Math.round(totalDurationMs),
          uniquePersons,
          person: {
            episodes: personEpisodes,
            totalDurationMs: Math.round(totalPersonDurationMs),
            maxScoreSeen: stats.person.maxScore
          },
          classesSeen: classes,
          perClassFrameCounts: perClass,
          tracks: tracksSummary,
          totalDetections: uniquePersons
        };
      };
 
      const detectionSummary = finalizeStats();
 
      const formData = new FormData();
      formData.append("video", blob, "recording.webm");
      formData.append("videoName", `person_detected_${new Date().toISOString().replace(/[:.]/g, '-')}`);
      formData.append("videoName", `person_detected_${new Date().toISOString().replace(/[:.]/g, '-')}`);
      formData.append("detectionResult", JSON.stringify(detectionSummary));
 
      console.log("📤 Uploading video...", {
        blobSize: blob.size,
        detectionSummary
      });
 
      try {
        const response = await fetch("/api/videos/save", {
          method: "POST",
          body: formData,
        });
 
        console.log("📡 Upload response status:", response.status);
 
        if (response.ok) {
          const data = await response.json();
          console.log("✅ Video saved successfully:", data);
          alert("Recording saved successfully!");
          console.log("✅ Video saved successfully:", data);
          alert("Recording saved successfully!");
        } else {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { error: "Failed to parse error response", status: response.status };
          }
          console.error("❌ Failed to save video:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          alert(`Failed to save recording: ${errorData.error || 'Unknown error'}`);
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { error: "Failed to parse error response", status: response.status };
          }
          console.error("❌ Failed to save video:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          alert(`Failed to save recording: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error("❌ Upload error:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack
        });
        alert(`Upload failed: ${error.message}`);
        console.error("❌ Upload error:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack
        });
        alert(`Upload failed: ${error.message}`);
      }
    };
  }
 
  function stopRecording() {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    setIsRecording(false);
 
    if (noPersonTimeoutRef.current) {
      clearTimeout(noPersonTimeoutRef.current);
      noPersonTimeoutRef.current = null;
    }
 
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
      console.log("⏹️ Stopping recording...");
    }
 
    recorderRef.current = null;
  }
 
  // Show loading only while user session loads
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-emerald-400 border-opacity-80 mb-4" />
          <div className="text-white text-xl">Loading session...</div>
          <div className="text-white text-xl">Loading session...</div>
          <p className="text-slate-400 text-sm mt-2">This may take a moment...</p>
        </div>
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
 
            <SettingsPanel />
          </div>
        </header>
 
        <main className="w-full max-w-6xl mx-auto flex-1 flex flex-col lg:flex-row gap-8 items-stretch justify-center">
          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-center">
              AI Object Detection
            </h1>
           
            <motion.div className="relative flex justify-center items-center border border-slate-800 rounded-2xl p-2 shadow-[0_0_35px_rgba(15,23,42,0.9)] bg-slate-950/80 backdrop-blur-xl w-full h-full">
              <Webcam
                ref={webcamRef}
                className="rounded-xl w-full max-h-[480px] object-cover"
                muted
                autoPlay
                playsInline
                onUserMedia={handleWebcamReady}
                onUserMediaError={handleWebcamError}
                videoConstraints={{
                  facingMode: "user",
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                }}
                screenshotFormat="image/jpeg"
                onUserMediaError={handleWebcamError}
                videoConstraints={{
                  facingMode: "user",
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                }}
                screenshotFormat="image/jpeg"
              />
              <canvas ref={canvasRef} className="absolute top-0 left-0 right-0 bottom-0 rounded-xl pointer-events-none" />
             
              {/* AI Model Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-400 border-opacity-80 mb-3" />
                    <div className="text-white text-lg">Loading AI Model...</div>
                    <p className="text-slate-400 text-xs mt-1">Please wait...</p>
                  </div>
                </div>
              )}
            </motion.div>
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
                    {userEmail || 'Not authenticated'}
                  </span>
                </div>
              </div>
 
              <div className="border-t border-slate-800 pt-4">
                <h3 className="text-xs font-medium text-slate-300 mb-2">
                  Auto Recording
                </h3>
                <p className="text-xs text-slate-400 mb-2">How it works:</p>
                <ul className="space-y-1.5 text-[11px] text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Auto starts recording when a person is detected.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    Stops if no person seen for {noPersonStopTime} second{noPersonStopTime !== 1 ? 's' : ''}.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    Saves clip to your recordings page.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                    Tracks unique people per clip.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-300" />
                    Alerts sent to all configured recipients.
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