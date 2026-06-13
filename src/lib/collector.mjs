/**
 * 手游情报自动采集脚本 v4
 * - 改进图片提取：从全文范围搜索图片，按位置关联
 * - 抓取文章正文HTML用于网页内阅读
 * - 通过搜狗微信搜索抓取微信公众号文章
 * - 用法: node src/lib/collector.mjs
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
      let pos = 0;
      while ((pos = text.indexOf(kw.toLowerCase(), pos)) !== -1) {
        scores[category]++;
        pos += kw.length;
      }
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
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Extract all images from HTML with their positions
 */
function extractAllImages(html) {
  const images = [];
  const imgRegex = /<img[^>]*src="([^"]*)"[^>]*>/gi;
  let m;
  while ((m = imgRegex.exec(html)) !== null) {
    const src = m[1];
    if (src.startsWith("http") && !/(logo|icon|avatar|sprite|\.svg|pixel|blank|loading|default)/i.test(src)) {
      images.push({ src, pos: m.index });
    }
  }
  return images;
}

/**
 * Find the nearest image to a given position in the HTML
 */
function findNearestImage(images, pos, html, linkText) {
  if (images.length === 0) return null;

  // Look for images within 3000 chars before or 2000 chars after the link
  const candidates = images.filter(img => 
    (img.pos > pos - 3000 && img.pos < pos + 2000)
  );

  if (candidates.length === 0) return null;

  // Return the one closest to the link position
  candidates.sort((a, b) => Math.abs(a.pos - pos) - Math.abs(b.pos - pos));
  return candidates[0].src;
}

/**
 * Extract article content from link URL
 */
async function fetchArticleContent(url) {
  try {
    const html = await fetchWithTimeout(url, 8000);
    if (!html) return null;

    let content = null;
    const patterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class="[^"]*(?:article|content|post|main|text|detail|rich_media_content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="[^"]*(?:article|content|post|main|text|detail)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ];

    for (const pattern of patterns) {
      const m = pattern.exec(html);
      if (m) { content = m[1]; break; }
    }

    if (!content) {
      const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
      if (bodyMatch) content = bodyMatch[1];
    }

    if (!content) return null;

    content = content
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .trim();

    if (content.length < 50) return null;
    return content;
  } catch {
    return null;
  }
}

/**
 * Extract articles from HTML with improved image detection
 */
function extractArticles(html, baseUrl) {
  const articles = [];
  const seen = new Set();

  // Pre-extract all images with positions
  const allImages = extractAllImages(html);

  // Also extract images from the full HTML as fallback list
  const fallbackImages = allImages.map(i => i.src);

  const itemRegex = /<div[^>]*class="[^"]*(?:item|card|post|entry|news|list|box|pic|img)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;

  const blocks = [];
  let m;
  while ((m = itemRegex.exec(html)) !== null) blocks.push({ html: m[1], pos: m.index });
  while ((m = liRegex.exec(html)) !== null) blocks.push({ html: m[1], pos: m.index });

  const targets = blocks.length > 0 ? blocks : [{ html, pos: 0 }];

  for (const { html: block, pos: blockPos } of targets) {
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]{6,100})<\/a>/gi;
    while ((m = linkRegex.exec(block)) !== null) {
      let href = m[1];
      const text = m[2].replace(/<[^>]*>/g, "").trim();

      if (text.length < 6 || text.length > 80 || seen.has(text)) continue;
      if (/登录|注册|首页|更多|javascript|undefined|null/.test(text)) continue;
      if (href.startsWith("/")) href = baseUrl + href;
      if (!href.startsWith("http")) continue;

      seen.add(text);

      // Try to find image in the block first
      const blockImgRegex = /<img[^>]*src="([^"]*)"[^>]*>/i;
      const blockImg = blockImgRegex.exec(block);
      let imgUrl = null;

      if (blockImg) {
        const src = blockImg[1];
        if (src.startsWith("http") && !/(logo|icon|avatar|sprite|\.svg|pixel)/i.test(src)) {
          imgUrl = src;
        }
      }

      // If no image in block, try nearest image in full HTML
      if (!imgUrl) {
        const linkPosInHtml = html.indexOf(href);
        if (linkPosInHtml > 0) {
          imgUrl = findNearestImage(allImages, linkPosInHtml, html, text);
        }
      }

      // Last resort: use first valid image from fallback
      if (!imgUrl && fallbackImages.length > 0) {
        imgUrl = fallbackImages[0];
      }

      // Extract description
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

async function scrapeWeChat() {
  const results = [];
  const keywords = ["手游", "游戏", "SLG", "新游", "游戏公司"];
  for (const keyword of keywords) {
    try {
      const html = await fetchWithTimeout(`https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(keyword)}`, 8000);
      if (!html) continue;
      const articles = extractArticles(html, "https://weixin.sogou.com");
      for (const article of articles) { article.source = "微信公众号"; results.push(article); }
    } catch { continue; }
  }
  return results;
}

async function scrapeGamersky() {
  try {
    const html = await fetchWithTimeout("https://www.gamersky.com/news/");
    if (!html) return [];
    return extractArticles(html, "https://www.gamersky.com");
  } catch { return []; }
}

async function scrapeTapTap() {
  try {
    const html = await fetchWithTimeout("https://www.taptap.cn/top/new");
    if (!html) return [];
    return extractArticles(html, "https://www.taptap.cn");
  } catch { return []; }
}

async function scrapeGameLook() {
  try {
    const html = await fetchWithTimeout("https://www.gamelook.com.cn/");
    if (!html) return [];
    return extractArticles(html, "https://www.gamelook.com.cn");
  } catch { return []; }
}

async function main() {
  const sources = await Promise.allSettled([
    scrapeGamersky(),
    scrapeTapTap(),
    scrapeGameLook(),
    scrapeWeChat(),
  ]);

  const allResults = [];
  for (const result of sources) {
    if (result.status === "fulfilled") {
      allResults.push(...result.value);
    }
  }

  const seen = new Set();
  const unique = allResults.filter((item) => {
    const key = item.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Fetch article content for top items
  const topItems = unique.slice(0, 20);
  await Promise.allSettled(topItems.map(async (item) => {
    if (item.link) {
      const html = await fetchArticleContent(item.link);
      if (html) item.contentHtml = html;
    }
  }));

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
