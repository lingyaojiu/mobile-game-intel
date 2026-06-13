import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

/**
 * Cron trigger - called by Vercel Cron Jobs at 9:00 AM daily
 * Or called manually via GET /api/cron
 */
export async function GET() {
  try {
    // Verify it's a cron request (Vercel adds CRON secret)
    // For security, we just run the collection

    const today = new Date().toISOString().split("T")[0];

    // Fetch from sources
    const sources = [
      fetchPage("https://www.gamersky.com/news/"),
      fetchPage("https://www.taptap.cn/top/new"),
      fetchPage("https://www.gamelook.com.cn/"),
      ...["手游", "游戏", "SLG", "新游", "游戏公司"].map(
        (kw) => fetchPage(`https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(kw)}`)
      ),
    ];

    const htmlResults = await Promise.allSettled(sources);
    const allHtml: string[] = [];
    for (const r of htmlResults) {
      if (r.status === "fulfilled" && r.value) allHtml.push(r.value);
    }

    // Extract articles
    const allEntries: Array<{
      title: string; content: string; summary: string; source: string; imageUrl: string | null; link: string;
    }> = [];

    const sourceNames = ["游民星空", "TapTap", "GameLook", "微信公众号", "微信公众号", "微信公众号", "微信公众号", "微信公众号"];

    for (let i = 0; i < allHtml.length; i++) {
      const name = sourceNames[i] || "未知";
      const baseUrl = i < 3
        ? ["https://www.gamersky.com", "https://www.taptap.cn", "https://www.gamelook.com.cn"][i]
        : "https://weixin.sogou.com";
      const articles = extractArticlesSimple(allHtml[i], baseUrl, name);
      allEntries.push(...articles);
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = allEntries.filter((item) => {
      const key = item.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Save to DB
    let saved = 0;
    for (const entry of unique) {
      const existing = await prisma.entry.findFirst({
        where: { date: today, title: entry.title },
      });
      if (!existing) {
        await prisma.entry.create({
          data: {
            date: today,
            category: classifyArticleSimple(entry.title, entry.content),
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
      message: `定时采集完成: ${unique.length} 条, 新增 ${saved} 条`,
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { success: false, message: "定时采集失败: " + String(error) },
      { status: 500 }
    );
  }
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function extractArticlesSimple(html: string, baseUrl: string, sourceName: string) {
  const articles: Array<{
    title: string; content: string; summary: string; source: string; imageUrl: string | null; link: string;
  }> = [];
  const seen = new Set<string>();

  const aRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]{6,100})<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = aRegex.exec(html)) !== null) {
    let href = m[1];
    const text = m[2].replace(/<[^>]*>/g, "").trim();
    if (text.length < 6 || text.length > 80 || seen.has(text)) continue;
    if (/登录|注册|首页|更多|javascript/.test(text)) continue;
    if (href.startsWith("/")) href = baseUrl + href;
    if (!href.startsWith("http")) continue;
    seen.add(text);

    const imgRegex = /<img[^>]*src="([^"]*)"[^>]*>/gi;
    let imgUrl: string | null = null;
    let imgMatch: RegExpExecArray | null;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const src = imgMatch[1];
      if (src.startsWith("http") && !/(logo|icon|avatar)/i.test(src)) { imgUrl = src; break; }
    }

    articles.push({ title: text, content: text, summary: text, source: sourceName, imageUrl: imgUrl, link: href });
  }

  return articles;
}

const CATEGORIES_SIMPLE: Record<string, string[]> = {
  new_game_test: ["测试", "封测", "内测", "公测", "试玩", "Beta", "招募", "预约"],
  new_package: ["新游", "上线", "发布", "发行", "上架", "开服", "新作", "新游戏"],
  news: ["新闻", "宣布", "公布", "合作", "收购", "投资", "融资", "财报"],
  slg_review: ["SLG", "策略", "率土", "三国", "文明", "战棋", "统帅", "战略"],
  company: ["公司", "财报", "营收", "利润", "腾讯", "网易", "米哈游", "三七", "莉莉丝"],
  update: ["更新", "版本", "赛季", "资料片", "活动", "新角色", "联动"],
  ad: ["广告", "投放", "买量", "推广", "营销"],
  shell_package: ["马甲包", "换皮", "套壳", "克隆", "山寨"],
  audience: ["用户", "玩家", "DAU", "MAU", "留存", "活跃", "付费"],
  ad_audience: ["广告受众", "定向", "人群包", "投放人群"],
  ad_analysis: ["广告分析", "投放分析", "素材分析", "ROI", "回收", "变现"],
};

function classifyArticleSimple(title: string, content: string): string {
  const text = (title + " " + content).toLowerCase();
  const scores: Record<string, number> = {};
  for (const [category, keywords] of Object.entries(CATEGORIES_SIMPLE)) {
    scores[category] = 0;
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) scores[category]++;
    }
  }
  let best = "news", bestScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}
