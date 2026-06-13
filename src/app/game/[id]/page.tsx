"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getColumn, COLUMN_TAG_COLORS } from "@/lib/columns";
import type { GameData, ArticleData } from "@/lib/types";

export default function GameDetailPage() {
  const params = useParams();
  const [game, setGame] = useState<GameData | null>(null);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [gameRes, articlesRes] = await Promise.all([
          fetch(`/api/games/${params.id}`),
          fetch(`/api/articles?gameId=${params.id}&status=published&pageSize=50`),
        ]);
        if (gameRes.ok) setGame(await gameRes.json());
        if (articlesRes.ok) {
          const data = await articlesRes.json();
          setArticles(data.items || []);
        }
      } catch (err) {
        console.error("加载游戏详情失败:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <div className="skeleton h-48 w-full rounded-2xl" />
        <div className="skeleton h-6 w-1/3" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-600">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-sm">游戏不存在</p>
        <a href="/games" className="mt-4 text-xs text-cyan-500 hover:text-cyan-400">返回游戏库</a>
      </div>
    );
  }

  const infoFields = [
    { label: "英文名称", value: game.nameEn },
    { label: "开发商", value: game.developer },
    { label: "发行商", value: game.publisher },
    { label: "上线时间", value: game.launchDate },
    { label: "主要市场", value: game.markets },
    { label: "游戏题材", value: game.theme },
    { label: "游戏类型", value: game.genre },
    { label: "美术风格", value: game.artStyle },
    { label: "核心玩法", value: game.coreGameplay },
    { label: "战斗方式", value: game.combatSystem },
    { label: "城建系统", value: game.buildingSystem },
    { label: "养成系统", value: game.progression },
    { label: "联盟系统", value: game.allianceSystem },
    { label: "赛季系统", value: game.seasonSystem },
    { label: "商业化方式", value: game.monetization },
  ].filter((f) => f.value);

  return (
    <div className="mx-auto max-w-4xl">
      {/* 返回导航 */}
      <a href="/games" className="mb-6 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回游戏库
      </a>

      {/* 头部 */}
      <div className="glass-card-strong overflow-hidden mb-8">
        <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 sm:h-64">
          {game.imageUrl ? (
            <img src={game.imageUrl} alt={game.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="text-6xl">🎮</div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{game.name}</h1>
            {game.nameEn && <p className="mt-1 text-sm text-slate-400">{game.nameEn}</p>}
          </div>
        </div>

        {/* 信息网格 */}
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-6">
          {infoFields.map((field) => (
            <div key={field.label}>
              <dt className="text-[10px] text-slate-600 uppercase tracking-wider">{field.label}</dt>
              <dd className="mt-0.5 text-sm text-slate-300">{field.value}</dd>
            </div>
          ))}
        </div>
      </div>

      {/* 描述 */}
      {game.description && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-200">游戏简介</h2>
          <p className="text-sm leading-relaxed text-slate-400">{game.description}</p>
        </div>
      )}

      {/* 链接 */}
      <div className="mb-8 flex flex-wrap gap-3">
        {game.officialUrl && (
          <a href={game.officialUrl} target="_blank" rel="noopener noreferrer"
             className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.1] transition-all">
            官网
          </a>
        )}
        {game.appStoreUrl && (
          <a href={game.appStoreUrl} target="_blank" rel="noopener noreferrer"
             className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.1] transition-all">
            App Store
          </a>
        )}
        {game.googlePlayUrl && (
          <a href={game.googlePlayUrl} target="_blank" rel="noopener noreferrer"
             className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.1] transition-all">
            Google Play
          </a>
        )}
      </div>

      {/* 相关文章 */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-200">
          相关文章
          <span className="ml-2 text-sm font-normal text-slate-600">({articles.length}篇)</span>
        </h2>
        {articles.length === 0 ? (
          <p className="text-sm text-slate-600">暂无相关文章</p>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => {
              const col = getColumn(article.column);
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
                      {article.publishedAt && (
                        <span className="text-[10px] text-slate-600">
                          {new Date(article.publishedAt).toLocaleDateString("zh-CN")}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-slate-200 group-hover:text-cyan-400 transition-colors line-clamp-1">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">{article.summary}</p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
