"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getColumn, COLUMN_TAG_COLORS } from "@/lib/columns";
import type { ArticleData } from "@/lib/types";

export default function ArticleDetailPage() {
  const params = useParams();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/articles/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("文章不存在");
          throw new Error("加载失败");
        }
        setArticle(await res.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-8">
        <div className="skeleton h-8 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-64 w-full" />
        <div className="space-y-3">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-4 w-4/6" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-600">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-sm">{error || "文章不存在"}</p>
        <a href="/" className="mt-4 text-xs text-cyan-500 hover:text-cyan-400">
          返回首页
        </a>
      </div>
    );
  }

  const col = getColumn(article.column);
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // 解析关键信息
  let keyPoints: string[] = [];
  try {
    if (article.keyPoints) {
      keyPoints = JSON.parse(article.keyPoints);
    }
  } catch {
    keyPoints = article.keyPoints ? [article.keyPoints] : [];
  }

  return (
    <article className="mx-auto max-w-3xl">
      {/* 返回导航 */}
      <a
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回首页
      </a>

      {/* 封面图 */}
      {article.imageUrl && (
        <div className="relative mb-8 overflow-hidden rounded-2xl">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full object-cover"
            style={{ maxHeight: "400px" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-transparent to-transparent" />
        </div>
      )}

      {/* 标题区 */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              COLUMN_TAG_COLORS[article.column] || "bg-slate-500/20 text-slate-300"
            }`}
          >
            {col?.icon} {col?.label || article.column}
          </span>
          {article.relevanceScore != null && article.relevanceScore > 0 && (
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs text-cyan-400 border border-cyan-500/20">
              相关性 {article.relevanceScore}%
            </span>
          )}
          {article.status === "published" && (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400 border border-emerald-500/20">
              已发布
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold leading-tight text-slate-100 sm:text-3xl">
          {article.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {article.sourceName && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              {article.sourceName}
            </span>
          )}
          {publishedDate && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {publishedDate}
            </span>
          )}
          {article.gameName && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {article.gameName}
            </span>
          )}
          {article.companyName && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {article.companyName}
            </span>
          )}
        </div>
      </header>

      {/* 摘要 */}
      {article.summary && (
        <div className="mb-8 rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-4">
          <p className="text-sm leading-relaxed text-slate-300">{article.summary}</p>
        </div>
      )}

      {/* 关键信息 */}
      {keyPoints.length > 0 && (
        <div className="mb-8 rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
          <h3 className="mb-3 text-sm font-semibold text-amber-400">核心信息</h3>
          <ul className="space-y-2">
            {keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500/50" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 正文 */}
      {article.content && (
        <div className="article-content mb-8">
          {article.content.split("\n").map((paragraph, i) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return null;
            return (
              <p key={i} className="mb-4 text-sm leading-relaxed text-slate-400 sm:text-base sm:leading-7">
                {trimmed}
              </p>
            );
          })}
        </div>
      )}

      {/* 分析 */}
      {article.analysis && (
        <div className="mb-8 rounded-xl border border-violet-500/10 bg-violet-500/5 p-4">
          <h3 className="mb-3 text-sm font-semibold text-violet-400">SLG产品分析</h3>
          <p className="text-sm leading-relaxed text-slate-300">{article.analysis}</p>
        </div>
      )}

      {/* 从业者启示 */}
      {article.insights && (
        <div className="mb-8 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
          <h3 className="mb-3 text-sm font-semibold text-emerald-400">从业者启示</h3>
          <p className="text-sm leading-relaxed text-slate-300">{article.insights}</p>
        </div>
      )}

      {/* 底部信息 */}
      <footer className="border-t border-white/[0.06] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            {article.sourceUrl && (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-cyan-500 hover:text-cyan-400 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                查看原文
              </a>
            )}
            {article.sourceType && (
              <span className="text-slate-700">
                来源类型：{article.sourceType === "official" ? "官方" : article.sourceType === "media" ? "媒体" : article.sourceType === "data" ? "数据平台" : "社区"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {article.credibility && (
              <span>可信度：{"★".repeat(article.credibility)}{"☆".repeat(5 - article.credibility)}</span>
            )}
            {article.region && <span>地区：{article.region}</span>}
          </div>
        </div>
      </footer>
    </article>
  );
}
