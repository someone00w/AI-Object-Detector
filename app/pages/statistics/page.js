"use client";

import { useEffect, useState } from "react";
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
      <h3 className="text-xs uppercase tracking-[0.18em] text-slate-400">
        {title}
      </h3>
      {value !== undefined && (
        <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
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
          fetch(`/api/stats/heatmap?${query}`), // pass range to heatmap too
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

  const selectedRangeLabel = RANGE_LABELS[range];

  /* --------------------------- UI ------------------------ */
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Detection Statistics
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Overview of your AI detection activity.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Showing:{" "}
              <span className="font-medium text-white">
                {selectedRangeLabel}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/pages/menu">
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:border-lime-400 hover:text-lime-300"
              >
                ← Back
              </motion.button>
            </Link>
            <SettingsPanel />
          </div>
        </header>

        {/* Range selector */}
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-3">
          <span className="text-xs text-slate-400">
            Time range for all statistics and heatmap.
          </span>
          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((opt) => {
              const active = opt.key === range;
              return (
                <button
                  key={opt.key}
                  onClick={() => setRange(opt.key)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    active
                      ? "bg-lime-400 text-slate-950 font-medium shadow"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Top tiles */}
        <section className="grid gap-4 md:grid-cols-4">
          <Tile
            title="Total Users"
            value={loading ? "…" : stats?.totalUsers ?? 0}
            subtitle="All registered accounts"
          />

          <Tile
            title="Videos"
            value={loading ? "…" : stats?.totalVideos ?? 0}
            subtitle="Videos in selected range"
          />

          <Tile
            title="Detections"
            value={loading ? "…" : stats?.totalDetections ?? 0}
            subtitle="Objects detected in selected range"
          />

          <Tile
            title="Avg Detections / Video"
            value={
              loading
                ? "…"
                : stats
                ? stats.avgDetectionsPerVideo.toFixed(1)
                : "0.0"
            }
            subtitle="Across videos with detections"
          />
        </section>

        {/* Middle layout: Heatmap + Top labels */}
        <section className="grid gap-4 lg:grid-cols-3">
          {/* Heatmap */}
          <div className="lg:col-span-2">
            <Tile
              title="Activity Heatmap"
              subtitle={`Detection frequency (${selectedRangeLabel})`}
            >
              {loadingHeatmap ? (
                <div className="py-10 text-center text-sm text-slate-400">
                  Loading heatmap…
                </div>
              ) : (
                <ActivityHeatmap key={range} data={heatmapData} range={range} />
              )}
            </Tile>
          </div>

          {/* Top labels */}
          <div>
            <Tile
              title="Most Detected Objects"
              subtitle="Across selected range"
            >
              {loading ? (
                <p className="py-6 text-center text-sm text-slate-400">
                  Loading…
                </p>
              ) : !stats?.topLabels || stats.topLabels.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  No detection labels available for this period.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.topLabels.map((item, idx) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-400/10 text-[11px] text-lime-300">
                          #{idx + 1}
                        </span>
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-xs text-slate-300">
                        {item.count} detections
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Tile>
          </div>
        </section>

        {/* Recent videos */}
        <section>
          <Tile
            title="Recent Videos"
            subtitle="Most recent clips in the selected range"
          >
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-400">
                Loading…
              </p>
            ) : !stats?.recentVideos || stats.recentVideos.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                No videos in this period.
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {stats.recentVideos.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-xl bg-slate-900/80 px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-50">
                        {v.video_name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(v.capture_time).toLocaleString("en-SG")}
                      </span>
                    </div>
                    <span className="text-xs text-slate-300">
                      {v.file_size_mb
                        ? `${Number(v.file_size_mb).toFixed(1)} MB`
                        : "-"}
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
