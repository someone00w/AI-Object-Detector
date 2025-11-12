"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-green-400 border-opacity-80 mb-4" />
          <p className="text-lg animate-pulse">Loading your stats...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-red-400">{error || "No stats available"}</p>
      </div>
    );
  }

  const {
    totalVideos,
    totalStorageMb,
    totalDetections,
    avgDetectionsPerVideo,
    recentVideos,
  } = stats;

  const avgDetectionsDisplay = Number(avgDetectionsPerVideo ?? 0).toFixed(1);
  const totalStorageDisplay = Number(totalStorageMb ?? 0).toFixed(2);

  const activityLevel =
    totalVideos === 0
      ? "Inactive"
      : totalVideos < 5
      ? "Getting started"
      : totalVideos < 15
      ? "Active user"
      : "Power user";

  const detectionDensity =
    avgDetectionsPerVideo === 0
      ? "No detections yet"
      : avgDetectionsPerVideo < 10
      ? "Low object density"
      : avgDetectionsPerVideo < 30
      ? "Moderate object density"
      : "High object density";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b,#020617_80%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(16,185,129,0.12),rgba(56,189,248,0.12))]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[60px_60px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 py-6">
        {/* Header */}
        <header className="w-full max-w-6xl mx-auto flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-xl bg-green-500/10 border border-green-400/40 flex items-center justify-center shadow-[0_0_14px_rgba(34,197,94,0.7)]">
              <span className="h-2 w-2 rounded-full bg-green-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Your Statistics
              </span>
              <span className="text-xs text-slate-500">
                Personal Detection Analytics
              </span>
            </div>
          </div>

          <Link href="/pages/menu">
            <motion.button
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.97, y: 0 }}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-[11px] sm:text-xs text-slate-200 hover:border-green-400/60 hover:text-green-300 transition-all"
            >
              <span className="text-lg leading-none">←</span>
              <span>Back to menu</span>
            </motion.button>
          </Link>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-6xl mx-auto space-y-6">
          {/* Summary Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col gap-1 shadow-lg shadow-slate-900/40">
              <span className="text-slate-500 uppercase tracking-[0.16em] text-[10px]">
                Activity Level
              </span>
              <span className="text-sm font-medium text-slate-100">
                {activityLevel}
              </span>
              <span className="text-[11px] text-slate-500">
                Based on how many videos you've captured.
              </span>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col gap-1 shadow-lg shadow-slate-900/40">
              <span className="text-slate-500 uppercase tracking-[0.16em] text-[10px]">
                Detection Density
              </span>
              <span className="text-sm font-medium text-slate-100">
                {detectionDensity}
              </span>
              <span className="text-[11px] text-slate-500">
                Calculated from your average detections per video.
              </span>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col gap-1 shadow-lg shadow-slate-900/40">
              <span className="text-slate-500 uppercase tracking-[0.16em] text-[10px]">
                Privacy
              </span>
              <span className="text-sm font-medium text-slate-100">
                You-only statistics
              </span>
              <span className="text-[11px] text-slate-500">
                This page only reflects your own uploads and detections.
              </span>
            </div>
          </section>

          {/* Stat Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Your Videos"
              value={totalVideos}
              helper="Videos you have captured or uploaded."
            />
            <StatCard
              label="Your Detections"
              value={totalDetections}
              helper="Total objects detected across your videos."
            />
            <StatCard
              label="Avg Detections / Video"
              value={avgDetectionsDisplay}
              helper="How crowded your scenes usually are."
            />
            <StatCard
              label="Your Storage Usage"
              value={`${totalStorageDisplay} MB`}
              helper="Approximate size of your stored videos."
            />
          </section>

          {/* Storage Card */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-slate-900/40 backdrop-blur-xl">
            <h2 className="text-sm font-medium text-slate-200 mb-2">
              Storage Usage
            </h2>
            <p className="text-3xl font-semibold">
              {totalStorageDisplay}{" "}
              <span className="text-sm text-slate-400">MB</span>
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Total size of the videos you have stored in the system.
            </p>
            <div className="mt-4 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-green-400 to-teal-300"
                style={{
                  width: `${Math.max(
                    8,
                    Math.min(100, (Number(totalStorageMb) / 5000) * 100)
                  )}%`,
                }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Visual indicator of storage usage.
            </p>
          </section>

          {/* Recent Videos */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-slate-900/40 backdrop-blur-xl">
            <h2 className="text-sm font-medium text-slate-200 mb-1">
              Your Recent Videos
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              A timeline of your latest captured or uploaded videos.
            </p>
            {recentVideos.length === 0 ? (
              <p className="text-sm text-slate-400">
                You haven't captured any videos yet. Go run a detection!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs border-b border-slate-800">
                      <th className="py-2 text-left font-medium">Name</th>
                      <th className="py-2 text-left font-medium">
                        Capture Time
                      </th>
                      <th className="py-2 text-left font-medium">
                        Size (MB)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentVideos.map((v) => (
                      <tr
                        key={v.id}
                        className="border-b border-slate-900/80 last:border-0 hover:bg-slate-900/70 transition-colors"
                      >
                        <td className="py-2 pr-4">{v.video_name}</td>
                        <td className="py-2 pr-4 text-slate-400">
                          {new Date(v.capture_time).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4 text-slate-400">
                          {v.file_size_mb != null
                            ? Number(v.file_size_mb).toFixed(2)
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md shadow-slate-900/40 hover:border-green-400/40 hover:shadow-green-500/10 transition-all backdrop-blur-xl">
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-1">
          {label}
        </p>
        <p className="text-2xl font-semibold wrap-break-word">{value}</p>
      </div>
      {helper && (
        <p className="text-[11px] text-slate-500 mt-2">{helper}</p>
      )}
    </div>
  );
}