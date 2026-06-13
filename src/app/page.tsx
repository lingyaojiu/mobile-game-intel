"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CATEGORIES, getCategory } from "@/lib/categories";
import type { Entry } from "@/lib/types";

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function EntryCard({ entry, onDelete }: { entry: Entry; onDelete: (id: number) => void }) {
  const cat = getCategory(entry.category);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="glass-card animate-fade-in overflow-hidden group">
      <a href={`/article/${entry.id}`} className="block">
        {entry.imageUrl && !imgError ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-800">
            <img
              src={entry.imageUrl}
              alt={entry.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-700">
            <span className="text-3xl opacity-30">{cat?.icon || "🎮"}</span>
          </div>
        )}
      </a>

      <div className="p-3">
        {/* Category tag + source + time */}
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
            {cat?.icon} {cat?.label}
          </span>
          {entry.source && (
            <span className="text-[10px] text-slate-500">{entry.source}</span>
          )}
          <span className="ml-auto text-[10px] text-slate-600">
            {entry.publishedAt ? entry.publishedAt.substring(11, 16) : formatTime(entry.createdAt)}
          </span>
        </div>

        {/* Title */}
        <a href={`/article/${entry.id}`} className="block">
          <h3 className="text-sm font-medium leading-snug text-slate-200 transition-colors group-hover:text-cyan-400 line-clamp-2">
            {entry.title}
          </h3>
        </a>

        <button
          onClick={(e) => { e.preventDefault(); onDelete(entry.id); }}
          className="mt-2 text-[10px] text-slate-600 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
        >
          删除
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const today = getToday();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [collectMsg, setCollectMsg] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>("today"); // today, yesterday, week, month, all
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch today's entries
  const fetchToday = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/entries?date=${today}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEntries(data);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "请求失败");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [today]);

  // Fetch all entries
  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/entries");
      const data = await res.json();
      setAllEntries(data);
    } catch { /* ignore */ }
  }, []);

  // Initial load
  useEffect(() => {
    fetchToday();
    fetchAll();
  }, [fetchToday, fetchAll]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchToday();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchToday]);

  async function handleCollect() {
    setCollecting(true);
    setCollectMsg(null);
    try {
      const res = await fetch("/api/collect", { method: "POST" });
      const data = await res.json();
      setCollectMsg(data.message || "采集完成");
      fetchToday();
      fetchAll();
    } catch {
      setCollectMsg("采集请求失败");
    } finally {
      setCollecting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
    fetchToday();
    fetchAll();
  }

  // Filter entries by time
  const filterByTime = (items: Entry[]) => {
    const now = new Date();
    const todayStr = getToday();
    const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split("T")[0];
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];

    switch (timeFilter) {
      case "today": return items.filter(e => e.date === todayStr);
      case "yesterday": return items.filter(e => e.date === yesterdayStr);
      case "week": return items.filter(e => e.date >= weekAgo);
      case "month": return items.filter(e => e.date >= monthAgo);
      default: return items;
    }
  };

  // Get filtered entries
  const filteredEntries = filterByTime(
    activeCategory ? allEntries.filter(e => e.category === activeCategory) : allEntries
  );

  // Group filtered entries by date (descending)
  const groupedByDate = filteredEntries.reduce(
    (acc, e) => {
      if (!acc[e.date]) acc[e.date] = [];
      acc[e.date].push(e);
      return acc;
    },
    {} as Record<string, Entry[]>,
  );
  const dateKeys = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  // Today's entries (for top section)
  const todayEntries = entries;
  const todayFiltered = activeCategory
    ? todayEntries.filter(e => e.category === activeCategory)
    : todayEntries;

  // Today grouped by category
  const todayByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    items: todayEntries.filter((e) => e.category === cat.id),
  })).filter((g) => g.items.length > 0);

  // Time axis options
  const timeOptions = [
    { id: "today", label: "今日" },
    { id: "yesterday", label: "昨日" },
    { id: "week", label: "本周" },
    { id: "month", label: "本月" },
    { id: "all", label: "全部" },
  ];

  return (
    <div className="space-y-5">
      {/* ===== TOP BAR ===== */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold sm:text-xl">
            <span className="gradient-text">手游情报</span>
          </h1>
          <p className="text-[11px] text-slate-500">自动更新中 · {todayEntries.length} 条今日</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleCollect}
            disabled={collecting}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:from-violet-400 hover:to-purple-500 disabled:opacity-50"
          >
            {collecting ? (
              <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />采集中</>
            ) : (
              <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>刷新</>
            )}
          </button>
        </div>
      </div>

      {/* Collect message */}
      {collectMsg && (
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300">
          {collectMsg}
        </div>
      )}

      {/* ===== TIME AXIS FILTER (vertical timeline style) ===== */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none -mx-3 px-3">
        {timeOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setTimeFilter(opt.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              timeFilter === opt.id
                ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-2 shrink-0 text-[10px] text-slate-600">
          {filteredEntries.length} 条
        </span>
      </div>

      {/* ===== CATEGORY TAGS (as article type badges) ===== */}
      <div ref={scrollRef} className="scrollbar-none -mx-3 overflow-x-auto px-3">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              activeCategory === null
                ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            全部
          </button>
          {CATEGORIES.map((cat) => {
            const count = todayEntries.filter((e) => e.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {cat.icon} {cat.label}
                {count > 0 && <span className="ml-1 text-[10px] opacity-60">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== CONTENT AREA ===== */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <span className="text-2xl">⚠️</span>
          <p className="mt-2 text-xs text-red-400">加载失败</p>
          <button onClick={fetchToday} className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-xs text-slate-300">重试</button>
        </div>
      ) : timeFilter === "today" && !activeCategory ? (
        /* ===== TODAY: Grouped by category ===== */
        todayByCategory.length > 0 ? (
          <div className="space-y-5">
            {todayByCategory.map((group) => (
              <div key={group.id}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm">{group.icon}</span>
                  <h3 className="text-xs font-medium text-slate-400">{group.label}</h3>
                  <span className="text-[10px] text-slate-600">{group.items.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {group.items.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <span className="text-3xl">📋</span>
            <p className="mt-2 text-xs">暂无情报，点击右上角「刷新」采集</p>
          </div>
        )
      ) : (
        /* ===== TIME FILTER VIEW: Vertical timeline by date ===== */
        dateKeys.length > 0 ? (
          <div className="space-y-6">
            {dateKeys.map((date, dateIdx) => (
              <div key={date} className="relative pl-5">
                {/* Timeline line */}
                {dateIdx < dateKeys.length - 1 && (
                  <div className="absolute left-[7px] top-4 bottom-0 w-px bg-white/10" />
                )}
                {/* Timeline dot */}
                <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-cyan-500/50 bg-slate-900" />
                
                {/* Date header */}
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-cyan-400">{date}</span>
                  <span className="text-[10px] text-slate-600">{groupedByDate[date].length} 条</span>
                  {date === today && (
                    <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-400">今日</span>
                  )}
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {groupedByDate[date].slice(0, 8).map((entry) => (
                    <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
                  ))}
                </div>

                {groupedByDate[date].length > 8 && (
                  <a
                    href={`/date/${date}`}
                    className="mt-2 block text-center text-[10px] text-slate-600 transition-colors hover:text-cyan-400"
                  >
                    查看全部 {groupedByDate[date].length} 条 →
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <span className="text-3xl">📭</span>
            <p className="mt-2 text-xs">该时间范围内暂无情报</p>
          </div>
        )
      )}
    </div>
  );
}
