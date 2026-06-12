export const CATEGORIES = [
  { id: "new_game_test", label: "新游戏测试", icon: "🎮", color: "from-cyan-500 to-blue-600" },
  { id: "new_package", label: "新包体", icon: "📦", color: "from-emerald-500 to-teal-600" },
  { id: "news", label: "手游新闻", icon: "📰", color: "from-sky-500 to-indigo-600" },
  { id: "slg_review", label: "SLG品类测评", icon: "⚔️", color: "from-amber-500 to-orange-600" },
  { id: "company", label: "手游公司情况", icon: "🏢", color: "from-violet-500 to-purple-600" },
  { id: "update", label: "手游更新情况", icon: "🔄", color: "from-blue-500 to-cyan-600" },
  { id: "ad", label: "手游广告情况", icon: "📢", color: "from-pink-500 to-rose-600" },
  { id: "shell_package", label: "手游马甲包", icon: "🎭", color: "from-fuchsia-500 to-pink-600" },
  { id: "audience", label: "手游人群情况", icon: "👥", color: "from-green-500 to-emerald-600" },
  { id: "ad_audience", label: "广告人群情况", icon: "🎯", color: "from-red-500 to-orange-600" },
  { id: "ad_analysis", label: "手游广告分析", icon: "📊", color: "from-indigo-500 to-violet-600" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function getCategory(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}
