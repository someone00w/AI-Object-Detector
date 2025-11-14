"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getCellColor(value, maxValue) {
  if (!value || maxValue === 0) return "bg-slate-900/5"; // no activity

  const ratio = value / maxValue;

  if (ratio > 0.75) return "bg-orange-500";
  if (ratio > 0.5) return "bg-orange-400";
  if (ratio > 0.25) return "bg-orange-300";
  return "bg-orange-200";
}

export function ActivityHeatmap({ data = [] }) {
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = normal view
  const containerRef = useRef(null);

  // Handle wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoomLevel(prev => Math.max(0.5, Math.min(2, prev + delta)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const { lookup, maxValue } = useMemo(() => {
    if (!data.length) return { lookup: new Map(), maxValue: 0 };

    const map = new Map();
    let max = 0;

    for (const item of data) {
      // Handle both formats: { day, hour, value } or { timestamp, value }
      let day, hour;
      
      if (item.timestamp) {
        const date = new Date(item.timestamp);
        const dayIdx = (date.getDay() + 6) % 7; // Convert Sun=0 to Mon=0
        day = DAYS[dayIdx];
        hour = date.getHours();
      } else {
        day = item.day;
        hour = item.hour;
      }

      const key = `${day}-${hour}`;
      const currentValue = map.get(key) || 0;
      const newValue = currentValue + (item.value || 1);
      map.set(key, newValue);
      if (newValue > max) max = newValue;
    }

    return { lookup: map, maxValue: max };
  }, [data]);

  // Calculate cell size based on zoom level
  const cellHeight = Math.max(15, Math.min(40, 20 * zoomLevel));
  const fontSize = Math.max(8, Math.min(12, 10 * zoomLevel));

  return (
    <div 
      ref={containerRef}
      className="w-full rounded-2xl border border-slate-800/40 bg-slate-950/60 p-4 shadow-lg"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-50">
          Hourly Activity Heatmap
        </h2>
        <span className="text-[11px] text-slate-400">
          Ctrl/Cmd + Scroll to zoom • Color = detections
        </span>
      </div>

      {/* X-axis labels */}
      <div className="ml-10 flex gap-0.5 pb-1 pr-2 text-slate-400" style={{ fontSize: `${fontSize}px` }}>
        {HOURS.map((h) => {
          const label = h % 3 === 0 ? `${h}:00` : ""; // show every 3 hours
          return (
            <div key={h} className="flex-1 text-center">
              {label}
            </div>
          );
        })}
      </div>

      <div className="flex">
        {/* Y-axis labels */}
        <div className="mr-2 flex flex-col gap-0.5 text-slate-400" style={{ fontSize: `${fontSize}px` }}>
          {DAYS.map((d) => (
            <div
              key={d}
              className="flex items-center justify-end pr-1"
              style={{ height: `${cellHeight}px` }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 space-y-0.5">
          {DAYS.map((day) => (
            <div key={day} className="flex gap-0.5">
              {HOURS.map((hour) => {
                const key = `${day}-${hour}`;
                const value = lookup.get(key) || 0;
                const colorClass = getCellColor(value, maxValue);

                return (
                  <div
                    key={key}
                    className={`flex-1 rounded-[3px] ${colorClass} transition-all hover:scale-[1.05]`}
                    style={{ height: `${cellHeight}px` }}
                    title={`${day} ${hour}:00 — ${value} detections`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
        <span>Low</span>
        <div className="flex h-2 flex-1 overflow-hidden rounded-full">
          <div className="flex-1 bg-orange-200" />
          <div className="flex-1 bg-orange-300" />
          <div className="flex-1 bg-orange-400" />
          <div className="flex-1 bg-orange-500" />
        </div>
        <span>High</span>
      </div>
    </div>
  );
}