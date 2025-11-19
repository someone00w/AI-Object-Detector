"use client";

import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getCellColor(value, maxValue) {
  if (!value || maxValue === 0) return "bg-slate-900/10"; // no activity

  const ratio = value / maxValue;

  if (ratio > 0.75) return "bg-orange-500";
  if (ratio > 0.5) return "bg-orange-400";
  if (ratio > 0.25) return "bg-orange-300";
  return "bg-orange-200";
}

/** Core heatmap grid - supports multiple view modes based on time range */
function HeatmapGrid({ data = [], zoomScale = 1, range = "week" }) {
  // Determine view mode from range
  const viewMode = useMemo(() => {
    if (range === "24h") return "hourly";
    if (range === "week") return "day-hourly";
    return "daily"; // month, year, all
  }, [range]);

  // Build grid data based on view mode
  const { gridData, xLabels, yLabels, maxValue } = useMemo(() => {
    if (!data.length) return { gridData: [], xLabels: [], yLabels: [], maxValue: 0 };

    let max = 0;

    if (viewMode === "hourly") {
      // 24-hour view: x = hours, y = single row
      const hourMap = new Map();
      for (const item of data) {
        const date = new Date(item.timestamp);
        if (Number.isNaN(date.getTime())) continue;
        const hour = date.getHours();
        const key = hour;
        const current = hourMap.get(key) || 0;
        const next = current + (item.value || 1);
        hourMap.set(key, next);
        if (next > max) max = next;
      }
      const grid = [Array.from({ length: 24 }, (_, h) => hourMap.get(h) || 0)];
      const xLabels = Array.from({ length: 24 }, (_, i) =>
        i % 3 === 0 ? `${i}:00` : ""
      );
      return { gridData: grid, xLabels, yLabels: ["Today"], maxValue: max };
    } else if (viewMode === "day-hourly") {
      // 7-day view: x = hours, y = days of week
      const dayHourMap = new Map();
      for (const item of data) {
        const date = new Date(item.timestamp);
        if (Number.isNaN(date.getTime())) continue;
        const dayIdx = (date.getDay() + 6) % 7;
        const dayName = DAYS[dayIdx];
        const hour = date.getHours();
        const key = `${dayName}-${hour}`;
        const current = dayHourMap.get(key) || 0;
        const next = current + (item.value || 1);
        dayHourMap.set(key, next);
        if (next > max) max = next;
      }
      const grid = DAYS.map((day) =>
        Array.from({ length: 24 }, (_, h) => dayHourMap.get(`${day}-${h}`) || 0)
      );
      const xLabels = Array.from({ length: 24 }, (_, i) =>
        i % 3 === 0 ? `${i}:00` : ""
      );
      return { gridData: grid, xLabels, yLabels: DAYS, maxValue: max };
    } else {
      // Daily view: dates grouped by week (month) or month (year)
      const dateMap = new Map();
      const dateList = [];

      for (const item of data) {
        const date = new Date(item.timestamp);
        if (Number.isNaN(date.getTime())) continue;
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, 0);
          dateList.push(dateStr);
        }
        const current = dateMap.get(dateStr);
        const next = current + (item.value || 1);
        dateMap.set(dateStr, next);
        if (next > max) max = next;
      }

      dateList.sort();

      // Group by period (week for month, month for year)
      const groupedByPeriod = new Map();
      const periodLabels = [];

      if (range === "month") {
        // Group by week - show date ranges for clarity
        let prevWeek = -1;
        for (const dateStr of dateList) {
          const date = new Date(dateStr);
          const dayOfWeek = date.getDay();
          const dayOfMonth = date.getDate();
          const week = Math.ceil((dayOfMonth - dayOfWeek + 1) / 7);

          if (week !== prevWeek) {
            prevWeek = week;
            const weekStartDate = new Date(date);
            weekStartDate.setDate(
              dayOfMonth - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
            );
            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekStartDate.getDate() + 6);

            const startDay = weekStartDate.getDate();
            const endDay = weekEndDate.getDate();
            const weekLabel = `${startDay}-${endDay}`;

            if (!groupedByPeriod.has(weekLabel)) {
              groupedByPeriod.set(weekLabel, []);
              periodLabels.push(weekLabel);
            }
          }
          groupedByPeriod
            .get(periodLabels[periodLabels.length - 1])
            .push(dateStr);
        }
      } else {
        // Group by month
        for (const dateStr of dateList) {
          const [year, month] = dateStr.substring(0, 7).split("-");
          const monthIdx = parseInt(month) - 1;
          const monthLabel = `${MONTHS[monthIdx]} '${year.slice(-2)}`;
          if (!groupedByPeriod.has(monthLabel)) {
            groupedByPeriod.set(monthLabel, []);
            periodLabels.push(monthLabel);
          }
          groupedByPeriod.get(monthLabel).push(dateStr);
        }
      }

      // Build grid
      const maxCols = range === "month" ? 7 : 31;
      const grid = periodLabels.map((period) => {
        const dates = groupedByPeriod.get(period);
        return Array.from({ length: maxCols }, (_, i) => {
          const date = dates[i];
          return date ? dateMap.get(date) || 0 : 0;
        });
      });

      // Generate X-axis labels with day numbers (1-7 for weeks, 1-31 for months)
      const xLabels = Array.from({ length: maxCols }, (_, i) => {
        if (range === "month") {
          // For weeks (1-7): show all numbers
          return `${i + 1}`;
        } else {
          // For months (1-31): show numbers more sparsely to avoid crowding
          if (i === 0 || i === 15 || i === 30) return `${i + 1}`;
          return "";
        }
      });
      return { gridData: grid, xLabels, yLabels: periodLabels, maxValue: max };
    }
  }, [data, viewMode, range]);

  // Layout sizing (only UI)
  const cellHeight = Math.max(18, Math.min(46, 24 * zoomScale));
  const fontSize = Math.max(9, Math.min(13, 11 * zoomScale));
  const numCols = xLabels.length || 1;

  if (maxValue === 0) {
    return (
      <p className="py-10 text-center text-xs text-slate-500">
        No detection activity for this period.
      </p>
    );
  }

  const rangeLabel =
    range === "24h"
      ? "Last 24 hours"
      : range === "week"
      ? "Past 7 days"
      : range === "month"
      ? "Current month"
      : "All-time";

  return (
    <>
      {/* Header with info */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/15 text-[13px]">
            📊
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-slate-200">
              Activity distribution
            </p>
            <p className="text-[11px] leading-snug text-slate-400">
              Each cell represents the relative intensity of detections for the
              selected time range.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center rounded-full bg-slate-900/70 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-300">
          {rangeLabel}
        </span>
      </div>

      <div className="mt-1 rounded-xl border border-slate-800/70 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950/40 px-3 py-3">
        {/* X axis labels */}
        <div className="mb-1 flex gap-1">
          {/* Spacer to align with Y-axis */}
          <div
            className="shrink-0"
            style={{ minWidth: viewMode === "daily" ? "auto" : "55px" }}
          />

          {/* X labels */}
          <div className="flex-1 pr-2 text-slate-400">
            <div
              className="grid gap-0.5"
              style={{
                gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
                fontSize: `${fontSize}px`,
              }}
            >
              {xLabels.map((label, i) => (
                <div
                  key={i}
                  className="text-center font-mono text-[11px]"
                  title={label}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Y axis + grid */}
        <div className="flex gap-1">
          {/* Y labels */}
          <div
            className="flex shrink-0 flex-col gap-0.5 py-1"
            style={{
              fontSize: `${fontSize}px`,
              minWidth: viewMode === "daily" ? "auto" : "55px",
            }}
          >
            {yLabels.map((label, i) => (
              <div
                key={i}
                className={`flex items-center justify-end pr-2 font-medium ${
                  viewMode === "daily"
                    ? "bg-slate-900/60 px-2 rounded-lg text-slate-200"
                    : "text-slate-400"
                }`}
                style={{ height: `${cellHeight}px` }}
                title={label}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1 space-y-0.5">
            {gridData.map((row, yIdx) => (
              <div
                key={yIdx}
                className="grid gap-0.5"
                style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
              >
                {row.map((value, xIdx) => {
                  const colorClass = getCellColor(value, maxValue);

                  // nicer, more accurate tooltips per mode
                  let tooltip = "";
                  if (viewMode === "hourly") {
                    tooltip = `${xIdx}:00 — ${value} detection${
                      value === 1 ? "" : "s"
                    }`;
                  } else if (viewMode === "day-hourly") {
                    tooltip = `${yLabels[yIdx]} at ${xIdx}:00 — ${value} detection${
                      value === 1 ? "" : "s"
                    }`;
                  } else if (viewMode === "daily" && range === "month") {
                    tooltip = `Week ${yLabels[yIdx]}, day ${xIdx + 1} — ${value} detection${
                      value === 1 ? "" : "s"
                    }`;
                  } else {
                    tooltip = `${yLabels[yIdx]} • Day ${xIdx + 1} — ${value} detection${
                      value === 1 ? "" : "s"
                    }`;
                  }

                  return (
                    <div
                      key={`${yIdx}-${xIdx}`}
                      className={`cursor-pointer rounded-md ${colorClass} transition-transform duration-150 hover:scale-[1.1] hover:ring-2 hover:ring-orange-400/70`}
                      style={{
                        height: `${cellHeight}px`,
                      }}
                      title={tooltip}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function ActivityHeatmap({ data = [], range }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false); // for portal (SSR-safe)

  // Mark when we're on the client so document.body exists
  useEffect(() => {
    setMounted(true);
  }, []);

  // ESC to exit fullscreen
  useEffect(() => {
    function onEsc(e) {
      if (e.key === "Escape") setIsExpanded(false);
    }
    if (isExpanded) {
      window.addEventListener("keydown", onEsc);
    }
    return () => window.removeEventListener("keydown", onEsc);
  }, [isExpanded]);

  /* ---------- Normal card view ---------- */
  const card = (
    <div className="w-full rounded-2xl border border-slate-800/60 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-slate-950/70 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-50 tracking-wide">
            Activity Heatmap
          </h2>
          <p className="text-[11px] text-slate-400">
            Hover over cells for details. Use fullscreen for a closer look.
          </p>
        </div>

        {/* Fullscreen button */}
        <button
          onClick={() => setIsExpanded(true)}
          className="inline-flex items-center gap-1 rounded-full border border-orange-400/70 bg-orange-500/90 px-3.5 py-1.5 text-[10px] font-semibold text-slate-950 shadow transition hover:bg-orange-400"
        >
          <span className="text-xs">⤢</span>
          <span>Fullscreen</span>
        </button>
      </div>

      <HeatmapGrid data={data} zoomScale={1} range={range} />

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-300">Intensity</span>
          <div className="flex h-2.5 w-32 overflow-hidden rounded-full ring-1 ring-slate-900/60">
            <div className="flex-1 bg-orange-200" />
            <div className="flex-1 bg-orange-300" />
            <div className="flex-1 bg-orange-400" />
            <div className="flex-1 bg-orange-500" />
          </div>
          <span>Low</span>
          <span className="text-xs text-slate-500">→</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );

  /* ---------- Fullscreen overlay via portal ---------- */
  const fullscreenOverlay =
    mounted && isExpanded
      ? createPortal(
          <div className="fixed inset-0 z-9999 flex flex-col bg-slate-950/95 text-white backdrop-blur-md">
            {/* Top bar */}
            <div className="flex flex-col gap-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-950 to-slate-900 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Activity Heatmap — Fullscreen
                </h1>
                <p className="mt-1 text-xs text-slate-400">
                  Detailed breakdown of your detection activity. Press ESC or
                  click Exit to close.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3 text-[11px] text-slate-300">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="rounded-full border border-slate-600 bg-slate-800 px-4 py-1.5 text-xs text-slate-200 transition hover:bg-slate-700"
                >
                  ✕ Exit fullscreen
                </button>
              </div>
            </div>

            {/* Main fullscreen content */}
            <div className="flex-1 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8 overflow-auto">
              {/* wider wrapper */}
              <div className="w-full max-w-[95vw] mx-auto">
                <HeatmapGrid data={data} zoomScale={1.5} range={range} />

                {/* Legend */}
                <div className="mt-8 flex flex-wrap items-center gap-3 text-[12px] text-slate-400">
                  <span className="font-medium text-slate-200">
                    Activity intensity
                  </span>
                  <div className="flex h-3 w-40 overflow-hidden rounded-full ring-1 ring-slate-900/70">
                    <div className="flex-1 bg-orange-200" />
                    <div className="flex-1 bg-orange-300" />
                    <div className="flex-1 bg-orange-400" />
                    <div className="flex-1 bg-orange-500" />
                  </div>
                  <span className="text-slate-500">(Low → High)</span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {card}
      {fullscreenOverlay}
    </>
  );
}
