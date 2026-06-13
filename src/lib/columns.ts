// ===== SLG手游情报与产品分析网站 - 栏目定义 =====
// 12个专业栏目，覆盖情报采集、产品分析、行业研究全链路

import type { ColumnDef } from './types';

export const COLUMNS: ColumnDef[] = [
  {
    id: 'daily_brief',
    label: '每日简报',
    description: '每日SLG行业情报精选，汇总当日最重要的新闻、产品动态和市场趋势',
    icon: '📋',
    color: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-600',
    priority: 1,
  },
  {
    id: 'new_game',
    label: '新游观察',
    description: '新上线/测试的SLG游戏情报，包括包体信息、测试数据、市场表现',
    icon: '🆕',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-600',
    priority: 2,
  },
  {
    id: 'product_review',
    label: '产品测评',
    description: 'SLG产品深度测评，从题材、美术、玩法、商业化等多维度分析',
    icon: '🔍',
    color: 'text-sky-400',
    gradient: 'from-sky-500 to-blue-600',
    priority: 3,
  },
  {
    id: 'gameplay_analysis',
    label: '玩法拆解',
    description: 'SLG核心玩法、战斗系统、城建、养成、联盟等系统深度拆解',
    icon: '⚙️',
    color: 'text-violet-400',
    gradient: 'from-violet-500 to-purple-600',
    priority: 4,
  },
  {
    id: 'chart_analysis',
    label: '榜单观察',
    description: 'App Store/Google Play/第三方榜单数据解读，排名变化与趋势分析',
    icon: '📊',
    color: 'text-cyan-400',
    gradient: 'from-cyan-500 to-indigo-600',
    priority: 5,
  },
  {
    id: 'ad_creative',
    label: '买量素材',
    description: 'SLG广告素材创意观察、投放策略分析、素材趋势与转化效果',
    icon: '🎬',
    color: 'text-pink-400',
    gradient: 'from-pink-500 to-rose-600',
    priority: 6,
  },
  {
    id: 'version_update',
    label: '版本更新',
    description: '重点SLG产品版本更新分析，新玩法/新赛季/运营活动解读',
    icon: '🔄',
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-cyan-600',
    priority: 7,
  },
  {
    id: 'industry_news',
    label: '行业动态',
    description: 'SLG厂商动态、投融资、人事变动、行业政策与合规信息',
    icon: '🏢',
    color: 'text-indigo-400',
    gradient: 'from-indigo-500 to-violet-600',
    priority: 8,
  },
  {
    id: 'overseas',
    label: '海外市场',
    description: '海外SLG市场情报，各地区表现、本地化策略、出海案例分析',
    icon: '🌍',
    color: 'text-teal-400',
    gradient: 'from-teal-500 to-emerald-600',
    priority: 9,
  },
  {
    id: 'deep_dive',
    label: '深度专题',
    description: 'SLG行业深度研究，品类趋势、用户洞察、商业模式分析',
    icon: '📚',
    color: 'text-rose-400',
    gradient: 'from-rose-500 to-red-600',
    priority: 10,
  },
  {
    id: 'data_report',
    label: '数据报告',
    description: 'SLG相关数据报告、行业白皮书、用户调研数据解读',
    icon: '📈',
    color: 'text-orange-400',
    gradient: 'from-orange-500 to-amber-600',
    priority: 11,
  },
  {
    id: 'game_database',
    label: '产品资料库',
    description: 'SLG产品数据库，收录各款SLG游戏的详细资料与分析数据',
    icon: '🗄️',
    color: 'text-slate-400',
    gradient: 'from-slate-500 to-gray-600',
    priority: 12,
  },
];

/** 根据ID获取栏目定义 */
export function getColumn(id: string): ColumnDef | undefined {
  return COLUMNS.find((c) => c.id === id);
}

/** 根据优先级排序的栏目列表 */
export function getColumnsByPriority(): ColumnDef[] {
  return [...COLUMNS].sort((a, b) => a.priority - b.priority);
}

/** 获取高优先级栏目（首页展示） */
export function getFeaturedColumns(): ColumnDef[] {
  return COLUMNS.filter((c) => c.priority <= 6);
}

/** 栏目ID列表 */
export const COLUMN_IDS = COLUMNS.map((c) => c.id);

/** 栏目标签映射（用于UI标签颜色） */
export const COLUMN_TAG_COLORS: Record<string, string> = {
  daily_brief: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  new_game: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  product_review: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  gameplay_analysis: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  chart_analysis: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  ad_creative: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  version_update: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  industry_news: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  overseas: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  deep_dive: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  data_report: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  game_database: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};
