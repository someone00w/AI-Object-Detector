"use client";

import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { load as cocoSSDLoad } from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import { renderPredictions } from "@/utils/render-predictions";
import { motion } from "framer-motion";
import Link from "next/link";

let detectInterval;

const Detectioncuh = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Recording flags and trackers
  const isRecordingRef = useRef(false);
  const cooldownRef = useRef(false);
  const emailCooldownRef = useRef(false); // Email cooldown
  const currentDetectionsRef = useRef([]);
  const lastPersonSeenRef = useRef(null);
  const noPersonTimeoutRef = useRef(null);
  const recorderRef = useRef(null);

  // 👇 CHANGE THIS EMAIL to where you want alerts sent
  const ALERT_EMAIL = "shafirizeini@gmail.com";

  useEffect(() => {
    runCoco();
    return () => {
      if (detectInterval) clearInterval(detectInterval);
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Email notification helper
  const sendEmailNotification = async () => {
    try {
      console.log("📧 Sending alert email to:", ALERT_EMAIL);

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: ALERT_EMAIL,
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

    // ✅ Fix: skip if video size is 0
    if (!video.videoWidth || !video.videoHeight) return;

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detectedObjects = await net.detect(video, undefined, 0.6);
    currentDetectionsRef.current = detectedObjects;

    const context = canvas.getContext("2d");
    renderPredictions(detectedObjects, context);

    const personDetected = detectedObjects.some(
      (obj) => obj.class === "person"
    );

    if (personDetected && !isRecordingRef.current && !cooldownRef.current) {
      startRecording(net);

      if (!emailCooldownRef.current) {
        emailCooldownRef.current = true;
        sendEmailNotification();

        // Email cooldown (15s)
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
        }, 3000);
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
        recordCtx.font = "16px system-ui, sans-serif";
        recordCtx.textBaseline = "top";

        detectedObjects.forEach((prediction) => {
          const [x, y, width, height] = prediction.bbox;
          const isPerson = prediction.class === "person";

          recordCtx.strokeStyle = isPerson ? "#FF0000" : "#00FFFF";
          recordCtx.lineWidth = 4;
          recordCtx.strokeRect(x, y, width, height);

          recordCtx.fillStyle = `rgba(255, 0, 0, ${isPerson ? 0.2 : 0})`;
          recordCtx.fillRect(x, y, width, height);

          const icon = icons[prediction.class] || "";
          const label = `${icon} ${prediction.class} ${(prediction.score * 100).toFixed(1)}%`;
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

      const formData = new FormData();
      formData.append("video", blob, "recording.webm");

      const detectionSummary = {
        totalDetections: currentDetectionsRef.current.length,
        objects: currentDetectionsRef.current.map((d) => ({
          class: d.class,
          score: d.score,
        })),
      };
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_80%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(16,185,129,0.12),rgba(56,189,248,0.12))]" />
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] [background-size:60px_60px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 py-6">
        {/* Header */}
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

            {/* Only this header Back to Menu remains */}
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

        {/* Main layout: video + side panel */}
        <main className="w-full max-w-6xl mx-auto flex-1 flex flex-col lg:flex-row gap-8 items-stretch justify-center">
          {/* Video feed */}
          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-center">
              AI Object Detection
            </h1>
            {isLoading ? (
              <motion.div className="flex flex-col items-center justify-center text-center text-slate-200 h-[320px] w-full rounded-2xl border border-slate-800 bg-slate-950/70 backdrop-blur-xl">
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

          {/* Info panel */}
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
                <div className="flex items-center justify-between">
                  <span>Email Alerts</span>
                  <span className="text-slate-200 truncate">{ALERT_EMAIL}</span>
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
