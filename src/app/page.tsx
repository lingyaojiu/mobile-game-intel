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
      {/* Image */}
      <a href={`/article/${entry.id}`} className="block">
        {entry.imageUrl && !imgError ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
        {/* Meta row */}
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
            {cat?.icon} {cat?.label}
          </span>
          {entry.source && (
            <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-400">
              {entry.source}
            </span>
          )}
          <span className="ml-auto text-[10px] text-slate-500">{formatTime(entry.createdAt)}</span>
        </div>

        {/* Title */}
        <a href={`/article/${entry.id}`} className="block">
          <h3 className="text-sm font-medium leading-snug text-slate-200 transition-colors group-hover:text-cyan-400 line-clamp-2">
            {entry.title}
          </h3>
        </a>

        {/* Summary */}
        {entry.summary && entry.summary !== entry.title && (
          <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-2">{entry.summary}</p>
        )}

        {/* Delete */}
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
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [collectMsg, setCollectMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch today's entries on load
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

  // Fetch all entries for history
  const fetchAll = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/entries");
      const data = await res.json();
      setAllEntries(data);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
    fetchAll();
  }, [fetchToday, fetchAll]);

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

  // Today's filtered entries
  const todayEntries = Array.isArray(entries) ? entries : [];
  const filteredToday = activeCategory
    ? todayEntries.filter((e) => e.category === activeCategory)
    : todayEntries;

  // Group today by category
  const todayByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    items: todayEntries.filter((e) => e.category === cat.id),
  })).filter((g) => g.items.length > 0);

  // History: group all entries except today by date
  const historyEntries = allEntries.filter((e) => e.date !== today);
  const historyByDate = historyEntries.reduce(
    (acc, e) => {
      if (!acc[e.date]) acc[e.date] = [];
      acc[e.date].push(e);
      return acc;
    },
    {} as Record<string, Entry[]>,
  );
  const historyDates = Object.keys(historyByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-5">
      {/* ===== TOP BAR ===== */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold sm:text-xl">
            <span className="gradient-text">手游情报</span>
          </h1>
          <p className="text-[11px] text-slate-500">{today}</p>
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
          <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {todayEntries.length}
          </div>
        </div>
      </div>

      {/* Collect message */}
      {collectMsg && (
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300">
          {collectMsg}
        </div>
      )}

      {/* ===== CATEGORY TABS (horizontal scroll) ===== */}
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

      {/* ===== TODAY'S ENTRIES ===== */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          今日情报 · {todayEntries.length} 条
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <span className="text-2xl">⚠️</span>
            <p className="mt-2 text-xs text-red-400">加载失败</p>
            <button onClick={fetchToday} className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-xs text-slate-300">重试</button>
          </div>
        ) : filteredToday.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <span className="text-3xl">📋</span>
            <p className="mt-2 text-xs">暂无情报，点击右上角「刷新」采集</p>
          </div>
        ) : activeCategory ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredToday.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
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
        )}
      </section>

      {/* ===== HISTORY ===== */}
      {historyDates.length > 0 && (
        <section className="border-t border-white/5 pt-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            历史情报
          </h2>

          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-5">
              {historyDates.slice(0, 7).map((date) => (
                <div key={date}>
                  <a
                    href={`/date/${date}`}
                    className="mb-2 flex items-center gap-2 text-xs text-slate-500 transition-colors hover:text-cyan-400"
                  >
                    📅 {date}
                    <span className="text-slate-600">({historyByDate[date].length})</span>
                    <span className="ml-auto">→</span>
                  </a>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {historyByDate[date].slice(0, 4).map((entry) => {
                      const cat = getCategory(entry.category);
                      return (
                        <a
                          key={entry.id}
                          href={`/article/${entry.id}`}
                          className="glass-card flex items-center gap-2 p-2 text-xs text-slate-400 transition-colors hover:text-slate-200"
                        >
                          <span className="shrink-0">{cat?.icon}</span>
                          <span className="line-clamp-1">{entry.title}</span>
                        </a>
                      );
                    })}
                  </div>
                  {historyByDate[date].length > 4 && (
                    <a href={`/date/${date}`} className="mt-1 block text-center text-[10px] text-slate-600 transition-colors hover:text-cyan-400">
                      查看全部 {historyByDate[date].length} 条 →
                    </a>
                  )}
                </div>
              ))}
              {historyDates.length > 7 && (
                <a href="/history" className="block text-center text-xs text-cyan-500 transition-colors hover:text-cyan-400">
                  查看全部历史记录 →
                </a>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
