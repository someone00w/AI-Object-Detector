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
  const [range, setRange] = useState("week");

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
          <Tile title="Storage Growth" subtitle="Cumulative from recent videos">
            {areaStorage.length ? (
              <AreaChart points={areaStorage} color="#fff" />
            ) : (
              <div className="text-sm text-white/90">No data yet</div>
            )}
          </Tile>

          <Tile title="Detections Split">
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
                  <span className="text-white">With detections: <b>{withDet}</b></span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-white/35" />
                  <span className="text-white">Without: <b>{withoutDet}</b></span>
                </div>
              </div>
            </div>
          </Tile>

          <Tile title="Storage Breakdown">
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
        </section>
      </main>
    </div>
  );
}