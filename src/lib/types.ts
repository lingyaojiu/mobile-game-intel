// ===== SLG手游情报与产品分析网站 - 类型定义 =====

// 游戏资料
export interface GameData {
  id: number;
  name: string;
  nameEn: string | null;
  developer: string | null;
  publisher: string | null;
  launchDate: string | null;
  markets: string | null;
  theme: string | null;
  genre: string | null;
  artStyle: string | null;
  coreGameplay: string | null;
  combatSystem: string | null;
  buildingSystem: string | null;
  progression: string | null;
  allianceSystem: string | null;
  seasonSystem: string | null;
  monetization: string | null;
  appStoreUrl: string | null;
  googlePlayUrl: string | null;
  officialUrl: string | null;
  tags: string | null;
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  articles?: ArticleData[];
  _articleCount?: number;
}

// 文章
export interface ArticleData {
  id: number;
  gameId: number | null;
  game?: GameData | null;
  column: string;
  title: string;
  summary: string | null;
  content: string | null;
  background: string | null;
  keyPoints: string | null;
  analysis: string | null;
  insights: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceType: string | null;
  isPrimary: boolean;
  publishedAt: string | null;
  imageUrl: string | null;
  gameName: string | null;
  companyName: string | null;
  region: string | null;
  category: string | null;
  credibility: number | null;
  relevanceScore: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// 公司
export interface CompanyData {
  id: number;
  name: string;
  nameEn: string | null;
  country: string | null;
  website: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// 信息源
export interface SourceData {
  id: number;
  name: string;
  type: string;
  url: string | null;
  rssUrl: string | null;
  language: string;
  enabled: boolean;
  lastCrawled: string | null;
  createdAt: string;
  updatedAt: string;
}

// 标签
export interface TagData {
  id: number;
  name: string;
  type: string;
  createdAt: string;
}

// 每日简报
export interface DailyReportData {
  id: number;
  date: string;
  title: string;
  content: string | null;
  articleCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// 采集日志
export interface CrawlLogData {
  id: number;
  date: string;
  source: string;
  status: string;
  totalItems: number;
  newItems: number;
  errors: string | null;
  duration: number | null;
  createdAt: string;
}

// 审核队列
export interface ReviewQueueData {
  id: number;
  articleId: number;
  action: string | null;
  reviewer: string | null;
  comment: string | null;
  createdAt: string;
}

// 文章状态
export type ArticleStatus = 'candidate' | 'pending_review' | 'published' | 'rejected' | 'archived';

// 栏目ID
export type ColumnId =
  | 'daily_brief'
  | 'new_game'
  | 'product_review'
  | 'gameplay_analysis'
  | 'chart_analysis'
  | 'ad_creative'
  | 'version_update'
  | 'industry_news'
  | 'overseas'
  | 'deep_dive'
  | 'data_report'
  | 'game_database';

// 栏目定义
export interface ColumnDef {
  id: ColumnId;
  label: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  priority: number;
}

// 文章创建输入
export interface CreateArticleInput {
  gameId?: number;
  column: string;
  title: string;
  summary?: string;
  content?: string;
  background?: string;
  keyPoints?: string;
  analysis?: string;
  insights?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceType?: string;
  isPrimary?: boolean;
  publishedAt?: string;
  imageUrl?: string;
  gameName?: string;
  companyName?: string;
  region?: string;
  category?: string;
  credibility?: number;
  relevanceScore?: number;
  status?: string;
}

// 游戏创建输入
export interface CreateGameInput {
  name: string;
  nameEn?: string;
  developer?: string;
  publisher?: string;
  launchDate?: string;
  markets?: string;
  theme?: string;
  genre?: string;
  artStyle?: string;
  coreGameplay?: string;
  combatSystem?: string;
  buildingSystem?: string;
  progression?: string;
  allianceSystem?: string;
  seasonSystem?: string;
  monetization?: string;
  appStoreUrl?: string;
  googlePlayUrl?: string;
  officialUrl?: string;
  tags?: string;
  imageUrl?: string;
  description?: string;
}

// 搜索参数
export interface SearchParams {
  q?: string;
  column?: string;
  status?: string;
  gameId?: number;
  companyName?: string;
  region?: string;
  startDate?: string;
  endDate?: string;
  minScore?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分页结果
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 统计信息
export interface DashboardStats {
  totalArticles: number;
  totalGames: number;
  totalCompanies: number;
  publishedArticles: number;
  pendingReview: number;
  todayNewArticles: number;
  todayCrawlStatus: string | null;
  topGames: { name: string; count: number }[];
  topSources: { name: string; count: number }[];
}
