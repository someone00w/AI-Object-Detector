"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

/** ===== Small SVG chart components (no external libs) ===== **/
function DonutChart({
  size = 160,
  thickness = 18,
  segments = [],
  format = (n) => `${n}`,
  centerLabel,
}) {
  const total = Math.max(
    0,
    segments.reduce((a, s) => a + (Number.isFinite(s.value) ? s.value : 0), 0)
  );
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  let cumulative = 0;

  const fallbackColors = [
    "#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa", "#22d3ee",
  ];

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(148,163,184,0.15)"
          strokeWidth={thickness}
        />
        {segments.map((s, idx) => {
          const value = Math.max(0, Number(s.value || 0));
          const frac = total > 0 ? value / total : 0;
          const dash = 2 * Math.PI * r * frac;
          const gap = 2 * Math.PI * r - dash;
          const rotate = total > 0 ? (cumulative / total) * 360 : 0;
          cumulative += value;
          const color = s.color || fallbackColors[idx % fallbackColors.length];
          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(-90 ${cx} ${cy}) rotate(${rotate} ${cx} ${cy})`}
              strokeLinecap="butt"
            />
          );
        })}
        <text
          x="50%" y="50%"
          dominantBaseline="middle" textAnchor="middle"
          className="fill-slate-200"
          style={{ fontSize: 14, fontFamily: "system-ui, sans-serif" }}
        >
          {centerLabel ?? (total ? format(total) : "0")}
        </text>
      </svg>

      <div className="space-y-2 text-xs">
        {segments.map((s, idx) => {
          const color = s.color || [
            "#34d399","#60a5fa","#f472b6","#fbbf24","#a78bfa","#22d3ee",
          ][idx % 6];
          return (
            <div key={idx} className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: color, opacity: 0.9 }} />
              <span className="text-slate-300">{s.label}</span>
              <span className="text-slate-500 ml-1">
                {format(Number(s.value || 0))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarChart({ data = [], height = 160, maxBars = 10, valueSuffix = "" }) {
  const trimmed = data.slice(0, maxBars);
  const max = Math.max(1, ...trimmed.map((d) => Number(d.value || 0)));

  return (
    <div className="w-full">
      <div className="flex items-end gap-8 overflow-x-auto pb-2">
        {trimmed.map((d, i) => {
          const v = Math.max(0, Number(d.value || 0));
          const h = (v / max) * height;
          return (
            <div key={i} className="flex flex-col items-center min-w-[40px]">
              <div
                className="w-6 rounded-md bg-gradient-to-t from-slate-700 to-slate-400"
                style={{ height: `${h}px` }}
                title={`${d.label} — ${v}${valueSuffix}`}
              />
              <div className="mt-2 text-[10px] text-slate-400 text-center max-w-[64px] break-words">
                {d.label}
              </div>
              <div className="text-[10px] text-slate-500">{v}{valueSuffix}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** ===== Page ===== **/
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

  // Safe reads
  const totalVideos = Number(stats?.totalVideos ?? 0);
  const totalStorageMb = Number(stats?.totalStorageMb ?? 0);
  const totalDetections = Number(stats?.totalDetections ?? 0);
  const avgDetectionsPerVideo = Number(stats?.avgDetectionsPerVideo ?? 0);
  const recentVideos = Array.isArray(stats?.recentVideos) ? stats.recentVideos : [];

  const avgDetectionsDisplay = avgDetectionsPerVideo.toFixed(1);
  const totalStorageDisplay = totalStorageMb.toFixed(2);

  const activityLevel =
    totalVideos === 0 ? "Inactive"
    : totalVideos < 5 ? "Getting started"
    : totalVideos < 15 ? "Active user"
    : "Power user";

  const detectionDensity =
    avgDetectionsPerVideo === 0 ? "No detections yet"
    : avgDetectionsPerVideo < 10 ? "Low object density"
    : avgDetectionsPerVideo < 30 ? "Moderate object density"
    : "High object density";

  const STORAGE_QUOTA_MB = 5000;
  const storageUsed = Math.max(0, totalStorageMb);
  const storageFree = Math.max(0, STORAGE_QUOTA_MB - storageUsed);
  const storageSegments = [
    { label: "Used", value: storageUsed, color: "#34d399" },
    { label: "Free", value: storageFree, color: "#64748b" },
  ];

  const barsRecentSizes = recentVideos.map((v) => ({
    label: (v.video_name || "Video").slice(0, 8),
    value: Number(v.file_size_mb || 0),
  }));

  // Presence time per video (in seconds)
  const barsPresenceSeconds = recentVideos.map((v) => {
    const ms = Number(v?.detection_result?.person?.totalDurationMs ?? 0);
    return {
      label: (v.video_name || "Video").slice(0, 8),
      value: Math.round(ms / 1000),
    };
  });

  // Videos with vs without detections
  let withDet = 0, withoutDet = 0;
  recentVideos.forEach((v) => {
    const d = Number(
      v?.detection_result?.totalDetections ??
      v?.detections ??
      v?.total_detections ??
      0
    );
    if (d > 0) withDet += 1; else withoutDet += 1;
  });
  const detectionDonut = [
    { label: "Videos with detections", value: withDet, color: "#60a5fa" },
    { label: "No detections", value: withoutDet, color: "#0ea5e9" },
  ];

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

        {/* Main */}
        <main className="w-full max-w-6xl mx-auto space-y-6">
          {/* Summary Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <StatCard label="Activity Level" value={activityLevel} helper="Based on number of videos." />
            <StatCard label="Detection Density" value={detectionDensity} helper="From avg detections per video." />
            <StatCard label="Privacy" value="You-only statistics" helper="Shows only your uploads and detections." />
          </section>

          {/* Quick Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Your Videos" value={totalVideos} helper="Videos you captured or uploaded." />
            <StatCard label="Your Detections" value={totalDetections} helper="Total detection episodes." />
            <StatCard label="Avg Detections / Video" value={avgDetectionsDisplay} helper="Average detections per video." />
            <StatCard label="Your Storage Usage" value={`${totalStorageDisplay} MB`} helper="Approximate size of stored videos." />
          </section>

          {/* Storage & Sizes */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-xl">
              <h2 className="text-sm font-medium text-slate-200 mb-2">Storage Usage</h2>
              <p className="text-xs text-slate-400 mb-4">Breakdown of used vs free space (quota {STORAGE_QUOTA_MB} MB).</p>
              <DonutChart
                segments={storageSegments}
                size={180}
                thickness={20}
                format={(n) => `${Number(n).toFixed(0)} MB`}
                centerLabel={`${Number(storageUsed).toFixed(0)} MB`}
              />
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-xl">
              <h2 className="text-sm font-medium text-slate-200 mb-2">Recent Video Sizes</h2>
              <p className="text-xs text-slate-400 mb-4">Each bar shows file size of your latest videos.</p>
              {barsRecentSizes.length ? (
                <BarChart data={barsRecentSizes} height={160} maxBars={12} valueSuffix=" MB" />
              ) : (
                <p className="text-sm text-slate-400">No recent videos yet.</p>
              )}
            </div>
          </section>

          {/* Detections & Presence */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-xl">
              <h2 className="text-sm font-medium text-slate-200 mb-2">Presence Time per Video</h2>
              <p className="text-xs text-slate-400 mb-4">Total seconds a person was visible in each clip.</p>
              {barsPresenceSeconds.some(b => b.value > 0) ? (
                <BarChart data={barsPresenceSeconds} height={160} maxBars={12} valueSuffix="s" />
              ) : (
                <p className="text-sm text-slate-400">No presence time data yet.</p>
              )}
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-xl">
              <h2 className="text-sm font-medium text-slate-200 mb-2">Detections in Recent Videos</h2>
              <p className="text-xs text-slate-400 mb-4">How many recent videos had detections vs none.</p>
              <DonutChart
                segments={detectionDonut}
                size={160}
                thickness={18}
                format={(n) => `${n}`}
                centerLabel={`${(detectionDonut[0]?.value || 0) + (detectionDonut[1]?.value || 0)} vids`}
              />
            </div>
          </section>

          {/* Recent Videos Table */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-xl">
            <h2 className="text-sm font-medium text-slate-200 mb-1">Your Recent Videos</h2>
            <p className="text-xs text-slate-500 mb-4">Latest captured or uploaded videos.</p>
            {!recentVideos.length ? (
              <p className="text-sm text-slate-400">No videos yet. Try running a detection!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs border-b border-slate-800">
                      <th className="py-2 text-left font-medium">Name</th>
                      <th className="py-2 text-left font-medium">Capture Time</th>
                      <th className="py-2 text-left font-medium">Size (MB)</th>
                      <th className="py-2 text-left font-medium">Detections</th>
                      <th className="py-2 text-left font-medium">Presence (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentVideos.map((v) => {
                      const det = Number(
                        v?.detection_result?.totalDetections ??
                        v?.detections ??
                        v?.total_detections ??
                        0
                      );
                      const sec = Math.round(Number(v?.detection_result?.person?.totalDurationMs ?? 0) / 1000);
                      return (
                        <tr key={v.id} className="border-b border-slate-900/80 last:border-0 hover:bg-slate-900/70 transition-colors">
                          <td className="py-2 pr-4">{v.video_name}</td>
                          <td className="py-2 pr-4 text-slate-400">
                            {new Date(v.capture_time).toLocaleString()}
                          </td>
                          <td className="py-2 pr-4 text-slate-400">
                            {v.file_size_mb != null ? Number(v.file_size_mb).toFixed(2) : "-"}
                          </td>
                          <td className="py-2 pr-4 text-slate-400">{det}</td>
                          <td className="py-2 pr-4 text-slate-400">{sec}</td>
                        </tr>
                      );
                    })}
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
      {helper && <p className="text-[11px] text-slate-500 mt-2">{helper}</p>}
    </div>
  );
}
