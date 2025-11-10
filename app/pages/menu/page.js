"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CameraIcon,
  PlayCircleIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";

export default function MenuPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/session");

      console.log("Session response status:", response.status);

      if (!response.ok) {
        console.log("Not authenticated, redirecting...");
        router.push("/pages/login");
        return;
      }

      const data = await response.json();
      console.log("User data:", data.user);
      setUser(data.user);
    } catch (error) {
      console.error("Session check failed:", error);
      router.push("/pages/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const menuItems = [
    {
      title: "AI Object Detection",
      desc: "Start detecting objects using your live camera feed.",
      href: "/detection",
      color: "from-emerald-400 to-cyan-400",
      icon: <CameraIcon className="w-6 h-6" />,
    },
    {
      title: "View Recordings",
      desc: "Browse saved detections and recorded sessions.",
      href: "/pages/recordings",
      color: "from-pink-500 to-orange-400",
      icon: <PlayCircleIcon className="w-6 h-6" />,
    },
    {
      title: "View Statistics",
      desc: "Analyze detection patterns and performance data.",
      href: "/pages/statistics",
      color: "from-green-500 to-teal-400",
      icon: <ChartBarIcon className="w-8 h-8" />,
    },
  ];

  const adminMenuItems =
    user?.role === 1
      ? [
          {
            title: "Admin Panel",
            desc: "Manage users, roles, and system settings.",
            href: "/pages/admin",
            color: "from-purple-500 to-fuchsia-500",
            icon: <KeyIcon className="w-6 h-6" />,
          },
        ]
      : [];

  const allMenuItems = [...menuItems, ...adminMenuItems];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b,#020617_80%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(16,185,129,0.12),rgba(56,189,248,0.12))]" />
        <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[60px_60px]" />

        <div className="relative z-10 flex flex-col items-center gap-3">
          <span className="h-4 w-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-300">Loading your control panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background layers (same vibe as home/login/register) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b,#020617_80%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(16,185,129,0.12),rgba(56,189,248,0.12))]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[60px_60px]" />
      <div className="absolute top-[8%] left-[10%] w-[260px] h-[260px] bg-emerald-400/12 rounded-full blur-[150px]" />
      <div className="absolute bottom-[10%] right-[12%] w-[320px] h-80 bg-sky-400/12 rounded-full blur-[160px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top header / nav */}
        <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-xl bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_14px_rgba(16,185,129,0.7)]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                DiddyWatch
              </span>
              <span className="text-xs text-slate-500">
                Logged in as{" "}
                <span className="text-slate-200 font-medium">
                  {user.username}
                </span>
                {user.role === 1 && (
                  <span className="ml-2 inline-flex items-center rounded-full border border-purple-400/40 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-200">
                    Admin
                  </span>
                )}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs sm:text-sm text-red-100 hover:bg-red-500/20 hover:border-red-400 transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Logout
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1 w-full flex items-center justify-center px-4 sm:px-6 pb-10">
          <div className="w-full max-w-6xl">
            {/* Title / subtitle */}
            <div className="mb-10 text-center">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
                Control Center
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
                Choose where to go next — run live detections, review your past
                footage, or inspect statistics from your sessions.
              </p>
            </div>

            {/* Menu grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {allMenuItems.map((item, i) => (
                <Link key={i} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98, y: 0 }}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all"
                  >
                    {/* Top accent bar */}
                    <div
                      className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${item.color}`}
                    />

                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${item.color} text-white shadow-[0_0_18px_rgba(56,189,248,0.5)]`}
                      >
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <h2 className="text-lg font-semibold text-slate-50">
                          {item.title}
                        </h2>
                        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                          {item.href === "/detection"
                            ? "Live"
                            : item.href.includes("recordings")
                            ? "History"
                            : item.href.includes("statistics")
                            ? "Analytics"
                            : "Admin"}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-300 mb-4">
                      {item.desc}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="group-hover:text-emerald-300 transition-colors">
                        Open module
                      </span>
                      <span className="text-slate-500 group-hover:text-sky-300 transition-colors">
                        →
                      </span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
