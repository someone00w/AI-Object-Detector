"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import SettingsPanel from '@/app/components/SettingsPanel'
import { ActivityHeatmap } from '@/app/components/ActivityHeatmap'

/* ----------------- Charts (SVG, no libs) ----------------- */
function DonutChart({ size = 200, thickness = 20, segments = [], center }) {
  const total = useMemo(
    () => Math.max(0, segments.reduce((a, s) => a + (Number(s.value) || 0), 0)),
    [segments]
  );
  const r = (size - thickness) / 2;
  const cx = size / 2,
    cy = size / 2;
  let acc = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut chart">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(0,0,0,.08)"
        strokeWidth={thickness}
      />
      {segments.map((s, i) => {
        const v = Math.max(0, Number(s.value) || 0);
        const tot = total || 1;
        const frac = v / tot;
        const dash = 2 * Math.PI * r * frac;
        const gap = 2 * Math.PI * r - dash;
        const start = (acc / tot) * 360;
        acc += v;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            transform={`rotate(-90 ${cx} ${cy}) rotate(${start} ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
      })}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-slate-900"
        style={{ fontSize: 20, fontWeight: 800, letterSpacing: ".02em" }}
      >
        {center ?? total}
      </text>
    </svg>
  );
}

function AreaChart({ points = [], width = 700, height = 180, color = "#000000" }) {
  if (!points.length) return null;
  const maxY = Math.max(1, ...points.map((p) => p.y));
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  const line = points
    .map((p, i) => {
      const x = i * stepX;
      const y = height - (p.y / maxY) * height;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const area = `${line} L${width},${height} L0,${height} Z`;
  const id = useMemo(() => `g${Math.random().toString(36).slice(2)}`, []);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Detections over time">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="3" />
    </svg>
  );
}

/* ----------------- Generic tile ----------------- */

function Tile({ title, value, subtitle, children }) {
  return (
    <motion.section
      whileHover={{ y: -3, scale: 1.01 }}
      className="rounded-3xl p-6 text-white relative overflow-hidden shadow-xl bg-slate-900/90 ring-1 ring-white/10"
    >
      <h3 className="text-xs uppercase tracking-[0.2em] text-white/80">{title}</h3>
      {value !== undefined && (
        <div className="mt-2 text-3xl font-black leading-none text-white">{value}</div>
      )}
      {subtitle && <p className="text-xs text-slate-200 mt-2">{subtitle}</p>}
      {children && <div className="mt-4">{children}</div>}
    </motion.section>
  );
}

/* ----------------- Range options ----------------- */

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

/* ----------------- Page ----------------- */

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);

  useEffect(() => {
    // Fetch both stats and heatmap data
    (async () => {
      setLoading(true);
      try {
        console.log('🔄 Fetching stats and heatmap...');
        
        const [statsRes, heatmapRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/stats/heatmap")
        ]);
        
        console.log('📊 Stats response status:', statsRes.status);
        console.log('📈 Heatmap response status:', heatmapRes.status);
        
        const statsData = await statsRes.json();
        const heatmapResult = await heatmapRes.json();
        
        console.log('📊 Stats data:', statsData);
        console.log('📈 Heatmap result:', heatmapResult);
        
        setStats(statsData);
        if (heatmapResult.success) {
          console.log('✅ Setting heatmap data with', heatmapResult.data.length, 'entries');
          setHeatmapData(heatmapResult.data);
        } else {
          console.log('⚠️ Heatmap fetch unsuccessful:', heatmapResult);
        }
      } catch (error) {
        console.error('❌ Failed to fetch statistics:', error);
        setStats(null);
      } finally {
        setLoading(false);
        setLoadingHeatmap(false);
      }
    })();
  }, [range]);

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
      {/* header */}
      <header className="sticky top-0 z-10 backdrop-blur bg-slate-950/80 border-b border-white/15">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Statistics</h1>
            <p className="text-slate-300 text-sm">
              Detection overview across your recordings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pages/menu">
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.97, y: 0 }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-[11px] sm:text-xs text-slate-200 hover:border-lime-400/60 hover:text-lime-300 transition-all"
              >
                <span className="text-lg leading-none">←</span>
                <span>Back to menu</span>
              </motion.button>
            </Link>
            <SettingsPanel />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10 space-y-10">
        {/* KPIs (darker hues for better contrast) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Tile title="Videos" value={totalVideos} subtitle="Total captured" color="bg-teal-700" />
          <Tile title="Detections" value={totalDetections} subtitle={`Avg ${avgDetectionsPerVideo.toFixed(1)} / video`} color="bg-sky-800" />
          <Tile title="Storage" value={`${totalStorageMb.toFixed(2)} MB`} subtitle="Used space" color="bg-indigo-900" />
        </section>

        {/* Activity Heatmap - NEW SECTION */}
        <section>
          <Tile title="Activity Heatmap" subtitle="Detection activity by day and hour" color="bg-slate-900">
            {loadingHeatmap ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 rounded-full border-2 border-t-transparent border-emerald-400 animate-spin" />
              </div>
            ) : heatmapData.length > 0 ? (
              <ActivityHeatmap data={heatmapData} />
            ) : (
              <div className="text-center text-white/70 py-8">
                No activity data yet. Start recording to see your detection patterns!
              </div>
            )}
          </Tile>
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
                  { value: withDet, color: "#38bdf8" },
                  { value: withoutDet, color: "rgba(255,255,255,.35)" },
                ]}
              />
              <div className="text-base">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm" style={{ background: "#38bdf8" }} />
                  With detections: <b className="text-white">{withDet}</b>
                </div>
                <div className="mt-4 text-[3.5rem] leading-none font-black tracking-tight">
                  {totalDetections.toLocaleString()}
                </div>
                <p className="mt-3 text-sm text-slate-700 max-w-xs">
                  Total detections · {RANGE_LABELS[range] || "Selected range"}
                </p>
              </div>

              {/* Range selector */}
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-900 text-slate-50 px-2 py-1 text-[10px] sm:text-[11px]">
                {RANGE_OPTIONS.map((opt) => {
                  const active = opt.key === range;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setRange(opt.key)}
                      className={`px-3 py-1 rounded-full transition-all ${
                        active
                          ? "bg-lime-300 text-slate-900 font-semibold"
                          : "text-slate-200/80 hover:bg-slate-800"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: detections over time graph */}
            <div className="flex-[1.4] bg-lime-50 p-6 lg:p-10 border-t lg:border-t-0 lg:border-l border-slate-900/10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-600">
                  Detections over time
                </span>
                <span className="text-xs text-slate-500">
                  {detectionsTimelineRaw.length} points
                </span>
              </div>
              {detectionPoints.length ? (
                <>
                  <AreaChart points={detectionPoints} color="#020617" />
                  <div className="mt-4 flex justify-between text-[10px] text-slate-500">
                    {detectionsTimelineRaw.map((d, i) => (
                      <span
                        key={i}
                        className="truncate max-w-[4rem]"
                        title={d.label}
                      >
                        {d.label}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-600">
                  No detection data for this range yet.
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Bottom cards: videos, detections summary, recent activity */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Tile title="Storage Breakdown" color="bg-purple-900">
            <div className="flex items-center justify-center gap-6">
              <DonutChart
                size={180}
                thickness={22}
                center={`${used.toFixed(0)} MB`}
                segments={[
                  { value: used, color: "#22c55e" },
                  { value: free, color: "rgba(255,255,255,.35)" },
                ]}
              />
              <div className="text-base leading-relaxed text-white">
                Quota: {STORAGE_QUOTA_MB} MB <br />
                Free: {free.toFixed(0)} MB
              </div>
            </div>
          </Tile>

          <Tile title="Recent activity">
            {recentActivity.length ? (
              <div className="max-h-52 overflow-y-auto pr-1 text-xs">
                {recentActivity.slice(0, 8).map((ev) => (
                  <div
                    key={ev.id ?? ev.time + ev.label}
                    className="flex items-center justify-between py-2 border-b border-white/10 last:border-none"
                  >
                    <div className="min-w-0 mr-3">
                      <div className="truncate text-[13px]">{ev.label}</div>
                      <div className="text-[11px] text-slate-300">
                        {ev.time}
                      </div>
                    </div>
                    <span className="text-[11px] bg-slate-800 px-2 py-1 rounded-full">
                      {ev.count}×
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-200">
                No activity in this range.
              </div>
            )}
          </Tile>
        </section>
      </main>
    </div>
  );
}