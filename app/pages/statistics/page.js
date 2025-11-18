"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import SettingsPanel from "@/app/components/SettingsPanel";
import { ActivityHeatmap } from "@/app/components/ActivityHeatmap";

/* --------------------- Tile Component --------------------- */
function Tile({ title, value, subtitle, children }) {
  return (
    <motion.section
      whileHover={{ y: -2, scale: 1.01 }}
      className="rounded-3xl p-6 bg-slate-900/80 border border-white/10 shadow-md text-white"
    >
      <h3 className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</h3>
      {value !== undefined && (
        <div className="text-3xl font-black mt-2">{value}</div>
      )}
      {subtitle && (
        <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </motion.section>
  );
}

/* --------------------- Range Selector --------------------- */
const RANGE_OPTIONS = [
  { key: "24h", label: "24 Hours" },
  { key: "week", label: "Past Week" },
  { key: "month", label: "Past Month" },
  { key: "year", label: "Past Year" },
  { key: "all", label: "All Time" },
];

const RANGE_LABELS = {
  "24h": "Last 24 hours",
  week: "Past week",
  month: "Past month",
  year: "Past year",
  all: "All time",
};

/* ---------------------------------------------------------- */

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);
  const [range, setRange] = useState("week");

  /* ---------------- Fetch Stats & Heatmap ---------------- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadingHeatmap(true);

      try {
        const query = new URLSearchParams({ range }).toString();

        const [statsRes, heatmapRes] = await Promise.all([
          fetch(`/api/stats?${query}`),
          fetch(`/api/stats/heatmap`), // heatmap always same
        ]);

        const statsData = await statsRes.json();
        const heatmapResult = await heatmapRes.json();

        setStats(statsData);
        setHeatmapData(heatmapResult.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingHeatmap(false);
      }
    })();
  }, [range]);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 grid place-items-center text-white">
        Loading…
      </div>
    );

  const totalVideos = stats?.totalVideos || 0;
  const totalDetections = stats?.totalDetections || 0;
  const avgDetectionsPerVideo = stats?.avgDetectionsPerVideo || 0;

  const recent = Array.isArray(stats?.recentVideos) ? stats.recentVideos : [];

  /* --------------------- UI --------------------- */
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Statistics</h1>
            <p className="text-slate-400 text-sm">
              Overview of your detection activity
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/pages/menu">
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                className="px-3 py-1.5 rounded-xl bg-slate-900/70 border border-slate-700 text-xs text-slate-200 hover:border-lime-400 hover:text-lime-300"
              >
                ← Back
              </motion.button>
            </Link>
            <SettingsPanel />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* -------- Range Selector -------- */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Time Range</p>
              <p className="text-sm text-slate-300">
                Showing: <span className="text-white font-medium">{RANGE_LABELS[range]}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setRange(opt.key)}
                  className={`px-3 py-1.5 rounded-full text-xs border ${
                    range === opt.key
                      ? "border-lime-400 text-lime-300 bg-slate-900/70"
                      : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* -------- KPI Row -------- */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Tile title="Videos" value={totalVideos} subtitle="Recorded during selected range" />
          <Tile
            title="Detections"
            value={totalDetections}
            subtitle={`Avg ${avgDetectionsPerVideo.toFixed(1)} per video`}
          />
          <Tile
            title="Recent Activity"
            value={recent.length}
            subtitle="Latest 5 recordings"
          />
        </section>

        {/* -------- Heatmap -------- */}
        <section>
          <Tile title="Activity Heatmap" subtitle="Detection frequency (All Time)">
            {loadingHeatmap ? (
              <div className="py-10 text-center">Loading heatmap…</div>
            ) : (
              <ActivityHeatmap key="static-heatmap" data={heatmapData} />
            )}
          </Tile>
        </section>

        {/* -------- Top Labels -------- */}
        <section>
          <Tile title="Most Detected Objects" subtitle="Across selected range">
            {stats?.topLabels?.length ? (
              <ul className="space-y-2">
                {stats.topLabels.map((l) => (
                  <li key={l.label} className="flex justify-between text-sm">
                    <span className="text-slate-300">{l.label}</span>
                    <span className="font-medium text-white">{l.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-sm">No detections found.</p>
            )}
          </Tile>
        </section>

        {/* -------- Recent Videos -------- */}
        <section>
          <Tile title="Recent Videos" subtitle="Most recent 5 clips">
            {recent.length === 0 ? (
              <p className="text-slate-400 text-sm">No videos found.</p>
            ) : (
              <div className="space-y-2">
                {recent.map((v) => (
                  <div
                    key={v.id}
                    className="px-3 py-2 bg-slate-800/40 border border-slate-700 rounded-xl text-sm flex justify-between"
                  >
                    <span className="truncate max-w-[150px] text-slate-300">
                      {v.video_name}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {new Date(v.capture_time).toLocaleString("en-SG")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Tile>
        </section>
      </main>
    </div>
  );
}
