"use client";

import { useEffect, useState, useCallback } from "react";
import { COLUMNS, getColumn, COLUMN_TAG_COLORS } from "@/lib/columns";
import type { ArticleData, DashboardStats } from "@/lib/types";

// ===== 首页组件 =====
export default function HomePage() {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeColumn, setActiveColumn] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [collecting, setCollecting] = useState(false);
  const [collectResult, setCollectResult] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeColumn !== "all") params.set("column", activeColumn);
      if (timeFilter !== "all") params.set("time", timeFilter);
      params.set("status", "published");

      const [articlesRes, statsRes] = await Promise.all([
        fetch(`/api/articles?${params}`),
        fetch("/api/stats"),
      ]);

      if (articlesRes.ok) {
        const data = await articlesRes.json();
        setArticles(data.items || data);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error("加载数据失败:", err);
    } finally {
      setLoading(false);
    }
  }, [activeColumn, timeFilter]);

  // 自动刷新
  useEffect(() => {
    loadData();
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData, autoRefresh]);

  // 手动采集
  const handleCollect = async () => {
    setCollecting(true);
    setCollectResult(null);
    try {
      const res = await fetch("/api/collect", { method: "POST" });
      const data = await res.json();
      setCollectResult(`采集完成：新增 ${data.newItems || 0} 条，共 ${data.totalItems || 0} 条`);
      loadData();
    } catch (err) {
      setCollectResult("采集失败，请查看控制台");
    } finally {
      setCollecting(false);
    }
  };

  const timeFilters = [
    { id: "all", label: "全部" },
    { id: "today", label: "今日" },
    { id: "yesterday", label: "昨日" },
    { id: "week", label: "本周" },
    { id: "month", label: "本月" },
  ];

  const filteredArticles = articles;

  return (
    <div className="space-y-6">
      {/* ===== 顶部统计 ===== */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          label="今日新增"
          value={stats?.todayNewArticles ?? "-"}
          icon="📰"
          color="border-l-cyan-500"
        />
        <StatCard
          label="已发布文章"
          value={stats?.publishedArticles ?? "-"}
          icon="✅"
          color="border-l-emerald-500"
        />
        <StatCard
          label="游戏资料库"
          value={stats?.totalGames ?? "-"}
          icon="🎮"
          color="border-l-violet-500"
        />
        <StatCard
          label="待审核"
          value={stats?.pendingReview ?? "-"}
          icon="⏳"
          color="border-l-amber-500"
        />
      </section>

      {/* ===== 操作栏 ===== */}
      <section className="glass-card-strong p-4">
        <div className="flex flex-col gap-4">
          {/* 第一行：采集按钮 + 自动刷新 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCollect}
                disabled={collecting}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-500 hover:to-purple-500 disabled:opacity-50"
              >
                {collecting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    采集中...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    采集情报
                  </>
                )}
              </button>
              {collectResult && (
                <span className="text-xs text-slate-400 animate-fade-in">{collectResult}</span>
              )}
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
              />
              自动刷新
            </label>
          </div>

          {/* 第二行：时间筛选 */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {timeFilters.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeFilter(tf.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  timeFilter === tf.id
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* 第三行：栏目标签 */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveColumn("all")}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all ${
                activeColumn === "all"
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              全部
            </button>
            {COLUMNS.map((col) => (
              <button
                key={col.id}
                onClick={() => setActiveColumn(col.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  activeColumn === col.id
                    ? `${COLUMN_TAG_COLORS[col.id]} border`
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
              >
                {col.icon} {col.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 文章列表 ===== */}
      <section>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card overflow-hidden">
                <div className="skeleton h-40 w-full" />
                <div className="space-y-2 p-4">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-sm">暂无情报数据</p>
            <p className="mt-1 text-xs text-slate-700">点击上方「采集情报」按钮开始采集</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article, index) => (
              <ArticleCard key={article.id} article={article} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ===== 统计卡片 =====
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}) {
  return (
    <div className={`glass-card border-l-2 ${color} p-3 sm:p-4`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-sm">{icon}</span>
      </div>
      <p className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
    </div>
  );
}

// ===== 文章卡片 =====
function ArticleCard({ article, index }: { article: ArticleData; index: number }) {
  const col = getColumn(article.column);
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <a
      href={`/article/${article.id}`}
      className={`glass-card group overflow-hidden animate-fade-in stagger-${(index % 6) + 1}`}
    >
      {/* 封面图 */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="text-3xl">{col?.icon || "📄"}</div>
              <div className="mt-1 text-xs text-slate-600">{col?.label || "情报"}</div>
            </div>
          </div>
        )}
        {/* 栏目标签 */}
        <div className="absolute left-2 top-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              COLUMN_TAG_COLORS[article.column] || "bg-slate-500/20 text-slate-300"
            }`}
          >
            {col?.icon} {col?.label || article.column}
          </span>
        </div>
        {/* 相关性评分 */}
        {article.relevanceScore != null && article.relevanceScore > 0 && (
          <div className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-slate-400 backdrop-blur-sm">
            {article.relevanceScore}%
          </div>
        )}
      </div>

      {/* 内容 */}
      <div className="p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-200 transition-colors group-hover:text-cyan-400 sm:text-base">
          {article.title}
        </h3>
        {article.summary && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {article.summary}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-600">
          <div className="flex items-center gap-2">
            {article.sourceName && <span>{article.sourceName}</span>}
            {article.gameName && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-slate-500">{article.gameName}</span>
              </>
            )}
          </div>
          {publishedDate && <span>{publishedDate}</span>}
        </div>
      </div>
    </a>
  );
}
