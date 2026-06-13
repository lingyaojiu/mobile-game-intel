"use client";

import { useEffect, useState, useCallback } from "react";
import { COLUMNS, COLUMN_TAG_COLORS } from "@/lib/columns";
import type { ArticleData } from "@/lib/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    column: "",
    status: "published",
    time: "",
    sortBy: "publishedAt",
  });

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filters.column) params.set("column", filters.column);
      if (filters.status) params.set("status", filters.status);
      if (filters.time) params.set("time", filters.time);
      params.set("sortBy", filters.sortBy);
      params.set("pageSize", "100");

      const res = await fetch(`/api/articles?${params}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("搜索失败:", err);
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  useEffect(() => {
    doSearch();
  }, [doSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") doSearch();
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">搜索</h1>
        <p className="mt-1 text-sm text-slate-500">全文搜索文章、游戏、公司信息</p>
      </div>

      {/* 搜索框 */}
      <div className="glass-card-strong p-4 space-y-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索文章标题、内容、游戏名称..."
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
          />
        </div>

        {/* 筛选条件 */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.column}
            onChange={(e) => setFilters({ ...filters, column: e.target.value })}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 focus:border-cyan-500/30 focus:outline-none"
          >
            <option value="">全部栏目</option>
            {COLUMNS.map((col) => (
              <option key={col.id} value={col.id}>{col.icon} {col.label}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 focus:border-cyan-500/30 focus:outline-none"
          >
            <option value="published">已发布</option>
            <option value="pending_review">待审核</option>
            <option value="candidate">候选</option>
            <option value="">全部状态</option>
          </select>
          <select
            value={filters.time}
            onChange={(e) => setFilters({ ...filters, time: e.target.value })}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 focus:border-cyan-500/30 focus:outline-none"
          >
            <option value="">全部时间</option>
            <option value="today">今日</option>
            <option value="yesterday">昨日</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
          </select>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 focus:border-cyan-500/30 focus:outline-none"
          >
            <option value="publishedAt">按发布时间</option>
            <option value="relevanceScore">按相关性</option>
            <option value="createdAt">按采集时间</option>
          </select>
        </div>
      </div>

      {/* 结果统计 */}
      <div className="text-xs text-slate-600">
        共找到 <span className="text-slate-400">{total}</span> 条结果
        {query && <span>，关键词：<span className="text-cyan-500">&ldquo;{query}&rdquo;</span></span>}
      </div>

      {/* 结果列表 */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card p-4">
              <div className="skeleton h-4 w-3/4 mb-2" />
              <div className="skeleton h-3 w-full" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-sm">未找到匹配结果</p>
          <p className="mt-1 text-xs text-slate-700">尝试更换关键词或调整筛选条件</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const col = COLUMNS.find((c) => c.id === article.column);
            return (
              <a
                key={article.id}
                href={`/article/${article.id}`}
                className="glass-card flex items-start gap-4 p-4 group"
              >
                {article.imageUrl && (
                  <div className="hidden h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg sm:block">
                    <img src={article.imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${COLUMN_TAG_COLORS[article.column] || ""}`}>
                      {col?.icon} {col?.label || article.column}
                    </span>
                    {article.relevanceScore != null && article.relevanceScore > 0 && (
                      <span className="text-[10px] text-cyan-500/70">{article.relevanceScore}%</span>
                    )}
                    {article.publishedAt && (
                      <span className="text-[10px] text-slate-600">
                        {new Date(article.publishedAt).toLocaleDateString("zh-CN")}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{article.summary}</p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-600">
                    {article.sourceName && <span>{article.sourceName}</span>}
                    {article.gameName && <span>· {article.gameName}</span>}
                    {article.companyName && <span>· {article.companyName}</span>}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
