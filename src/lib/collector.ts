/**
 * 手游情报自动采集引擎
 * 从多个来源爬取手游情报，自动分类并存入数据库
 */

const CATEGORIES: Record<string, string[]> = {
  new_game_test: ["测试", "封测", "内测", "公测", "试玩", "Test", "Beta", "招募", "预约", "试玩"],
  new_package: ["新游", "上线", "发布", "发行", "上架", "开服", "新作", "新游戏", "launch", "release", "正式上线"],
  news: ["新闻", "宣布", "公布", "合作", "收购", "投资", "融资", "IPO", "财报"],
  slg_review: ["SLG", "策略", "率土", "三国", "文明", "COK", "战棋", "统帅", "战略", "攻城"],
  company: ["公司", "财报", "营收", "利润", "裁员", "招聘", "工作室", "腾讯", "网易", "米哈游", "三七", "莉莉丝", "字节"],
  update: ["更新", "版本", "赛季", "资料片", "活动", "新角色", "新英雄", "patch", "update", "新增"],
  ad: ["广告", "投放", "买量", "推广", "营销", "素材"],
  shell_package: ["马甲包", "换皮", "套壳", "克隆", "山寨"],
  audience: ["用户", "玩家", "DAU", "MAU", "留存", "活跃", "付费", "ARPU", "LTV", "下载"],
  ad_audience: ["广告受众", "定向", "人群包", "投放人群"],
  ad_analysis: ["广告分析", "投放分析", "素材分析", "渠道分析", "ROI", "回收", "变现"],
};

function classifyArticle(title: string, content: string): string {
  const text = (title + " " + content).toLowerCase();
  const scores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    scores[category] = 0;
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        scores[category] += 1;
      }
    }
  }

  let best = "news";
  let bestScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }

  return best;
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<string> {
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

function extractTitles(html: string): string[] {
  const seen = new Set<string>();
  const results: string[] = [];

  // Pattern 1: <a> tags with href containing news/game
  const aRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]{8,100})<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = aRegex.exec(html)) !== null) {
    const href = m[1].toLowerCase();
    const text = m[2].replace(/<[^>]*>/g, "").trim();
    if (
      text.length >= 8 &&
      text.length <= 80 &&
      !seen.has(text) &&
      !text.includes("javascript") &&
      !text.includes("登录") &&
      !text.includes("注册") &&
      !text.includes("首页") &&
      !text.includes("更多")
    ) {
      seen.add(text);
      results.push(text);
    }
  }

  // Pattern 2: <h2>/<h3> tags
  const hRegex = /<h[23][^>]*>([^<]{8,100})<\/h[23]>/gi;
  while ((m = hRegex.exec(html)) !== null) {
    const text = m[1].trim();
    if (text.length >= 8 && text.length <= 80 && !seen.has(text)) {
      seen.add(text);
      results.push(text);
    }
  }

  // Pattern 3: title-like divs
  const divRegex = /<div[^>]*class="[^"]*(?:title|name|text)[^"]*"[^>]*>([^<]{8,100})<\/div>/gi;
  while ((m = divRegex.exec(html)) !== null) {
    const text = m[1].trim();
    if (text.length >= 8 && text.length <= 80 && !seen.has(text)) {
      seen.add(text);
      results.push(text);
    }
  }

  return results;
}

async function scrapeGamersky(): Promise<Array<{ title: string; content: string; source: string }>> {
  const results: Array<{ title: string; content: string; source: string }> = [];
  try {
    const html = await fetchWithTimeout("https://www.gamersky.com/news/");
    const titles = extractTitles(html);
    for (const title of titles.slice(0, 15)) {
      results.push({ title, content: title, source: "游民星空" });
    }
  } catch (e) {
    console.error("游民星空 scrape error:", e);
  }
  return results;
}

async function scrapeTapTap(): Promise<Array<{ title: string; content: string; source: string }>> {
  const results: Array<{ title: string; content: string; source: string }> = [];
  try {
    const html = await fetchWithTimeout("https://www.taptap.cn/top/new");
    const titles = extractTitles(html);
    for (const title of titles.slice(0, 15)) {
      results.push({ title, content: title, source: "TapTap" });
    }
  } catch (e) {
    console.error("TapTap scrape error:", e);
  }
  return results;
}

async function scrape17173(): Promise<Array<{ title: string; content: string; source: string }>> {
  const results: Array<{ title: string; content: string; source: string }> = [];
  try {
    const html = await fetchWithTimeout("https://news.17173.com/");
    const titles = extractTitles(html);
    for (const title of titles.slice(0, 15)) {
      results.push({ title, content: title, source: "17173" });
    }
  } catch (e) {
    console.error("17173 scrape error:", e);
  }
  return results;
}

export async function collectIntel(): Promise<Array<{ date: string; category: string; title: string; content: string; source: string }>> {
  const today = new Date().toISOString().split("T")[0];
  const allEntries: Array<{ date: string; category: string; title: string; content: string; source: string }> = [];

  const sources = [
    scrapeGamersky(),
    scrapeTapTap(),
    scrape17173(),
  ];

  const results = await Promise.allSettled(sources);
  
  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const item of result.value) {
        const category = classifyArticle(item.title, item.content);
        allEntries.push({
          date: today,
          category,
          title: item.title,
          content: item.content,
          source: item.source,
        });
      }
    }
  }

  // Deduplicate by title
  const seen = new Set<string>();
  return allEntries.filter((e) => {
    const key = e.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
