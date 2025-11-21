"use client";

import Link from "next/link";
import React from "react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b,#020617_80%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(16,185,129,0.1),rgba(56,189,248,0.1))]" />
      <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[60px_60px]" />
      <div className="absolute top-[8%] left-[10%] w-[300px] h-[300px] bg-emerald-400/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] bg-cyan-400/10 rounded-full blur-[160px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8">
        {/* Header */}
        <header className="w-full flex items-center justify-between max-w-7xl mx-auto mb-16 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_18px_rgba(16,185,129,0.6)]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[12px] uppercase tracking-[0.22em] text-slate-400">
              DiddyWatch
            </span>
          </div>
          <span className="hidden sm:inline text-[12px] text-slate-500">
            Real-time AI Detection • Powered by TensorFlow
          </span>
        </header>

        {/* Hero Section */}
        <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center justify-between gap-16">
          {/* Left Text */}
          <div className="flex-1 text-left space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/40 px-4 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              <span className="text-[13px] uppercase tracking-[0.18em] text-emerald-300">
                Advanced Object Detection
              </span>
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold leading-[1.15] tracking-tight drop-shadow-[0_0_18px_rgba(56,189,248,0.25)]">
              Welcome to{" "}
              <span className="bg-linear-to-r from-emerald-400 via-cyan-300 to-sky-500 bg-clip-text text-transparent">
                DiddyWatch
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl">
              Real-time AI video analysis and intelligent object tracking.
              Detect, monitor, and protect — all with the precision of DiddyWatch.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:items-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-linear-to-r from-emerald-400 via-cyan-400 to-sky-500 px-10 py-4 text-lg font-semibold text-slate-950 shadow-[0_0_40px_rgba(45,212,191,0.55)] hover:shadow-[0_0_55px_rgba(56,189,248,0.8)] hover:-translate-y-[3px] active:translate-y-0 transition-all"
              >
                🚀 Start Detection
              </Link>
              <span className="text-[13px] text-slate-500 sm:ml-2">
                Secure login required • Your data stays private
              </span>
            </div>
          </div>

          {/* Right Card */}
          <div className="flex-1 w-full max-w-md bg-slate-950/70 border border-slate-800 rounded-3xl p-10 shadow-[0_0_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-slate-200 tracking-tight">
              System Snapshot
            </h2>
            <div className="space-y-4 text-[15px]">
              <StatRow label="Status" value="Online" pillColor="bg-emerald-400" />
              <StatRow label="Detection Model" value="TensorFlow YOLOv8" />
              <StatRow label="Latency" value="~120ms" />
              <StatRow label="Mode" value="Real-time Webcam" />
            </div>
            <div className="mt-8 border-t border-slate-800 pt-5">
              <p className="text-[13px] text-slate-400 mb-3">
                Once you log in, you can:
              </p>
              <ul className="text-[13px] text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Capture live video streams
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Detect and classify objects instantly
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  View analytics and stats
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-base text-slate-500 opacity-70">
          <p>© {new Date().getFullYear()} DiddyWatch — Made with ❤️ and TensorFlow</p>
        </footer>
      </div>
    </main>
  );
}

function StatRow({ label, value, pillColor }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        {pillColor && (
          <span
            className={`h-2 w-2 rounded-full ${pillColor} shadow-[0_0_6px_rgba(52,211,153,0.8)]`}
          />
        )}
        <span className="text-slate-200 font-medium">{value}</span>
      </div>
    </div>
  );
}
