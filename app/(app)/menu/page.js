"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CameraIcon,
  PlayCircleIcon,
  ChartBarIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";

export default function MenuPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const response = await fetch("/api/auth/session");
      if (!response.ok) throw new Error("Not authenticated");
      
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Session check failed:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;

    const fetchOverview = async () => {
      try {
        const res = await fetch("/api/menu-stats");
        if (!res.ok) throw new Error("Failed to load menu stats");
        const data = await res.json();
        setOverview(data);
      } catch (err) {
        console.error("Menu stats error:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchOverview();
  }, [user]);

  const menuItems = [
    {
      title: "AI Object Detection",
      desc: "Run the live camera and start tracking suspicious objects in real-time.",
      href: "/detection",
      color: "from-emerald-400 via-teal-400 to-cyan-400",
      icon: <CameraIcon className="w-6 h-6" />,
      tag: "Live Monitor",
    },
    {
      title: "View Recordings",
      desc: "Review captured clips and revisit previous detection sessions.",
      href: "/recordings",
      color: "from-orange-400 via-pink-500 to-red-500",
      icon: <PlayCircleIcon className="w-6 h-6" />,
      tag: "Archive",
    },
    {
      title: "View Statistics",
      desc: "Dive into charts and heatmaps to understand detection patterns.",
      href: "/statistics",
      color: "from-sky-400 via-blue-500 to-indigo-500",
      icon: <ChartBarIcon className="w-7 h-7" />,
      tag: "Analytics",
    },
  ];

  const adminMenuItems =
    user?.role === 1
      ? [
          {
            title: "Admin Panel",
            desc: "Manage users, roles, and system-level controls.",
            href: "/admin",
            color: "from-purple-500 via-fuchsia-500 to-rose-500",
            icon: <KeyIcon className="w-6 h-6" />,
            tag: "Admin Only",
          },
        ]
      : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="h-4 w-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-300">Loading your control center...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === 1;
  const stats24h = overview?.stats24h;
  const lastVideo = overview?.lastVideo;

  const lastDetectionText = (() => {
    if (!stats24h?.lastDetectionAt) return "No detections in the last 24 hours.";
    const date = new Date(stats24h.lastDetectionAt);
    return `Last detection at ${date.toLocaleTimeString("en-SG", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  })();

  return (
    <div className="w-full px-4 sm:px-6 pb-10 pt-6">
      <div className="w-full max-w-6xl mx-auto space-y-8 lg:space-y-10">
        {/* Welcome line */}
        <section className="mb-1">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-1">
            Welcome back,{" "}
            <span className="bg-linear-to-r from-emerald-300 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
              {user.username}
            </span>
            .
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl">
            Here's a quick snapshot of your system and shortcuts to everything
            you need.
          </p>
        </section>

        {/* Big layout: left (activity + last video), right (stats + quick actions + admin) */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          {/* LEFT COLUMN */}
          <div className="space-y-5">
            {/* Activity Status (big) */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 sm:p-6 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Activity Status
                </h2>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 border border-slate-700 px-3 py-1 text-[11px] text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  System online
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="col-span-2 flex flex-col justify-between">
                  <p className="text-sm text-slate-300 mb-3">
                    {statsLoading
                      ? "Loading activity for the last 24 hours..."
                      : lastDetectionText}
                  </p>

                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                      Live monitor ready
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Alerts configured
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                      Data tracking enabled
                    </div>
                  </div>
                </div>

                {/* Small 24h numbers inside activity card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 flex flex-col justify-between">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-1">
                    Past 24 Hours
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] text-slate-400">
                        Detections
                      </p>
                      <p className="text-xl font-semibold text-emerald-300">
                        {stats24h?.totalDetections ??
                          (statsLoading ? "…" : 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">
                        Videos recorded
                      </p>
                      <p className="text-xl font-semibold text-sky-300">
                        {stats24h?.totalVideos ?? (statsLoading ? "…" : 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Last Recorded Video (big playback) */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 sm:p-6 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Last Recorded Video
                </h2>
                <Link
                  href="/recordings"
                  className="text-[11px] text-slate-400 hover:text-emerald-300 transition-colors"
                >
                  View all recordings →
                </Link>
              </div>

              {!lastVideo && (
                <div className="flex h-40 sm:h-48 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 text-sm text-slate-500">
                  {statsLoading
                    ? "Loading your latest clip..."
                    : "No recordings found yet. Once you save a clip, it will appear here."}
                </div>
              )}

              {lastVideo && (
                <div className="space-y-3">
                  <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-black">
                    <video
                      className="h-full w-full object-cover"
                      src={lastVideo.file_url}
                      controls
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                    <div>
                      <p className="text-slate-200 font-medium">
                        {lastVideo.video_name}
                      </p>
                      <p className="text-slate-500">
                        Captured{" "}
                        {new Date(
                          lastVideo.capture_time
                        ).toLocaleString("en-SG", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Link
                      href="/statistics"
                      className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 border border-slate-700 text-[11px] text-slate-300 hover:border-emerald-400 hover:text-emerald-200 transition-colors"
                    >
                      See statistics for this period →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6 flex flex-col">
            {/* Bigger 24h summary card */}
            <div className="rounded-3xl border border-slate-800 bg-linear-to-r from-slate-900/90 via-slate-900 to-slate-900/90 p-5 sm:p-6 shadow-[0_0_32px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Past 24 Hours Stats
                </p>
                <Link
                  href="/statistics"
                  className="text-[11px] text-sky-300 hover:text-sky-200 transition-colors"
                >
                  Open statistics →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mt-1">
                <div>
                  <p className="text-slate-400 text-[11px] mb-1">
                    Detections
                  </p>
                  <p className="text-2xl font-semibold text-emerald-300 leading-none mb-1">
                    {stats24h?.totalDetections ??
                      (statsLoading ? "…" : 0)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Unique detection events logged.
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px] mb-1">
                    Videos
                  </p>
                  <p className="text-2xl font-semibold text-sky-300 leading-none mb-1">
                    {stats24h?.totalVideos ?? (statsLoading ? "…" : 0)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Clips captured and stored.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick actions – bigger & stacked */}
            <div className="space-y-3 flex-1 flex flex-col">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Quick Actions
              </p>
              <div className="grid gap-4 grid-cols-1 auto-rows-fr">
                {menuItems.map((item, i) => (
                  <Link key={i} href={item.href}>
                    <motion.div
                      whileHover={{ scale: 1.03, y: -3 }}
                      whileTap={{ scale: 0.98, y: 0 }}
                      className="group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all"
                    >
                      <div
                        className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${item.color}`}
                      />
                      <div className="relative flex items-center gap-3 mb-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${item.color} text-white shadow-[0_0_18px_rgba(56,189,248,0.5)]`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex flex-col">
                          <h2 className="text-sm font-semibold text-slate-50">
                            {item.title}
                          </h2>
                          <span className="mt-0.5 inline-flex items-center rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                            {item.tag}
                          </span>
                        </div>
                      </div>
                      <p className="relative text-xs text-slate-300 mb-4">
                        {item.desc}
                      </p>
                      <div className="relative flex items-center justify-between text-[11px] text-slate-500">
                        <span className="group-hover:text-emerald-300 transition-colors">
                          Open module
                        </span>
                        <span className="translate-x-0 group-hover:translate-x-1 group-hover:text-sky-300 transition-all">
                          →
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Admin card */}
            {isAdmin && adminMenuItems.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-purple-300/80">
                  Admin Workspace
                </p>
                <div className="grid">
                  {adminMenuItems.map((item, i) => (
                    <Link key={i} href={item.href}>
                      <motion.div
                        whileHover={{ scale: 1.03, y: -3 }}
                        whileTap={{ scale: 0.98, y: 0 }}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-purple-500/40 bg-slate-950/90 p-5 shadow-[0_0_45px_rgba(147,51,234,0.45)] backdrop-blur-xl transition-all"
                      >
                        <div
                          className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${item.color}`}
                        />
                        <div
                          className={`pointer-events-none absolute inset-x-0 -top-24 h-32 bg-linear-to-b ${item.color} opacity-40 blur-3xl`}
                        />
                        <div className="relative flex items-center gap-3 mb-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br ${item.color} text-white`}
                          >
                            {item.icon}
                          </div>
                          <div className="flex flex-col">
                            <h2 className="text-sm font-semibold text-slate-50">
                              {item.title}
                            </h2>
                            <span className="mt-0.5 inline-flex items-center rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-purple-100">
                              {item.tag}
                            </span>
                          </div>
                        </div>
                        <p className="relative text-xs text-slate-200 mb-3">
                          {item.desc}
                        </p>
                        <div className="relative flex items-center justify-between text-[11px] text-purple-100/80">
                          <span className="group-hover:text-fuchsia-200 transition-colors">
                            Enter admin panel
                          </span>
                          <span className="translate-x-0 group-hover:translate-x-1 group-hover:text-rose-200 transition-all">
                            →
                          </span>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}