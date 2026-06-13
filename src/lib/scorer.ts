// ===== SLG手游情报与产品分析网站 - 相关性评分器 =====
// 基于SLG行业关键词库，对采集的文章进行相关性评分和自动分类

/** SLG相关关键词权重 */
const SLG_KEYWORDS: Record<string, number> = {
  // 核心SLG品类词
  'slg': 100,
  '策略游戏': 90,
  '策略': 60,
  '4x': 80,
  '率土like': 80,
  '率土': 70,
  '三国志战略版': 70,
  '三战': 70,
  '三谋': 70,
  '三国谋定天下': 70,
  '万国觉醒': 70,
  'rok': 70,
  'rise of kingdoms': 70,
  '列王的纷争': 70,
  'clash of clans': 60,
  'coc': 60,
  '部落冲突': 60,
  '王国纪元': 70,
  'lords mobile': 70,
  'last fortress': 60,
  'last shelter': 60,
  '无尽的拉格朗日': 70,
  '拉格朗日': 60,
  '率土之滨': 70,
  '重返帝国': 60,
  '文明': 60,
  'civ': 50,
  '文明与征服': 60,
  '征服与霸业': 60,
  '鸿图之下': 60,
  '荣耀新三国': 50,
  '烽火之争': 50,
  '七雄争霸': 50,
  '三国': 40,
  '三國': 40,
  '战国': 40,
  '战國': 40,

  // SLG玩法机制
  '赛季制': 60,
  '赛季': 40,
  '大地图': 50,
  '沙盘': 50,
  '沙盒': 40,
  '自由行军': 50,
  '实时对战': 40,
  '回合制': 30,
  '攻城': 50,
  '攻城战': 60,
  '联盟战': 50,
  'gvg': 60,
  'pvp': 40,
  'pve': 30,
  '组队': 30,
  '公会': 40,
  '联盟': 40,
  '城建': 40,
  '内政': 40,
  '科技树': 40,
  '兵种': 50,
  '武将': 50,
  '英雄': 40,
  '卡牌': 30,
  '抽卡': 30,

  // SLG商业化
  '买量': 60,
  '投放': 50,
  '素材': 50,
  '广告': 40,
  'roi': 50,
  'lTV': 50,
  'ltv': 50,
  'arpu': 50,
  '付费': 40,
  '充值': 30,
  '月卡': 30,
  '通行证': 30,
  'battle pass': 40,

  // SLG市场与运营
  '上线': 30,
  '公测': 40,
  '测试': 30,
  '开服': 30,
  '新服': 30,
  '合服': 30,
  '停服': 30,
  '出海': 50,
  '海外': 40,
  '全球化': 40,
  '本地化': 40,
  '日服': 40,
  '韩服': 40,
  '欧美': 40,
  '东南亚': 40,

  // 厂商
  '网易': 30,
  '腾讯': 30,
  '阿里': 30,
  '米哈游': 30,
  '莉莉丝': 40,
  'funplus': 50,
  'fun plus': 50,
  '点点互动': 40,
  '三七': 30,
  '灵犀互娱': 40,
  '灵犀': 30,
  'bilibili': 20,
  '哔哩哔哩': 20,
  '游族': 30,
  '完美世界': 30,
  '冰川网络': 30,
  '壳木游戏': 40,
  '壳木': 30,
  '江娱互动': 40,
  'tap4fun': 40,
  '龙创悦动': 40,
  '智明星通': 40,
  'igG': 40,
  '沐瞳': 30,
  '海彼': 30,

  // 数据平台
  'sensor tower': 50,
  'data.ai': 50,
  'appannie': 40,
  'app growing': 50,
  '广大大': 50,
  '七麦': 40,
  '点点数据': 40,

  // 游戏题材（仅保留与SLG核心词不重复的）
  '历史': 30,
  '奇幻': 30,
  '魔幻': 30,
  '科幻': 30,
  '末日': 40,
  '丧尸': 40,
  '僵尸': 30,
  '黑道': 40,
  '黑帮': 40,
  '海盗': 30,
  '航海': 30,
  '维京': 30,
  '西方': 20,
  '东方': 20,
  '中世纪': 30,
  '现代': 20,
  '未来': 20,
  '太空': 30,
  '星际': 30,

  // 美术风格
  '写实': 20,
  '卡通': 20,
  'q版': 20,
  '国风': 20,
  '日式': 20,
  '韩式': 20,
};

/** 栏目关键词映射 */
const COLUMN_KEYWORDS: Record<string, string[]> = {
  new_game: ['上线', '公测', '测试', '开服', '新游', '新游戏', '新包', '预约', '新作', '曝光', '首曝'],
  product_review: ['测评', '评测', '评价', '体验', '试玩', '分析', '深度', 'review', 'review'],
  gameplay_analysis: ['玩法', '系统', '机制', '战斗', '城建', '养成', '联盟', '赛季', '拆解', '设计'],
  chart_analysis: ['榜单', '排名', '排行', '收入', '下载', '畅销', '免费榜', 'sensor tower', 'data.ai', '七麦'],
  ad_creative: ['买量', '投放', '素材', '广告', 'roi', '转化', '创意', '视频素材', '投放策略'],
  version_update: ['版本', '更新', '新赛季', '新版本', '活动', '新玩法', '赛季更新', '大版本'],
  industry_news: ['收购', '投资', '融资', 'ipo', '上市', '财报', '营收', '利润', '裁员', '人事', '变动', '合作'],
  overseas: ['出海', '海外', '全球化', '本地化', '日服', '韩服', '欧美', '东南亚', '日本', '韩国', '美国'],
  deep_dive: ['深度', '研究', '趋势', '洞察', '报告', '白皮书', '行业', '市场', '用户', '分析'],
  data_report: ['数据', '报告', '白皮书', '调研', '统计', '占比', '增长率', '同比', '环比'],
};

/** 游戏名称提取正则 */
const GAME_NAME_PATTERNS = [
  /《([^》]+)》/g,
  /「([^」]+)」/g,
  /"([^"]+)"/g,
  /'([^']+)'/g,
];

/** 公司名称常见后缀 */
const COMPANY_SUFFIXES = ['游戏', '科技', '互动', '网络', '娱乐', '工作室', 'digital', 'games', 'studio', 'entertainment'];

/**
 * 计算文章与SLG的相关性评分 (0-100)
 */
export function calculateRelevance(title: string, content: string): number {
  const text = `${title} ${content || ''}`.toLowerCase();
  let score = 0;
  let matchedKeywords = 0;

  for (const [keyword, weight] of Object.entries(SLG_KEYWORDS)) {
    if (text.includes(keyword.toLowerCase())) {
      score += weight;
      matchedKeywords++;
    }
  }

  // 基础分：只要匹配到任何SLG关键词就给30分
  if (matchedKeywords > 0) {
    score += 30;
  }

  // 标题命中加权（标题命中权重翻倍）
  const titleLower = title.toLowerCase();
  for (const [keyword, weight] of Object.entries(SLG_KEYWORDS)) {
    if (titleLower.includes(keyword.toLowerCase())) {
      score += weight;
    }
  }

  // 限制在0-100范围
  return Math.min(100, Math.max(0, score));
}

/**
 * 自动判断文章所属栏目
 */
export function autoClassify(title: string, content: string): string {
  const text = `${title} ${content || ''}`.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [column, keywords] of Object.entries(COLUMN_KEYWORDS)) {
    scores[column] = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        scores[column]++;
      }
    }
  }

  // 标题命中加权
  const titleLower = title.toLowerCase();
  for (const [column, keywords] of Object.entries(COLUMN_KEYWORDS)) {
    for (const kw of keywords) {
      if (titleLower.includes(kw)) {
        scores[column] += 3;
      }
    }
  }

  // 取最高分栏目
  let bestColumn = 'industry_news'; // 默认
  let bestScore = 0;
  for (const [column, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestColumn = column;
    }
  }

  return bestColumn;
}

/**
 * 从文章内容中提取可能的游戏名称
 */
export function extractGameNames(title: string, content: string): string[] {
  const text = `${title} ${content || ''}`;
  const names: string[] = [];

  for (const pattern of GAME_NAME_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const name = match[1].trim();
      if (name.length >= 2 && name.length <= 20) {
        names.push(name);
      }
    }
  }

  return [...new Set(names)];
}

/**
 * 从文章内容中提取可能的公司名称
 */
export function extractCompanyNames(title: string, content: string): string[] {
  const text = `${title} ${content || ''}`;
  const names: string[] = [];

  // 匹配 "XX公司" 模式
  const companyPattern = /([\u4e00-\u9fa5a-zA-Z]{2,10}(?:公司|集团|工作室|社))/g;
  const matches = text.matchAll(companyPattern);
  for (const match of matches) {
    names.push(match[1]);
  }

  return [...new Set(names)];
}

/**
 * 评估信息来源可信度 (1-5)
 */
export function evaluateCredibility(sourceName: string, sourceType: string): number {
  const credibilityMap: Record<string, number> = {
    'game_look': 4,
    '游戏茶馆': 4,
    '游戏陀螺': 4,
    '游戏葡萄': 4,
    'gamelook': 4,
    '游民星空': 3,
    'taptap': 3,
    '微信公众号': 3,
    'bilibili': 2,
    '知乎': 2,
    '贴吧': 1,
    '论坛': 1,
  };

  if (sourceType === 'official') return 5;
  if (sourceType === 'data') return 4;

  return credibilityMap[sourceName] || 3;
}

/**
 * 判断是否为SLG相关内容（快速过滤）
 */
export function isSLGRelated(title: string, content: string): boolean {
  const score = calculateRelevance(title, content);
  return score >= 20; // 阈值：20分以上算相关
}

/**
 * 生成文章摘要（截取前150字）
 */
export function generateSummary(content: string, maxLength = 150): string {
  if (!content) return '';
  const cleaned = content
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength) + '...';
}
