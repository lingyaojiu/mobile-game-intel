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
    <div className="space-y-6">
      <div>
        <a
          href="/history"
          className="mb-2 inline-block text-xs text-slate-500 transition-colors hover:text-cyan-400"
        >
          ← 返回历史记录
        </a>
        <h1 className="text-2xl font-bold">
          <span className="gradient-text">{date}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          共收录 {entries.length} 条情报
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`rounded-full px-3 py-1 text-xs transition-all ${
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
              className={`rounded-full px-3 py-1 text-xs transition-all ${
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

      {/* Entries */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <span className="text-4xl">📭</span>
          <p className="mt-3 text-sm">该日期暂无情报记录</p>
        </div>
      ) : activeCategory ? (
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
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
        <div className="space-y-6">
          {groupedByCategory.map((group) => (
            <div key={group.id}>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">{group.icon}</span>
                <h2 className="text-sm font-semibold text-slate-300">
                  {group.label}
                </h2>
                <span className="text-xs text-slate-500">
                  {group.items.length} 条
                </span>
              </div>
              <div className="space-y-2">
                {group.items.map((entry) => (
                  <div key={entry.id} className="glass-card animate-fade-in p-4">
                    <div className="mb-1 flex items-center justify-between">
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
                    <p className="mt-1 text-sm text-slate-400">
                      {entry.content}
                    </p>
                    {entry.source && (
                      <p className="mt-2 text-xs text-slate-500">
                        来源：{entry.source}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
