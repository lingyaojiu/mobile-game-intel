/**
 * 手游情报自动采集脚本 v2
 * 支持图片、摘要、原文链接，覆盖更多来源
 * 用法: node src/lib/collector.mjs
 * 输出: JSON [{ title, content, summary, source, imageUrl, link }]
 */

const CATEGORIES = {
  new_game_test: ["测试", "封测", "内测", "公测", "试玩", "Beta", "招募", "预约", "demo"],
  new_package: ["新游", "上线", "发布", "发行", "上架", "开服", "新作", "新游戏", "launch", "release", "正式上线"],
  news: ["新闻", "宣布", "公布", "合作", "收购", "投资", "融资", "IPO", "财报", "战略合作"],
  slg_review: ["SLG", "策略", "率土", "三国", "文明", "战棋", "统帅", "战略", "攻城", "率土之滨", "万国"],
  company: ["公司", "财报", "营收", "利润", "裁员", "招聘", "工作室", "腾讯", "网易", "米哈游", "三七", "莉莉丝", "字节", "B站"],
  update: ["更新", "版本", "赛季", "资料片", "活动", "新角色", "新英雄", "patch", "update", "新增", "联动"],
  ad: ["广告", "投放", "买量", "推广", "营销", "素材", "UA"],
  shell_package: ["马甲包", "换皮", "套壳", "克隆", "山寨", "搬运"],
  audience: ["用户", "玩家", "DAU", "MAU", "留存", "活跃", "付费", "ARPU", "LTV", "下载量"],
  ad_audience: ["广告受众", "定向", "人群包", "投放人群", "精准"],
  ad_analysis: ["广告分析", "投放分析", "素材分析", "渠道分析", "ROI", "回收", "变现", "LTV"],
};

function classifyArticle(title, content) {
  const text = (title + " " + content).toLowerCase();
  const scores = {};
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    scores[category] = 0;
    for (const kw of keywords) {
      let count = 0;
      let pos = 0;
      while ((pos = text.indexOf(kw.toLowerCase(), pos)) !== -1) {
        count++;
        pos += kw.length;
      }
      scores[category] += count;
    }
  }
  let best = "news", bestScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
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
    return await response.text();
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

function extractArticles(html, baseUrl) {
  const articles = [];
  const seen = new Set();

  // Extract article blocks
  const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
  const itemRegex = /<div[^>]*class="[^"]*(?:item|card|post|entry|news|list)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;

  const blocks = [];
  let m;
  while ((m = articleRegex.exec(html)) !== null) blocks.push(m[1]);
  while ((m = itemRegex.exec(html)) !== null) blocks.push(m[1]);

  // If no article blocks, use the whole HTML
  const targets = blocks.length > 0 ? blocks : [html];

  for (const block of targets) {
    // Extract link and title
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]{6,100})<\/a>/gi;
    while ((m = linkRegex.exec(block)) !== null) {
      let href = m[1];
      const text = m[2].replace(/<[^>]*>/g, "").trim();

      if (text.length < 6 || text.length > 80 || seen.has(text)) continue;
      if (text.includes("登录") || text.includes("注册") || text.includes("首页") || text.includes("更多")) continue;
      if (href.startsWith("/")) href = baseUrl + href;
      if (!href.startsWith("http")) continue;

      seen.add(text);

      // Extract image nearby
      const imgRegex = /<img[^>]*src="([^"]*)"[^>]*>/gi;
      let imgUrl = null;
      let imgMatch;
      while ((imgMatch = imgRegex.exec(block)) !== null) {
        const src = imgMatch[1];
        if (src.startsWith("http") && !src.includes("logo") && !src.includes("icon") && !src.includes("avatar")) {
          imgUrl = src;
          break;
        }
      }

      // Extract description nearby
      const descRegex = /<p[^>]*>([^<]{10,200})<\/p>/gi;
      let summary = null;
      let descMatch;
      while ((descMatch = descRegex.exec(block)) !== null) {
        const d = descMatch[1].trim();
        if (d.length > 10 && d !== text && !d.includes("javascript")) {
          summary = d;
          break;
        }
      }

      articles.push({
        title: text,
        content: text,
        summary: summary || text,
        source: new URL(baseUrl).hostname.replace("www.", ""),
        imageUrl: imgUrl,
        link: href,
      });
    }
  }

  return articles;
}

async function scrapeGamersky() {
  try {
    const html = await fetchWithTimeout("https://www.gamersky.com/news/");
    return extractArticles(html, "https://www.gamersky.com");
  } catch { return []; }
}

async function scrapeTapTap() {
  try {
    const html = await fetchWithTimeout("https://www.taptap.cn/top/new");
    return extractArticles(html, "https://www.taptap.cn");
  } catch { return []; }
}

async function scrape17173() {
  try {
    const html = await fetchWithTimeout("https://news.17173.com/");
    return extractArticles(html, "https://news.17173.com");
  } catch { return []; }
}

async function scrapeGameLook() {
  try {
    const html = await fetchWithTimeout("https://www.gamelook.com.cn/");
    return extractArticles(html, "https://www.gamelook.com.cn");
  } catch { return []; }
}

async function scrapePipaw() {
  try {
    const html = await fetchWithTimeout("https://m.pipaw.com/xin/xinwen-2954");
    return extractArticles(html, "https://m.pipaw.com");
  } catch { return []; }
}

async function main() {
  const sources = await Promise.allSettled([
    scrapeGamersky(),
    scrapeTapTap(),
    scrape17173(),
    scrapeGameLook(),
    scrapePipaw(),
  ]);

  const allResults = [];
  for (const result of sources) {
    if (result.status === "fulfilled") {
      allResults.push(...result.value);
    }
  }

  // Deduplicate
  const seen = new Set();
  const unique = allResults.filter((item) => {
    const key = item.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Add category
  const output = unique.map((item) => ({
    ...item,
    category: classifyArticle(item.title, item.content),
  }));

  process.stdout.write(JSON.stringify(output));
}

main().catch((e) => {
  process.stderr.write("Error: " + e.message);
  process.exit(1);
});
