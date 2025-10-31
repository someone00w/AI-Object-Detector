"use client";

import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { load as cocoSSDLoad } from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import { renderPredictions } from "@/utils/render-predictions";
import { motion } from "framer-motion";

let detectInterval;

const Detectioncuh = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [cooldownTime, setCooldownTime] = useState(0); // cooldown countdown

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Recording flags and trackers
  const isRecordingRef = useRef(false);
  const cooldownRef = useRef(false);
  const currentDetectionsRef = useRef([]);
  const lastPersonSeenRef = useRef(null);
  const noPersonTimeoutRef = useRef(null);
  const recorderRef = useRef(null);

  useEffect(() => {
    runCoco();
    return () => clearInterval(detectInterval);
  }, []);

  async function runCoco() {
    setIsLoading(true);
    const net = await cocoSSDLoad();
    setIsLoading(false);

    detectInterval = setInterval(() => {
      runObjectDetection(net);
    }, 200);
  }

  async function runObjectDetection(net) {
    if (
      canvasRef.current &&
      webcamRef.current !== null &&
      webcamRef.current.video?.readyState === 4
    ) {
      const video = webcamRef.current.video;
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
      }

      if (isRecordingRef.current) {
        if (personDetected) {
          lastPersonSeenRef.current = Date.now();
          if (noPersonTimeoutRef.current) {
            clearTimeout(noPersonTimeoutRef.current);
            noPersonTimeoutRef.current = null;
          }
        } else {
          if (!noPersonTimeoutRef.current) {
            noPersonTimeoutRef.current = setTimeout(() => {
              stopRecording();
            }, 3000);
          }
        }
      }
    }
  }

  function startRecording(net) {
    isRecordingRef.current = true;
    lastPersonSeenRef.current = Date.now();
    console.log("🎥 Recording started WITH BOUNDING BOXES!");

    const video = webcamRef.current.video;
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

    // HUD icons
    const icons = {
      person: "👤",
      dog: "🐶",
      cat: "🐱",
      car: "🚗",
    };

    const drawFrame = async () => {
      if (!isRecordingRef.current) return;
      recordCtx.clearRect(0, 0, recordCanvas.width, recordCanvas.height);
      recordCtx.drawImage(video, 0, 0, recordCanvas.width, recordCanvas.height);

      try {
        const detectedObjects = await net.detect(video, undefined, 0.6);
        recordCtx.font = "16px sans-serif";
        recordCtx.textBaseline = "top";

        detectedObjects.forEach((prediction) => {
          const [x, y, width, height] = prediction.bbox;
          const isPerson = prediction.class === "person";

          // Bounding box
          recordCtx.strokeStyle = isPerson ? "#FF0000" : "#00FFFF";
          recordCtx.lineWidth = 4;
          recordCtx.strokeRect(x, y, width, height);

          // Fill inside box
          recordCtx.fillStyle = `rgba(255, 0, 0, ${isPerson ? 0.2 : 0})`;
          recordCtx.fillRect(x, y, width, height);

          // Label with icon + confidence
          const icon = icons[prediction.class] || "";
          const label = `${icon} ${prediction.class} ${(prediction.score * 100).toFixed(1)}%`;
          const textWidth = recordCtx.measureText(label).width;
          const textHeight = 16;

          // Label background
          recordCtx.fillStyle = isPerson ? "#FF0000" : "#00FFFF";
          recordCtx.fillRect(x, y, textWidth + 6, textHeight + 6);

          // Label text
          recordCtx.fillStyle = "#000000";
          recordCtx.fillText(label, x + 3, y + 3);

          // Confidence bar below box
          const barWidth = width * prediction.score;
          const barHeight = 4;
          recordCtx.fillStyle = isPerson ? "#FF5555" : "#55FFFF";
          recordCtx.fillRect(x, y + height + 2, barWidth, barHeight);
        });
      } catch (error) {
        console.error("Detection error during recording:", error);
      }

      requestAnimationFrame(drawFrame);
    };

    drawFrame();

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      const now = new Date();
      const dateString = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(
        now.getHours()
      ).padStart(2, "0")};${String(now.getMinutes()).padStart(2, "0")};${String(
        now.getSeconds()
      ).padStart(2, "0")}`;

      const a = document.createElement("a");
      a.href = url;
      a.download = `person_detected_${dateString}.webm`;
      a.click();
      URL.revokeObjectURL(url);

      // Cooldown logic with countdown
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
      recorderRef.current = null;
      if (noPersonTimeoutRef.current) {
        clearTimeout(noPersonTimeoutRef.current);
        noPersonTimeoutRef.current = null;
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-gray-900 via-black to-slate-950 p-8">
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-600 drop-shadow-md">
        AI Object Detection
      </h1>

      {isLoading ? (
        <motion.div
          className="flex flex-col items-center justify-center text-center text-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-400 border-opacity-70 mb-4"></div>
          <p className="text-xl font-semibold text-cyan-300 animate-pulse">
            Loading AI Model...
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="relative flex justify-center items-center border border-cyan-500/40 rounded-2xl p-2 shadow-[0_0_25px_rgba(0,255,255,0.2)] hover:shadow-[0_0_45px_rgba(0,255,255,0.4)] transition-all duration-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Webcam
            ref={webcamRef}
            className="rounded-xl w-full lg:h-[720px] object-cover"
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 z-50 rounded-xl w-full lg:h-[720px]"
          />
        </motion.div>
      )}

      {cooldownTime > 0 && (
        <div className="text-red-500 font-semibold mt-4">
          Cooldown: {cooldownTime}s
        </div>
      )}
    </div>
  );
};

export default Detectioncuh;
