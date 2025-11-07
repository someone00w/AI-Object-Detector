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
        <p className="text-lg animate-pulse">Loading statistics...</p>
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
    totalUsers,
    totalVideos,
    totalStorageMb,
    totalDetections,
    avgDetectionsPerVideo,
    recentVideos,
  } = stats;

  const avgDetectionsDisplay = Number(avgDetectionsPerVideo ?? 0).toFixed(1);
  const totalStorageDisplay = Number(totalStorageMb ?? 0).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Detection Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Overview of users, videos, and AI detection activity.
            </p>
          </div>

          {/* Right side: dropdown menu */}
          <div className="relative self-start md:self-auto">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-200 shadow-sm shadow-slate-900/50 hover:border-emerald-400/50 hover:text-emerald-300 transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              Navigation
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
                    // ⬇️ change "/menu" to your actual menu route
                    router.push("/pages/menu");
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

        {/* Top stat cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={totalUsers}
            helper="Registered accounts"
          />
          <StatCard
            label="Total Videos"
            value={totalVideos}
            helper="Captured / uploaded"
          />
          <StatCard
            label="Total Detections"
            value={totalDetections}
            helper="Objects detected"
          />
          <StatCard
            label="Avg Detections / Video"
            value={avgDetectionsDisplay}
            helper="Detection intensity"
          />
        </section>

        {/* Storage card */}
        <section className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <div className="col-span-1">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-slate-900/40">
              <h2 className="text-sm font-medium text-slate-200 mb-2">
                Storage Usage
              </h2>
              <p className="text-3xl font-semibold">
                {totalStorageDisplay}{" "}
                <span className="text-sm text-slate-400">MB</span>
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Sum of all video file sizes stored in the system.
              </p>
              <div className="mt-4 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-lime-300"
                  style={{
                    width: `${
                      Math.max(
                        8,
                        Math.min(100, (Number(totalStorageMb) / 5000) * 100)
                      ) // purely visual
                    }%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Progress bar is visual only — tune it to real limits later.
              </p>
            </div>
          </div>
        </section>

        {/* Recent videos table */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-slate-900/40">
          <h2 className="text-sm font-medium text-slate-200 mb-1">
            Recent Videos
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Latest captured videos with metadata.
          </p>
          {recentVideos.length === 0 ? (
            <p className="text-sm text-slate-400">
              No videos have been captured yet.
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
        <p className="text-2xl font-semibold">{value}</p>
      </div>
      {helper && (
        <p className="text-[11px] text-slate-500 mt-2">{helper}</p>
      )}
    </div>
  );
}
