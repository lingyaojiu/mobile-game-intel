"use client";

import { useEffect, useState } from "react";
import type { GameData } from "@/lib/types";

export default function GamesPage() {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (search) params.set("q", search);
        const res = await fetch(`/api/games?${params}`);
        if (res.ok) {
          const data = await res.json();
          setGames(data.items || data);
        }
      } catch (err) {
        console.error("加载游戏列表失败:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [search]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">游戏资料库</h1>
        <p className="mt-1 text-sm text-slate-500">SLG产品数据库，收录各款游戏的详细资料与分析数据</p>
      </div>

      {/* 搜索 */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索游戏名称..."
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
        />
      </div>

      {/* 游戏列表 */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <div className="skeleton h-32 w-full" />
              <div className="space-y-2 p-4">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600">
          <div className="text-4xl mb-4">🎮</div>
          <p className="text-sm">暂无游戏数据</p>
          <p className="mt-1 text-xs text-slate-700">采集文章时会自动关联游戏</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <a
              key={game.id}
              href={`/game/${game.id}`}
              className="glass-card group overflow-hidden"
            >
              {/* 封面 */}
              <div className="relative h-32 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                {game.imageUrl ? (
                  <img
                    src={game.imageUrl}
                    alt={game.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl">🎮</div>
                      <div className="mt-1 text-xs text-slate-600">{game.genre || "SLG"}</div>
                    </div>
                  </div>
                )}
                {/* 类型标签 */}
                {game.genre && (
                  <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-slate-300 backdrop-blur-sm">
                    {game.genre}
                  </span>
                )}
              </div>
              {/* 信息 */}
              <div className="p-4">
                <h3 className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                  {game.name}
                </h3>
                {game.nameEn && (
                  <p className="mt-0.5 text-xs text-slate-600">{game.nameEn}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500">
                  {game.developer && <span>开发商：{game.developer}</span>}
                  {game.theme && <span>题材：{game.theme}</span>}
                  {game.launchDate && <span>上线：{game.launchDate}</span>}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
