"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CATEGORIES, getCategory } from "@/lib/categories";
import type { Entry } from "@/lib/types";

export default function DateDetailPage() {
  const params = useParams();
  const date = params.date as string;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/entries?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      });
  }, [date]);

  const filteredEntries = activeCategory
    ? entries.filter((e) => e.category === activeCategory)
    : entries;

  const groupedByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    items: entries.filter((e) => e.category === cat.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <a href="/history" className="mb-2 inline-block text-xs text-slate-500 transition-colors hover:text-cyan-400">
          ← 返回历史记录
        </a>
        <h1 className="text-xl font-bold sm:text-2xl">
          <span className="gradient-text">{date}</span>
        </h1>
        <p className="mt-0.5 text-xs text-slate-400 sm:mt-1 sm:text-sm">共收录 {entries.length} 条情报</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveCategory(null)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs transition-all ${
            activeCategory === null
              ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
              : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}
        >
          全部 ({entries.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = entries.filter((e) => e.category === cat.id).length;
          if (count === 0) return null;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs transition-all ${
                activeCategory === cat.id
                  ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {cat.icon} {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent sm:h-8 sm:w-8" />
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 sm:py-20">
          <span className="text-3xl sm:text-4xl">📭</span>
          <p className="mt-2 text-xs sm:text-sm">该日期暂无情报记录</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry) => {
            const cat = getCategory(entry.category);
            return (
              <div key={entry.id} className="glass-card animate-fade-in overflow-hidden">
                {entry.imageUrl && (
                  <div className="relative aspect-video w-full overflow-hidden bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entry.imageUrl} alt={entry.title} className="h-full w-full object-cover" loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
                <div className="p-3 sm:p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                      {cat?.icon} {cat?.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(entry.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {entry.source && (
                      <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-xs text-cyan-400">{entry.source}</span>
                    )}
                  </div>
                  <a href={`/article/${entry.id}`} className="text-sm font-medium text-slate-200 transition-colors hover:text-cyan-400">{entry.title}</a>
                  {entry.summary && entry.summary !== entry.title && (
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400 line-clamp-2">{entry.summary}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
