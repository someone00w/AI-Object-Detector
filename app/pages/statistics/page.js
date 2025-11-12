"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/* ----------------- Charts (SVG, no libs) ----------------- */
function DonutChart({ size = 200, thickness = 20, segments = [], center }) {
  const total = useMemo(
    () => Math.max(0, segments.reduce((a, s) => a + (Number(s.value) || 0), 0)),
    [segments]
  );
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  let acc = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut chart">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={thickness} />
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
        x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        className="fill-white"
        style={{ fontSize: 20, fontWeight: 800, letterSpacing: ".02em" }}
      >
        {center ?? total}
      </text>
    </svg>
  );
}

function BarChart({ data = [], height = 150 }) {
  const trimmed = data.slice(0, 10);
  const max = Math.max(1, ...trimmed.map((d) => Number(d.value) || 0));
  return (
    <div className="flex items-end justify-center gap-5">
      {trimmed.map((d, i) => {
        const v = Math.max(0, Number(d.value) || 0);
        const h = (v / max) * height;
        return (
          <div key={i} className="flex flex-col items-center">
            <div
              className="w-6 rounded-md bg-white/70"
              style={{ height: `${h}px` }}
              title={`${d.label}: ${v}`}
            />
            <div className="text-xs text-white/90 mt-2">{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function AreaChart({ points = [], width = 520, height = 170, color = "#fff" }) {
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
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Area chart">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.75" />
    </svg>
  );
}

/* ----------------- Tile (accessible colors) ----------------- */
/* tip: use darker hues + light text for contrast; add a thin high-contrast border */
function Tile({ title, value, subtitle, color, children }) {
  return (
    <motion.section
      whileHover={{ y: -3, scale: 1.01 }}
      className={`rounded-3xl p-8 text-white relative overflow-hidden shadow-xl ring-1 ring-white/10 ${color}`}
    >
      <h3 className="text-sm uppercase tracking-[0.2em] text-white/90">{title}</h3>
      {value !== undefined && (
        <div className="mt-2 text-4xl font-black leading-none text-white">{value}</div>
      )}
      {subtitle && <p className="text-sm text-white/85 mt-2">{subtitle}</p>}
      {children && <div className="mt-6">{children}</div>}
    </motion.section>
  );
}

/* ----------------- Page ----------------- */
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              ← Back to Menu
            </motion.button>
          </Link>
        </div>
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
