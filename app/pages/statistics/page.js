"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Link from "next/link";

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setStats(data);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 grid place-items-center text-white">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-emerald-400 animate-spin" />
          <span className="text-lg">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  const totalVideos = Number(stats?.totalVideos ?? 0);
  const totalDetections = Number(stats?.totalDetections ?? 0);
  const avgDetectionsPerVideo = Number(stats?.avgDetectionsPerVideo ?? 0);
  const totalStorageMb = Number(stats?.totalStorageMb ?? 0);
  const recent = Array.isArray(stats?.recentVideos) ? stats.recentVideos : [];

  const sizesBars = recent.map((v) => ({
    label: (v.video_name || "vid").slice(0, 6),
    value: Number(v.file_size_mb || 0),
  }));

  let withDet = 0, withoutDet = 0;
  recent.forEach((v) => {
    const d = Number(
      v?.detection_result?.totalDetections ??
      v?.detections ??
      v?.total_detections ?? 0
    );
    if (d > 0) withDet++; else withoutDet++;
  });

  const sorted = [...recent].sort(
    (a, b) => new Date(a.capture_time) - new Date(b.capture_time)
  );
  let run = 0;
  const areaStorage = sorted.map((v) => {
    run += Number(v.file_size_mb || 0);
    return { y: run };
  });

  const STORAGE_QUOTA_MB = 5000;
  const used = totalStorageMb;
  const free = Math.max(0, STORAGE_QUOTA_MB - used);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* header with stronger contrast */}
      <header className="sticky top-0 z-10 backdrop-blur bg-slate-950/80 border-b border-white/15">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
            <p className="text-slate-300 text-sm">Readable, high-contrast overview</p>
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

      <main className="max-w-7xl mx-auto px-8 py-10 space-y-10">
        {/* KPIs (darker hues for better contrast) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Tile title="Videos" value={totalVideos} subtitle="Total captured" color="bg-teal-700" />
          <Tile title="Detections" value={totalDetections} subtitle={`Avg ${avgDetectionsPerVideo.toFixed(1)} / video`} color="bg-sky-800" />
          <Tile title="Storage" value={`${totalStorageMb.toFixed(2)} MB`} subtitle="Used space" color="bg-indigo-900" />
        </section>

        {/* Graphs row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Tile title="Storage Growth" subtitle="Cumulative from recent videos" color="bg-fuchsia-800">
            {areaStorage.length ? (
              <AreaChart points={areaStorage} color="#fff" />
            ) : (
              <div className="text-sm text-white/90">No data yet</div>
            )}
          </Tile>

          <Tile title="Recent Sizes" subtitle="Last 10 videos" color="bg-emerald-800">
            {sizesBars.length ? (
              <BarChart data={sizesBars} />
            ) : (
              <div className="text-sm text-white/90">No videos yet</div>
            )}
          </Tile>

          <Tile title="Detections Split" color="bg-cyan-800">
            <div className="flex items-center justify-center gap-6">
              <DonutChart
                size={180}
                thickness={22}
                center={`${withDet + withoutDet} vids`}
                segments={[
                  { value: withDet, color: "#38bdf8" },          // sky-400
                  { value: withoutDet, color: "rgba(255,255,255,.35)" },
                ]}
              />
              <div className="text-base">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm" style={{ background: "#38bdf8" }} />
                  With detections: <b className="text-white">{withDet}</b>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="h-3 w-3 rounded-sm bg-white/60" />
                  No detections: <b className="text-white">{withoutDet}</b>
                </div>
              </div>
            </div>
          </Tile>
        </section>

        {/* Breakdown + list + facts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Tile title="Storage Breakdown" color="bg-purple-900">
            <div className="flex items-center justify-center gap-6">
              <DonutChart
                size={180}
                thickness={22}
                center={`${used.toFixed(0)} MB`}
                segments={[
                  { value: used, color: "#22c55e" }, // emerald-500
                  { value: free, color: "rgba(255,255,255,.35)" },
                ]}
              />
              <div className="text-base leading-relaxed text-white">
                Quota: {STORAGE_QUOTA_MB} MB <br />
                Free: {free.toFixed(0)} MB
              </div>
            </div>
          </Tile>

          <Tile title="Recent Activity" color="bg-slate-900">
            {recent.length ? (
              <div className="max-h-48 overflow-y-auto pr-2 text-base">
                {recent.slice(0, 10).map((v) => {
                  const det = Number(
                    v?.detection_result?.totalDetections ??
                    v?.detections ?? v?.total_detections ?? 0
                  );
                  return (
                    <div key={v.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-none">
                      <span className="truncate max-w-[16rem] text-white">{v.video_name}</span>
                      <span className="text-white">{det}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-base text-white/90">No recent videos</div>
            )}
          </Tile>

          <Tile title="Quick Stats" color="bg-slate-900">
            <ul className="text-base space-y-2 text-white">
              <li>• Activity: <b>{
                totalVideos===0 ? "Inactive" :
                totalVideos<5 ? "Getting started" :
                totalVideos<15 ? "Active user" : "Power user"
              }</b></li>
              <li>• Density: <b>{
                avgDetectionsPerVideo===0 ? "None" :
                avgDetectionsPerVideo<10 ? "Low" :
                avgDetectionsPerVideo<30 ? "Moderate" : "High"
              }</b></li>
              <li>• Recent clips: <b>{recent.length}</b></li>
            </ul>
          </Tile>
        </section>

        {/* Table with stronger header contrast & zebra rows */}
        <section className="rounded-3xl overflow-hidden ring-1 ring-white/15 bg-slate-900">
          <div className="px-6 py-4 text-xs uppercase tracking-[0.16em] text-white/90 bg-slate-950">
            Recent Videos
          </div>
          {!recent.length ? (
            <div className="px-6 py-6 text-sm text-white/90">No videos yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="text-left px-6 py-3">Name</th>
                    <th className="text-left px-6 py-3">Captured</th>
                    <th className="text-left px-6 py-3">Size (MB)</th>
                    <th className="text-left px-6 py-3">Detections</th>
                    <th className="text-left px-6 py-3">Presence (s)</th>
                  </tr>
                </thead>
                <tbody className="text-white/95">
                  {recent.map((v, idx) => {
                    const det = Number(v?.detection_result?.totalDetections ?? v?.detections ?? v?.total_detections ?? 0);
                    const sec = Math.round(Number(v?.detection_result?.person?.totalDurationMs ?? 0) / 1000);
                    return (
                      <tr key={v.id} className={idx % 2 ? "bg-slate-900" : "bg-slate-800/40"}>
                        <td className="px-6 py-3">{v.video_name}</td>
                        <td className="px-6 py-3">{new Date(v.capture_time).toLocaleString()}</td>
                        <td className="px-6 py-3">{v.file_size_mb != null ? Number(v.file_size_mb).toFixed(2) : "-"}</td>
                        <td className="px-6 py-3">{det}</td>
                        <td className="px-6 py-3">{sec}</td>
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
  );
}
