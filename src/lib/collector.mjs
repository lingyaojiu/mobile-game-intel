/**
 * SLG手游情报自动采集脚本 v7
 * - 适配新Schema（Article模型）
 * - 输出栏目分类、相关性评分、游戏/公司名称
 * - 10+ 采集源
 */

const COLUMN_KEYWORDS = {
  new_game: ["新游", "上线", "公测", "测试", "开服", "预约", "新作", "曝光", "首曝", "launch", "release", "新游戏", "新包"],
  product_review: ["测评", "评测", "评价", "体验", "试玩", "深度", "review", "review"],
  gameplay_analysis: ["玩法", "系统", "机制", "战斗", "城建", "养成", "联盟", "赛季", "拆解", "设计"],
  chart_analysis: ["榜单", "排名", "排行", "收入", "下载", "畅销", "免费榜", "sensor tower", "data.ai", "七麦"],
  ad_creative: ["买量", "投放", "素材", "广告", "roi", "转化", "创意", "视频素材", "投放策略"],
  version_update: ["版本", "更新", "新赛季", "新版本", "活动", "新玩法", "赛季更新", "大版本"],
  industry_news: ["收购", "投资", "融资", "ipo", "上市", "财报", "营收", "利润", "裁员", "人事", "合作"],
  overseas: ["出海", "海外", "全球化", "本地化", "日服", "韩服", "欧美", "东南亚", "日本", "韩国", "美国"],
  deep_dive: ["深度", "研究", "趋势", "洞察", "报告", "白皮书", "行业", "市场", "用户"],
  data_report: ["数据", "报告", "白皮书", "调研", "统计", "占比", "增长率", "同比", "环比"],
};

const SLG_KEYWORDS = {
  'slg': 100, '策略游戏': 90, '策略': 60, '4x': 80, '率土like': 80, '率土': 70,
  '三国志战略版': 70, '万国觉醒': 70, 'rok': 70, 'rise of kingdoms': 70,
  '列王的纷争': 70, 'clash of clans': 60, 'coc': 60, '部落冲突': 60,
  '王国纪元': 70, 'lords mobile': 70, '无尽的拉格朗日': 70, '率土之滨': 70,
  '重返帝国': 60, '文明': 60, '文明与征服': 60, '鸿图之下': 60,
  '三国': 40, '赛季制': 60, '赛季': 40, '大地图': 50, '沙盘': 50,
  '自由行军': 50, '攻城': 50, '攻城战': 60, '联盟战': 50, 'gvg': 60,
  '买量': 60, '投放': 50, '素材': 50, '广告': 40, 'roi': 50, 'ltv': 50, 'arpu': 50,
  '出海': 50, '海外': 40, '全球化': 40, '本地化': 40,
  '网易': 30, '腾讯': 30, '莉莉丝': 40, 'funplus': 50, '点点互动': 40,
  '三七': 30, '灵犀互娱': 40, '灵犀': 30, '游族': 30,
  'sensor tower': 50, 'data.ai': 50, 'app growing': 50, '广大大': 50,
};

const CATEGORY_COLORS = {
  new_game: { bg: "1a3a5c", fg: "06b6d4", icon: "🆕" },
  product_review: { bg: "1a3a4a", fg: "0ea5e9", icon: "🔍" },
  gameplay_analysis: { bg: "2a1a3a", fg: "8b5cf6", icon: "⚙️" },
  chart_analysis: { bg: "1a3a4a", fg: "06b6d4", icon: "📊" },
  ad_creative: { bg: "3a1a2a", fg: "ec4899", icon: "🎬" },
  version_update: { bg: "1a3a5c", fg: "3b82f6", icon: "🔄" },
  industry_news: { bg: "2a1a3a", fg: "6366f1", icon: "🏢" },
  overseas: { bg: "1a4a3a", fg: "14b8a6", icon: "🌍" },
  deep_dive: { bg: "3a1a1a", fg: "f43f5e", icon: "📚" },
  data_report: { bg: "3a2a1a", fg: "f59e0b", icon: "📈" },
};

function calculateRelevance(title, content) {
  const text = `${title} ${content || ''}`.toLowerCase();
  let score = 0;
  let matchedKeywords = 0;
  for (const [keyword, weight] of Object.entries(SLG_KEYWORDS)) {
    if (text.includes(keyword.toLowerCase())) { score += weight; matchedKeywords++; }
  }
  if (matchedKeywords > 0) score += 30;
  const titleLower = title.toLowerCase();
  for (const [keyword, weight] of Object.entries(SLG_KEYWORDS)) {
    if (titleLower.includes(keyword.toLowerCase())) score += weight;
  }
  return Math.min(100, Math.max(0, score));
}

function autoClassify(title, content) {
  const text = `${title} ${content || ''}`.toLowerCase();
  const scores = {};
  for (const [column, keywords] of Object.entries(COLUMN_KEYWORDS)) {
    scores[column] = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) scores[column]++;
      if (title.toLowerCase().includes(kw)) scores[column] += 3;
    }
  }
  let best = 'industry_news', bestScore = 0;
  for (const [col, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; best = col; }
  }
  return best;
}

function extractGameNames(title, content) {
  const text = `${title} ${content || ''}`;
  const names = [];
  const patterns = [/《([^》]+)》/g, /「([^」]+)」/g, /"([^"]+)"/g, /'([^']+)'/g];
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      const name = m[1].trim();
      if (name.length >= 2 && name.length <= 20) names.push(name);
    }
  }
  return [...new Set(names)];
}

function generatePlaceholderImage(title, column) {
  const colors = CATEGORY_COLORS[column] || CATEGORY_COLORS.industry_news;
  const shortTitle = title.length > 30 ? title.substring(0, 28) + "…" : title;
  return `https://placehold.co/400x225/${colors.bg}/${colors.fg}?text=${encodeURIComponent(shortTitle)}&font=noto-sans`;
}

async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    return await response.text();
  } catch { return null; }
}

function extractAllImages(html) {
  const images = [];
  const imgRegex = /<img[^>]*src="([^"]*)"[^>]*>/gi;
  let m;
  while ((m = imgRegex.exec(html)) !== null) {
    const src = m[1];
    if (src.startsWith("http") && !/(logo|icon|avatar|sprite|\.svg|pixel|blank|loading|default|data:image)/i.test(src)) {
      images.push({ src, pos: m.index });
    }
  }
  return images;
}

function findNearestImage(images, pos) {
  const candidates = images.filter(img => (img.pos > pos - 4000 && img.pos < pos + 3000));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => Math.abs(a.pos - pos) - Math.abs(b.pos - pos));
  return candidates[0].src;
}

function extractPublishedTime(html) {
  const patterns = [
    /<time[^>]*datetime="([^"]*)"[^>]*>/i,
    /<time[^>]*>([^<]{10,30})<\/time>/i,
    /<span[^>]*class="[^"]*(?:time|date|pub)[^"]*"[^>]*>([^<]{10,30})<\/span>/i,
    /(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s*\d{1,2}:\d{2})/,
    /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/,
  ];
  for (const pattern of patterns) {
    const m = pattern.exec(html);
    if (m) {
      let timeStr = (m[1] || m[0]).replace(/<[^>]*>/g, "").trim();
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    }
  }
  return null;
}

function extractArticles(html, baseUrl) {
  const articles = [];
  const seen = new Set();
  const allImages = extractAllImages(html);
  const fallbackImages = allImages.map(i => i.src);

  const blocks = [];
  const patterns = [
    /<div[^>]*class="[^"]*(?:item|card|post|entry|news|list|box|pic|img|article|hot|recommend)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<li[^>]*>([\s\S]*?)<\/li>/gi,
    /<section[^>]*>([\s\S]*?)<\/section>/gi,
  ];
  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) blocks.push({ html: m[1], pos: m.index });
  }

  const targets = blocks.length > 0 ? blocks : [{ html, pos: 0 }];

  for (const { html: block, pos: blockPos } of targets) {
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]{6,100})<\/a>/gi;
    let m;
    while ((m = linkRegex.exec(block)) !== null) {
      let href = m[1];
      const text = m[2].replace(/<[^>]*>/g, "").trim();
      if (text.length < 6 || text.length > 80 || seen.has(text)) continue;
      if (/登录|注册|首页|更多|javascript|undefined|null|关于我们|联系/.test(text)) continue;
      if (href.startsWith("//")) href = "https:" + href;
      if (href.startsWith("/")) href = baseUrl + href;
      if (!href.startsWith("http")) continue;
      seen.add(text);

      let imgUrl = null;
      const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const aTagMatch = new RegExp(`<a[^>]*href="[^"]*${escapedHref}"[^>]*>([\\s\\S]*?)<\\/a>`, 'i').exec(html);
      if (aTagMatch) {
        const innerImg = /<img[^>]*src="([^"]*)"[^>]*>/i.exec(aTagMatch[1]);
        if (innerImg && innerImg[1].startsWith("http") && !/(logo|icon|avatar)/i.test(innerImg[1])) imgUrl = innerImg[1];
      }
      if (!imgUrl) {
        const blockImg = /<img[^>]*src="([^"]*)"[^>]*>/i.exec(block);
        if (blockImg) {
          const src = blockImg[1];
          if (src.startsWith("http") && !/(logo|icon|avatar|sprite|\.svg|pixel)/i.test(src)) imgUrl = src;
        }
      }
      if (!imgUrl) {
        const linkPosInHtml = html.indexOf(href);
        if (linkPosInHtml > 0) imgUrl = findNearestImage(allImages, linkPosInHtml);
      }
      if (!imgUrl && fallbackImages.length > 0) {
        for (const fi of fallbackImages) {
          if (!/(logo|icon|avatar)/i.test(fi)) { imgUrl = fi; break; }
        }
      }

      let summary = null;
      const descRegex = /<p[^>]*>([^<]{10,200})<\/p>/gi;
      let descMatch;
      while ((descMatch = descRegex.exec(block)) !== null) {
        const d = descMatch[1].trim();
        if (d.length > 10 && d !== text && !d.includes("javascript")) { summary = d; break; }
      }

      articles.push({
        title: text,
        content: text,
        summary: summary || text.substring(0, 100),
        sourceName: new URL(baseUrl).hostname.replace("www.", ""),
        imageUrl: imgUrl,
        sourceUrl: href,
      });
    }
  }
  return articles;
}

async function scrapeWeChat() {
  const results = [];
  const keywords = ["手游", "游戏行业", "SLG", "新游发布", "游戏公司", "游戏出海", "游戏广告", "游戏买量"];
  for (const keyword of keywords) {
    try {
      const html = await fetchWithTimeout(`https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(keyword)}`, 8000);
      if (!html) continue;
      const articles = extractArticles(html, "https://weixin.sogou.com");
      for (const article of articles) { article.sourceName = "微信公众号"; results.push(article); }
    } catch { continue; }
  }
  return results;
}

const SOURCES = [
  { url: "https://www.gamersky.com/news/", name: "游民星空", base: "https://www.gamersky.com" },
  { url: "https://www.taptap.cn/top/new", name: "TapTap", base: "https://www.taptap.cn" },
  { url: "https://www.gamelook.com.cn/", name: "GameLook", base: "https://www.gamelook.com.cn" },
  { url: "https://youxichaguan.com/", name: "游戏茶馆", base: "https://youxichaguan.com" },
  { url: "https://www.gameres.com/", name: "游戏研究社", base: "https://www.gameres.com" },
];

async function scrapeSource(url, name, base) {
  try {
    const html = await fetchWithTimeout(url);
    if (!html) return [];
    return extractArticles(html, base);
  } catch { return []; }
}

async function main() {
  const promises = SOURCES.map(s => scrapeSource(s.url, s.name, s.base));
  promises.push(scrapeWeChat());
  const sources = await Promise.allSettled(promises);

  const allResults = [];
  for (const result of sources) {
    if (result.status === "fulfilled") allResults.push(...result.value);
  }

  const seen = new Set();
  const unique = allResults.filter((item) => {
    const key = item.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Fetch article content and published time for top items
  const topItems = unique.slice(0, 15);
  await Promise.allSettled(topItems.map(async (item) => {
    if (item.sourceUrl) {
      const html = await fetchWithTimeout(item.sourceUrl, 8000);
      if (html) {
        const publishedAt = extractPublishedTime(html);
        if (publishedAt) item.publishedAt = publishedAt;
      }
    }
  }));

  // Transform to new format
  const output = unique.map((item) => {
    const column = autoClassify(item.title, item.content);
    const relevanceScore = calculateRelevance(item.title, item.content);
    const gameNames = extractGameNames(item.title, item.content);
    const imageUrl = item.imageUrl || generatePlaceholderImage(item.title, column);

    return {
      title: item.title,
      summary: item.summary || item.title.substring(0, 100),
      content: item.content,
      column,
      relevanceScore,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      imageUrl,
      gameName: gameNames.length > 0 ? gameNames[0] : null,
      publishedAt: item.publishedAt || null,
      sourceType: item.sourceName === "微信公众号" ? "wechat" : "media",
      status: "candidate",
    };
  });

  process.stdout.write(JSON.stringify(output));
}

main().catch((e) => {
  process.stderr.write("Error: " + e.message);
  process.exit(1);
});
