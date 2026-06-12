"use client";

import { useState, useEffect, useCallback } from "react";
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

function EntryCard({ entry, onEdit, onDelete }: {
  entry: Entry;
  onEdit: (e: Entry) => void;
  onDelete: (id: number) => void;
}) {
  const cat = getCategory(entry.category);
  return (
    <div className="glass-card animate-fade-in overflow-hidden">
      {entry.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.imageUrl}
            alt={entry.title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}
      <div className="p-3 sm:p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-400">
            {cat?.icon} {cat?.label}
          </span>
          <span className="text-xs text-slate-500">{formatTime(entry.createdAt)}</span>
          {entry.source && (
            <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-xs text-cyan-400">
              {entry.source}
            </span>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={() => onEdit(entry)} className="text-xs text-slate-500 transition-colors hover:text-cyan-400">编辑</button>
            <button onClick={() => onDelete(entry.id)} className="text-xs text-slate-500 transition-colors hover:text-red-400">删除</button>
          </div>
        </div>
        {entry.link ? (
          <a href={entry.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-200 transition-colors hover:text-cyan-400">
            {entry.title}
          </a>
        ) : (
          <h3 className="text-sm font-medium text-slate-200">{entry.title}</h3>
        )}
        {entry.summary && entry.summary !== entry.title && (
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400 line-clamp-2">{entry.summary}</p>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const today = getToday();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [form, setForm] = useState({ category: "new_game_test", title: "", content: "", source: "" });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [collectMsg, setCollectMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`/api/entries?date=${today}`, { signal: controller.signal });
      clearTimeout(timeout);
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

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  async function handleCollect() {
    setCollecting(true);
    setCollectMsg(null);
    try {
      const res = await fetch("/api/collect", { method: "POST" });
      const data = await res.json();
      setCollectMsg(data.message || "采集完成");
      fetchEntries();
    } catch {
      setCollectMsg("采集请求失败，请稍后重试");
    } finally {
      setCollecting(false);
    }
  }

  const filteredEntries = activeCategory
    ? entries.filter((e) => e.category === activeCategory)
    : entries;

  const groupedByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    items: entries.filter((e) => e.category === cat.id),
  })).filter((g) => g.items.length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      if (editingId !== null) {
        await fetch(`/api/entries/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: form.title, content: form.content, source: form.source || undefined }),
        });
        setEditingId(null);
      } else {
        await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: today, category: form.category, title: form.title, content: form.content, source: form.source || undefined }),
        });
      }
      setForm({ category: "new_game_test", title: "", content: "", source: "" });
      setShowForm(false);
      fetchEntries();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
    fetchEntries();
  }

  function handleEdit(entry: Entry) {
    setEditingId(entry.id);
    setForm({ category: entry.category, title: entry.title, content: entry.content, source: entry.source || "" });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ category: "new_game_test", title: "", content: "", source: "" });
    setShowForm(false);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">
            <span className="gradient-text">今日情报</span>
          </h1>
          <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCollect}
            disabled={collecting}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:from-violet-400 hover:to-purple-500 disabled:opacity-50 sm:px-4 sm:text-sm"
          >
            {collecting ? (
              <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />采集中</>
            ) : (
              <><svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>一键采集</>
            )}
          </button>
          <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-400 sm:px-3 sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 sm:h-2 sm:w-2" />
            {entries.length} 条
          </div>
        </div>
      </div>

      {/* Collect Message */}
      {collectMsg && (
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300 sm:text-sm">
          {collectMsg}
        </div>
      )}

      {/* Toggle Form Button (mobile) */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 sm:hidden"
      >
        {showForm ? "收起表单" : editingId ? "编辑情报" : "录入新情报"}
        <svg className={`h-4 w-4 transition-transform ${showForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Entry Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card space-y-3 p-4 sm:space-y-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">
              {editingId !== null ? "编辑情报" : "录入新情报"}
            </h2>
            {editingId !== null && (
              <button type="button" onClick={cancelEdit} className="text-xs text-slate-500 transition-colors hover:text-slate-300">取消编辑</button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none transition-colors focus:border-cyan-500">
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-slate-800">{cat.icon} {cat.label}</option>
              ))}
            </select>
            <input type="text" placeholder="来源（可选）" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-500" />
          </div>
          <input type="text" placeholder="情报标题" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-500" />
          <textarea placeholder="情报内容" rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-500" />
          <button type="submit" disabled={submitting || !form.title.trim() || !form.content.trim()}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-medium text-white transition-all hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? "提交中..." : editingId !== null ? "保存修改" : "录入情报"}
          </button>
        </form>
      )}

      {/* Category Filter - Scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button onClick={() => setActiveCategory(null)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs transition-all ${
            activeCategory === null ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40" : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}>全部</button>
        {CATEGORIES.map((cat) => {
          const count = entries.filter((e) => e.category === cat.id).length;
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs transition-all ${
                activeCategory === cat.id ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40" : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}>
              {cat.icon} {cat.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 sm:py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent sm:h-8 sm:w-8" />
          <p className="mt-3 text-xs sm:text-sm">加载中...</p>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 sm:py-20">
          <span className="text-3xl sm:text-4xl">⚠️</span>
          <p className="mt-2 text-xs text-red-400 sm:text-sm">数据加载失败</p>
          <button onClick={fetchEntries} className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-xs text-slate-300 transition-colors hover:bg-white/20">重新加载</button>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 sm:py-20">
          <span className="text-3xl sm:text-4xl">📋</span>
          <p className="mt-2 text-xs sm:text-sm">暂无情报记录</p>
          <p className="mt-1 text-xs text-slate-600">点击上方「一键采集」自动抓取今日手游情报</p>
        </div>
      ) : activeCategory ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {groupedByCategory.map((group) => (
            <div key={group.id}>
              <div className="mb-2 flex items-center gap-2 sm:mb-3">
                <span className="text-base sm:text-lg">{group.icon}</span>
                <h2 className="text-sm font-semibold text-slate-300">{group.label}</h2>
                <span className="text-xs text-slate-500">{group.items.length} 条</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
