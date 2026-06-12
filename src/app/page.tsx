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

export default function HomePage() {
  const today = getToday();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: "new_game_test",
    title: "",
    content: "",
    source: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchEntries = useCallback(async () => {
    const res = await fetch(`/api/entries?date=${today}`);
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }, [today]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

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

    if (editingId !== null) {
      await fetch(`/api/entries/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          source: form.source || undefined,
        }),
      });
      setEditingId(null);
    } else {
      await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          category: form.category,
          title: form.title,
          content: form.content,
          source: form.source || undefined,
        }),
      });
    }

    setForm({ category: "new_game_test", title: "", content: "", source: "" });
    setSubmitting(false);
    fetchEntries();
  }

  async function handleDelete(id: number) {
    if (!confirm("确定删除这条情报？")) return;
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
    fetchEntries();
  }

  function handleEdit(entry: Entry) {
    setEditingId(entry.id);
    setForm({
      category: entry.category,
      title: entry.title,
      content: entry.content,
      source: entry.source || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ category: "new_game_test", title: "", content: "", source: "" });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="gradient-text">今日情报</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">{today}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          已收录 {entries.length} 条
        </div>
      </div>

      {/* Entry Form */}
      <form
        onSubmit={handleSubmit}
        className="glass-card space-y-4 p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">
            {editingId !== null ? "编辑情报" : "录入新情报"}
          </h2>
          {editingId !== null && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              取消编辑
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none transition-colors focus:border-cyan-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-slate-800">
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="来源（可选）"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-500"
          />
        </div>
        <input
          type="text"
          placeholder="情报标题"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-500"
        />
        <textarea
          placeholder="情报内容"
          rows={3}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={submitting || !form.title.trim() || !form.content.trim()}
          className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-medium text-white transition-all hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "提交中..." : editingId !== null ? "保存修改" : "录入情报"}
        </button>
      </form>

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
          全部
        </button>
        {CATEGORIES.map((cat) => {
          const count = entries.filter((e) => e.category === cat.id).length;
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
              {cat.icon} {cat.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <span className="text-4xl">📋</span>
          <p className="mt-3 text-sm">暂无情报记录</p>
          <p className="mt-1 text-xs">使用上方表单录入今日第一条情报</p>
        </div>
      ) : activeCategory ? (
        /* Single category view */
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const cat = getCategory(entry.category);
            return (
              <div
                key={entry.id}
                className="glass-card animate-fade-in p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                      {cat?.icon} {cat?.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatTime(entry.createdAt)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="text-xs text-slate-500 transition-colors hover:text-cyan-400"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-xs text-slate-500 transition-colors hover:text-red-400"
                    >
                      删除
                    </button>
                  </div>
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
        /* Grouped by category */
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
                  <div
                    key={entry.id}
                    className="glass-card animate-fade-in p-4"
                    style={{
                      animationDelay: `${group.items.indexOf(entry) * 50}ms`,
                    }}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {formatTime(entry.createdAt)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-xs text-slate-500 transition-colors hover:text-cyan-400"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-xs text-slate-500 transition-colors hover:text-red-400"
                        >
                          删除
                        </button>
                      </div>
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
