// src/app/statistics/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
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
        <p className="text-lg animate-pulse">Loading your stats...</p>
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
    totalUsers, // still available if you ever want a system-wide note
    totalVideos,
    totalStorageMb,
    totalDetections,
    avgDetectionsPerVideo,
    recentVideos,
  } = stats;

  const avgDetectionsDisplay = Number(avgDetectionsPerVideo ?? 0).toFixed(1);
  const totalStorageDisplay = Number(totalStorageMb ?? 0).toFixed(2);

  // Light “gamification” / summary text
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/40 px-3 py-1 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              <span className="text-[11px] uppercase tracking-[0.16em] text-emerald-300">
                Your Detection Stats
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Personal Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-lg">
              A private overview of your own videos and object detection
              activity. No other users&apos; data is shown here.
            </p>
          </div>

          {/* Right side: dropdown menu */}
          <div className="relative self-start md:self-auto">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-200 shadow-sm shadow-slate-900/50 hover:border-emerald-400/60 hover:text-emerald-300 transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              Menu
              <svg
                className={`h-3 w-3 transition-transform ${
                  menuOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-800 bg-slate-950/95 shadow-xl shadow-black/60 backdrop-blur-sm z-20">
                <button
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-900/80 hover:text-emerald-300 rounded-t-xl transition-colors"
                  onClick={() => {
                    setMenuOpen(false);
                    // ⬇️ change "/menu" to your actual main menu route
                    router.push("/menu");
                  }}
                >
                  ⬅ Back to main menu
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-[11px] text-slate-400 hover:bg-slate-900/80 rounded-b-xl transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Quick summary row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col gap-1">
            <span className="text-slate-500 uppercase tracking-[0.16em] text-[10px]">
              Activity Level
            </span>
            <span className="text-sm font-medium text-slate-100">
              {activityLevel}
            </span>
            <span className="text-[11px] text-slate-500">
              Based on how many videos you&apos;ve captured.
            </span>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col gap-1">
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
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col gap-1">
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

        {/* Top stat cards (user-focused) */}
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

        {/* Storage card (bigger visual) */}
        <section className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <div className="col-span-1">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-slate-900/40">
              <h2 className="text-sm font-medium text-slate-200 mb-2">
                Storage Usage (You)
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
                  className="h-full bg-gradient-to-r from-emerald-400 to-lime-300"
                  style={{
                    width: `${
                      Math.max(
                        8,
                        Math.min(100, (Number(totalStorageMb) / 5000) * 100)
                      ) // purely visual; adjust divisor later if you want real limits
                    }%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                This bar is just a visual indicator. You can wire it to real
                quotas later if needed.
              </p>
            </div>
          </div>
        </section>

        {/* Recent videos table (your videos only) */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-slate-900/40">
          <h2 className="text-sm font-medium text-slate-200 mb-1">
            Your Recent Videos
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            A timeline of your latest captured or uploaded videos.
          </p>
          {recentVideos.length === 0 ? (
            <p className="text-sm text-slate-400">
              You haven&apos;t captured any videos yet. Go run a detection!
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
      </div>
    </div>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md shadow-slate-900/40 hover:border-emerald-400/40 hover:shadow-emerald-500/10 transition-all">
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-1">
          {label}
        </p>
        <p className="text-2xl font-semibold break-words">{value}</p>
      </div>
      {helper && (
        <p className="text-[11px] text-slate-500 mt-2">{helper}</p>
      )}
    </div>
  );
}
