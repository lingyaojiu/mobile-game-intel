import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const CATEGORIES: Record<string, string[]> = {
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

function classifyArticle(title: string, content: string): string {
  const text = (title + " " + content).toLowerCase();
  const scores: Record<string, number> = {};
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    scores[category] = 0;
    for (const kw of keywords) {
      let pos = 0;
      while ((pos = text.indexOf(kw.toLowerCase(), pos)) !== -1) { scores[category]++; pos += kw.length; }
    }
  }
  let best = "news", bestScore = 0;
  for (const [cat, score] of Object.entries(scores)) { if (score > bestScore) { bestScore = score; best = cat; } }
  return best;
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch { return null; }
}

function extractAllImages(html: string): Array<{ src: string; pos: number }> {
  const images: Array<{ src: string; pos: number }> = [];
  const imgRegex = /<img[^>]*src="([^"]*)"[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRegex.exec(html)) !== null) {
    const src = m[1];
    if (src.startsWith("http") && !/(logo|icon|avatar|sprite|\.svg|pixel|blank|loading|default)/i.test(src)) {
      images.push({ src, pos: m.index });
    }
  }
  return images;
}

function findNearestImage(images: Array<{ src: string; pos: number }>, pos: number): string | null {
  const candidates = images.filter(img => (img.pos > pos - 3000 && img.pos < pos + 2000));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => Math.abs(a.pos - pos) - Math.abs(b.pos - pos));
  return candidates[0].src;
}

function extractArticles(html: string, baseUrl: string): Array<{
  title: string; content: string; summary: string; source: string; imageUrl: string | null; link: string;
}> {
  const articles: Array<{
    title: string; content: string; summary: string; source: string; imageUrl: string | null; link: string;
  }> = [];
  const seen = new Set<string>();
  const allImages = extractAllImages(html);
  const fallbackImages = allImages.map(i => i.src);

  const itemRegex = /<div[^>]*class="[^"]*(?:item|card|post|entry|news|list|box|pic|img)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;

  const blocks: Array<{ html: string; pos: number }> = [];
  let m: RegExpExecArray | null;
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

      // Find image - first in block
      const blockImgRegex = /<img[^>]*src="([^"]*)"[^>]*>/i;
      const blockImg = blockImgRegex.exec(block);
      let imgUrl: string | null = null;
      if (blockImg) {
        const src = blockImg[1];
        if (src.startsWith("http") && !/(logo|icon|avatar|sprite|\.svg|pixel)/i.test(src)) imgUrl = src;
      }
      // Then nearest in full HTML
      if (!imgUrl) {
        const linkPosInHtml = html.indexOf(href);
        if (linkPosInHtml > 0) imgUrl = findNearestImage(allImages, linkPosInHtml);
      }
      // Last resort
      if (!imgUrl && fallbackImages.length > 0) imgUrl = fallbackImages[0];

      // Description
      const descRegex = /<p[^>]*>([^<]{10,200})<\/p>/gi;
      let summary: string | null = null;
      let descMatch: RegExpExecArray | null;
      while ((descMatch = descRegex.exec(block)) !== null) {
        const d = descMatch[1].trim();
        if (d.length > 10 && d !== text && !d.includes("javascript")) { summary = d; break; }
      }

      articles.push({ title: text, content: text, summary: summary || text, source: new URL(baseUrl).hostname.replace("www.", ""), imageUrl: imgUrl, link: href });
    }
  }
  return articles;
}

async function scrapeSource(url: string, name: string, maxItems = 15) {
  try {
    const html = await fetchPage(url);
    if (!html) return [];
    return extractArticles(html, url).slice(0, maxItems).map((a) => ({ ...a, source: name }));
  } catch { return []; }
}

async function scrapeWeChat() {
  const results: Array<{ title: string; content: string; summary: string; source: string; imageUrl: string | null; link: string }> = [];
  const keywords = ["手游", "游戏", "SLG", "新游", "游戏公司"];
  for (const keyword of keywords) {
    try {
      const html = await fetchPage(`https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(keyword)}`);
      if (!html) continue;
      const articles = extractArticles(html, "https://weixin.sogou.com");
      for (const a of articles) { a.source = "微信公众号"; results.push(a); }
    } catch { continue; }
  }
  return results;
}

async function fetchArticleContent(url: string): Promise<string | null> {
  try {
    const html = await fetchPage(url);
    if (!html) return null;
    const patterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class="[^"]*(?:article|content|post|main|text|detail|rich_media_content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="[^"]*(?:article|content|post|main|text|detail)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ];
    for (const pattern of patterns) {
      const m = pattern.exec(html);
      if (m) {
        let content = m[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<iframe[\s\S]*?<\/iframe>/gi, "").trim();
        if (content.length > 50) return content;
      }
    }
    return null;
  } catch { return null; }
}

export async function POST() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const results = await Promise.allSettled([
      scrapeSource("https://www.gamersky.com/news/", "游民星空", 12),
      scrapeSource("https://www.taptap.cn/top/new", "TapTap", 12),
      scrapeSource("https://www.gamelook.com.cn/", "GameLook", 10),
      scrapeWeChat(),
    ]);

    const allEntries: Array<{
      title: string; content: string; summary: string; source: string; imageUrl: string | null; link: string;
    }> = [];
    for (const result of results) {
      if (result.status === "fulfilled") allEntries.push(...result.value);
    }

    const seen = new Set<string>();
    const unique = allEntries.filter((item) => {
      const key = item.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const topItems = unique.slice(0, 20);
    const contentMap = new Map<string, string>();
    await Promise.allSettled(topItems.map(async (item) => {
      if (item.link) {
        const html = await fetchArticleContent(item.link);
        if (html) contentMap.set(item.link, html);
      }
    }));

    let saved = 0;
    for (const entry of unique) {
      const existing = await prisma.entry.findFirst({ where: { date: today, title: entry.title } });
      if (!existing) {
        await prisma.entry.create({
          data: {
            date: today,
            category: classifyArticle(entry.title, entry.content),
            title: entry.title,
            content: entry.content,
            summary: entry.summary,
            source: entry.source,
            imageUrl: entry.imageUrl,
            link: entry.link,
            contentHtml: entry.link ? (contentMap.get(entry.link) || null) : null,
          },
        });
        saved++;
      }
    }

    return NextResponse.json({
      success: true,
      total: unique.length,
      saved,
      message: `采集到 ${unique.length} 条情报，新增 ${saved} 条`,
    });
  } catch (error) {
    console.error("Collect error:", error);
    return NextResponse.json({ success: false, message: "采集失败: " + String(error) }, { status: 500 });
  }
}
