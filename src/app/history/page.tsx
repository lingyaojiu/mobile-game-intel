"use client";

import { useState, useEffect } from "react";
import { CATEGORIES, getCategory } from "@/lib/categories";
import type { Entry } from "@/lib/types";

export default function HistoryPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/entries")
      .then((res) => res.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      });
  }, []);

  // Group by date
  const dateGroups = entries.reduce(
    (acc, entry) => {
      if (!acc[entry.date]) acc[entry.date] = [];
      acc[entry.date].push(entry);
      return acc;
    },
    {} as Record<string, Entry[]>,
  );

  const dates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));

  const displayEntries = selectedDate
    ? dateGroups[selectedDate] || []
    : entries;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          <span className="gradient-text">历史记录</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          浏览所有已收录的手游情报
        </p>
      </div>

      {/* Date Timeline */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDate(null)}
            className={`rounded-full px-3 py-1 text-xs transition-all ${
              selectedDate === null
                ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            全部 ({entries.length})
          </button>
          {dates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`rounded-full px-3 py-1 text-xs transition-all ${
                selectedDate === date
                  ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {date}
              <span className="ml-1 text-slate-500">
                ({dateGroups[date].length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : displayEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <span className="text-4xl">📭</span>
          <p className="mt-3 text-sm">暂无情报记录</p>
        </div>
      ) : selectedDate ? (
        /* Single date view */
        <div className="space-y-3">
          {displayEntries.map((entry) => {
            const cat = getCategory(entry.category);
            return (
              <div key={entry.id} className="glass-card animate-fade-in p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                    {cat?.icon} {cat?.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(entry.createdAt).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-slate-200">
                  {entry.title}
                </h3>
                <p className="mt-1 text-sm text-slate-400">{entry.content}</p>
                {entry.source && (
                  <p className="mt-2 text-xs text-slate-500">
                    来源：{entry.source}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Grouped by date */
        <div className="space-y-8">
          {dates.map((date) => (
            <div key={date}>
              <a
                href={`/date/${date}`}
                className="mb-3 flex items-center gap-2 transition-colors hover:opacity-80"
              >
                <span className="text-lg">📅</span>
                <h2 className="text-sm font-semibold text-slate-300">
                  {date}
                </h2>
                <span className="text-xs text-slate-500">
                  {dateGroups[date].length} 条
                </span>
                <span className="ml-auto text-xs text-cyan-500">查看详情 →</span>
              </a>
              <div className="space-y-2">
                {dateGroups[date].slice(0, 3).map((entry) => {
                  const cat = getCategory(entry.category);
                  return (
                    <div
                      key={entry.id}
                      className="glass-card animate-fade-in p-3"
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-slate-500">
                          {cat?.icon} {cat?.label}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-slate-200">
                        {entry.title}
                      </h3>
                    </div>
                  );
                })}
                {dateGroups[date].length > 3 && (
                  <a
                    href={`/date/${date}`}
                    className="block text-center text-xs text-slate-500 transition-colors hover:text-cyan-400"
                  >
                    还有 {dateGroups[date].length - 3} 条，查看全部 →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
