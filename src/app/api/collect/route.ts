import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;
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

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
  });
  return await response.text();
}

function extractArticles(html: string, baseUrl: string): Array<{
  title: string; content: string; summary: string; source: string; imageUrl: string | null; link: string;
}> {
  const articles: Array<{
    title: string; content: string; summary: string; source: string; imageUrl: string | null; link: string;
  }> = [];
  const seen = new Set<string>();

  const itemRegex = /<div[^>]*class="[^"]*(?:item|card|post|entry|news|list|box)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;

  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(html)) !== null) blocks.push(m[1]);
  while ((m = liRegex.exec(html)) !== null) blocks.push(m[1]);

  const targets = blocks.length > 0 ? blocks : [html];

  for (const block of targets) {
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]{6,100})<\/a>/gi;
    while ((m = linkRegex.exec(block)) !== null) {
      let href = m[1];
      const text = m[2].replace(/<[^>]*>/g, "").trim();

      if (text.length < 6 || text.length > 80 || seen.has(text)) continue;
      if (/登录|注册|首页|更多|javascript|undefined|null/.test(text)) continue;
      if (href.startsWith("/")) href = baseUrl + href;
      if (!href.startsWith("http")) continue;

      seen.add(text);

      // Extract image
      const imgRegex = /<img[^>]*src="([^"]*)"[^>]*>/gi;
      let imgUrl: string | null = null;
      let imgMatch: RegExpExecArray | null;
      while ((imgMatch = imgRegex.exec(block)) !== null) {
        const src = imgMatch[1];
        if (src.startsWith("http") && !/(logo|icon|avatar|sprite|\.svg)/i.test(src)) {
          imgUrl = src;
          break;
        }
      }

      // Extract description
      const descRegex = /<p[^>]*>([^<]{10,200})<\/p>/gi;
      let summary: string | null = null;
      let descMatch: RegExpExecArray | null;
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

async function scrapeSource(url: string, name: string, maxItems = 15) {
  try {
    const html = await fetchPage(url);
    const articles = extractArticles(html, url);
    return articles.slice(0, maxItems).map((a) => ({ ...a, source: name }));
  } catch { return []; }
}

export async function POST() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const results = await Promise.allSettled([
      scrapeSource("https://www.gamersky.com/news/", "游民星空", 12),
      scrapeSource("https://www.taptap.cn/top/new", "TapTap", 12),
      scrapeSource("https://news.17173.com/", "17173", 10),
      scrapeSource("https://www.gamelook.com.cn/", "GameLook", 10),
      scrapeSource("https://m.pipaw.com/xin/xinwen-2954", "琵琶网", 8),
    ]);

    const allEntries: Array<{
      title: string; content: string; summary: string; source: string; imageUrl: string | null; link: string;
    }> = [];
    for (const result of results) {
      if (result.status === "fulfilled") allEntries.push(...result.value);
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = allEntries.filter((item) => {
      const key = item.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let saved = 0;
    for (const entry of unique) {
      const existing = await prisma.entry.findFirst({
        where: { date: today, title: entry.title },
      });
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
    return NextResponse.json(
      { success: false, message: "采集失败: " + String(error) },
      { status: 500 }
    );
  }
}
