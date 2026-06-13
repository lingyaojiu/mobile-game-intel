"use client";

import { useEffect, useState, useCallback } from "react";
import { COLUMNS, COLUMN_TAG_COLORS } from "@/lib/columns";
import type { ArticleData, DashboardStats } from "@/lib/types";

type Tab = "dashboard" | "articles" | "games" | "sources" | "logs";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "概览", icon: "📊" },
    { id: "articles", label: "文章管理", icon: "📝" },
    { id: "games", label: "游戏管理", icon: "🎮" },
    { id: "sources", label: "信息源", icon: "📡" },
    { id: "logs", label: "采集日志", icon: "📋" },
  ];

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetch("/api/stats").then((r) => r.ok && r.json()).then(setStats).catch(() => {});
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">后台管理</h1>
        <p className="mt-1 text-sm text-slate-500">文章审核、游戏资料管理、信息源配置</p>
      </div>

      {/* Tab导航 */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-white/[0.06]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-xs font-medium transition-all border-b-2 ${
              activeTab === tab.id
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      {activeTab === "dashboard" && <AdminDashboard stats={stats} />}
      {activeTab === "articles" && <AdminArticles />}
      {activeTab === "games" && <AdminGames />}
      {activeTab === "sources" && <AdminSources />}
      {activeTab === "logs" && <AdminLogs />}
    </div>
  );
}

// ===== 管理面板概览 =====
function AdminDashboard({ stats }: { stats: DashboardStats | null }) {
  if (!stats) {
    return <div className="py-10 text-center text-sm text-slate-600">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500">文章总数</div>
          <div className="mt-1 text-2xl font-bold text-slate-100">{stats.totalArticles}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500">已发布</div>
          <div className="mt-1 text-2xl font-bold text-emerald-400">{stats.publishedArticles}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500">待审核</div>
          <div className="mt-1 text-2xl font-bold text-amber-400">{stats.pendingReview}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-slate-500">游戏资料</div>
          <div className="mt-1 text-2xl font-bold text-violet-400">{stats.totalGames}</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">热门游戏</h3>
          {stats.topGames.length === 0 ? (
            <p className="text-xs text-slate-600">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {stats.topGames.slice(0, 5).map((g, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{g.name}</span>
                  <span className="text-xs text-slate-600">{g.count}篇</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">热门来源</h3>
          {stats.topSources.length === 0 ? (
            <p className="text-xs text-slate-600">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {stats.topSources.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{s.name}</span>
                  <span className="text-xs text-slate-600">{s.count}篇</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">今日采集状态</h3>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${stats.todayCrawlStatus === "success" ? "bg-emerald-500" : stats.todayCrawlStatus ? "bg-amber-500" : "bg-slate-600"}`} />
          <span className="text-xs text-slate-500">
            {stats.todayCrawlStatus === "success" ? "采集成功" : stats.todayCrawlStatus === "partial" ? "部分成功" : stats.todayCrawlStatus === "failed" ? "采集失败" : "今日尚未采集"}
          </span>
          <span className="text-xs text-slate-700">|</span>
          <span className="text-xs text-slate-500">今日新增 {stats.todayNewArticles} 篇文章</span>
        </div>
      </div>
    </div>
  );
}

// ===== 文章管理 =====
function AdminArticles() {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ status: "", column: "", summary: "" });

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("pageSize", "100");
      params.set("sortBy", "createdAt");
      const res = await fetch(`/api/articles?${params}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  const updateArticle = async (id: number) => {
    try {
      await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditingId(null);
      loadArticles();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteArticle = async (id: number) => {
    if (!confirm("确定删除此文章？")) return;
    try {
      await fetch(`/api/articles/${id}`, { method: "DELETE" });
      loadArticles();
    } catch (err) {
      console.error(err);
    }
  };

  const statuses = [
    { id: "pending_review", label: "待审核" },
    { id: "candidate", label: "候选" },
    { id: "published", label: "已发布" },
    { id: "rejected", label: "已拒绝" },
    { id: "", label: "全部" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              statusFilter === s.id
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-500 hover:text-slate-300 border border-transparent"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card p-4">
              <div className="skeleton h-4 w-3/4 mb-2" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-600">暂无文章</div>
      ) : (
        <div className="space-y-2">
          {articles.map((article) => (
            <div key={article.id} className="glass-card p-3 sm:p-4">
              {editingId === article.id ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400"
                    >
                      <option value="candidate">候选</option>
                      <option value="pending_review">待审核</option>
                      <option value="published">发布</option>
                      <option value="rejected">拒绝</option>
                      <option value="archived">归档</option>
                    </select>
                    <select
                      value={editForm.column}
                      onChange={(e) => setEditForm({ ...editForm, column: e.target.value })}
                      className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400"
                    >
                      {COLUMNS.map((col) => (
                        <option key={col.id} value={col.id}>{col.label}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={editForm.summary}
                    onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                    placeholder="编辑摘要..."
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 placeholder-slate-600"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => updateArticle(article.id)}
                      className="rounded-lg bg-cyan-600 px-3 py-1 text-xs text-white hover:bg-cyan-500">
                      保存
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="rounded-lg bg-white/[0.06] px-3 py-1 text-xs text-slate-400 hover:bg-white/[0.1]">
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${COLUMN_TAG_COLORS[article.column] || ""}`}>
                        {COLUMNS.find((c) => c.id === article.column)?.icon} {COLUMNS.find((c) => c.id === article.column)?.label || article.column}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium badge-${article.status}`}>
                        {article.status === "published" ? "已发布" : article.status === "pending_review" ? "待审核" : article.status === "rejected" ? "已拒绝" : "候选"}
                      </span>
                      {article.relevanceScore != null && (
                        <span className="text-[10px] text-slate-600">{article.relevanceScore}%</span>
                      )}
                    </div>
                    <a href={`/article/${article.id}`} className="text-sm font-medium text-slate-200 hover:text-cyan-400 transition-colors">
                      {article.title}
                    </a>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-600">
                      {article.sourceName && <span>{article.sourceName}</span>}
                      {article.gameName && <span>· {article.gameName}</span>}
                      {article.publishedAt && <span>· {article.publishedAt}</span>}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    <button
                      onClick={() => {
                        setEditingId(article.id);
                        setEditForm({ status: article.status, column: article.column, summary: article.summary || "" });
                      }}
                      className="rounded-lg bg-white/[0.06] px-2 py-1 text-[10px] text-slate-500 hover:bg-white/[0.1]"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => deleteArticle(article.id)}
                      className="rounded-lg bg-red-500/10 px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/20"
                    >
                      删除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== 游戏管理 =====
function AdminGames() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/games?pageSize=100")
      .then((r) => r.ok && r.json())
      .then((data) => setGames(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-10 text-center text-sm text-slate-600">加载中...</div>;

  return (
    <div>
      {games.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-600">暂无游戏数据</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <div key={game.id} className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 text-lg">
                  🎮
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-200">{game.name}</div>
                  {game.nameEn && <div className="text-[10px] text-slate-600">{game.nameEn}</div>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {game.genre && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-500">{game.genre}</span>}
                {game.theme && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-500">{game.theme}</span>}
                {game.developer && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-500">{game.developer}</span>}
              </div>
              <a href={`/game/${game.id}`} className="mt-3 inline-block text-[10px] text-cyan-500 hover:text-cyan-400">
                查看详情 →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== 信息源管理 =====
function AdminSources() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sources")
      .then((r) => r.ok && r.json())
      .then((data) => setSources(data.items || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-10 text-center text-sm text-slate-600">加载中...</div>;

  return (
    <div>
      {sources.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-600">暂无信息源配置</div>
      ) : (
        <div className="space-y-2">
          {sources.map((source) => (
            <div key={source.id} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-200">{source.name}</div>
                  <div className="mt-0.5 text-[10px] text-slate-600">
                    {source.type} · {source.language} · {source.url}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${source.enabled ? "bg-emerald-500" : "bg-slate-600"}`} />
                  <span className="text-[10px] text-slate-500">{source.enabled ? "启用" : "禁用"}</span>
                  {source.lastCrawled && (
                    <span className="text-[10px] text-slate-600">最后采集：{new Date(source.lastCrawled).toLocaleString("zh-CN")}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== 采集日志 =====
function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/logs")
      .then((r) => r.ok && r.json())
      .then((data) => setLogs(data.items || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-10 text-center text-sm text-slate-600">加载中...</div>;

  return (
    <div>
      {logs.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-600">暂无采集日志</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${log.status === "success" ? "bg-emerald-500" : log.status === "partial" ? "bg-amber-500" : "bg-red-500"}`} />
                  <div>
                    <div className="text-sm font-medium text-slate-200">{log.source}</div>
                    <div className="text-[10px] text-slate-600">{log.date}</div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  <div>总计 {log.totalItems} · 新增 {log.newItems}</div>
                  {log.duration && <div>{log.duration}秒</div>}
                </div>
              </div>
              {log.errors && (
                <div className="mt-2 rounded-lg bg-red-500/10 p-2 text-[10px] text-red-400">
                  {log.errors}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
