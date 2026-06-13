import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/daily - 获取每日简报列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "30");

    const where: any = {};
    if (date) {
      where.date = date;
    }

    const [items, total] = await Promise.all([
      prisma.dailyReport.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.dailyReport.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/daily error:", error);
    return NextResponse.json(
      { error: "获取每日简报失败" },
      { status: 500 }
    );
  }
}

// POST /api/daily - 生成每日简报
export async function POST() {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // 检查是否已存在今日简报
    const existing = await prisma.dailyReport.findUnique({
      where: { date: todayStr },
    });
    if (existing) {
      return NextResponse.json(existing);
    }

    // 获取今日文章
    const todayArticles = await prisma.article.findMany({
      where: {
        publishedAt: { gte: todayStr },
        status: "published",
      },
      orderBy: { relevanceScore: "desc" },
      take: 20,
    });

    if (todayArticles.length === 0) {
      return NextResponse.json(
        { error: "今日暂无文章，无法生成简报" },
        { status: 400 }
      );
    }

    // 按栏目分组
    const grouped: Record<string, typeof todayArticles> = {};
    for (const article of todayArticles) {
      if (!grouped[article.column]) grouped[article.column] = [];
      grouped[article.column].push(article);
    }

    // 生成简报内容
    const lines: string[] = [];
    lines.push(`# SLG行业情报简报 - ${todayStr}`);
    lines.push("");
    lines.push(`今日共收录 ${todayArticles.length} 篇相关文章，涵盖 ${Object.keys(grouped).length} 个栏目。`);
    lines.push("");

    for (const [column, articles] of Object.entries(grouped)) {
      const colLabel = getColumnLabel(column);
      lines.push(`## ${colLabel}`);
      lines.push("");
      articles.slice(0, 5).forEach((article, i) => {
        lines.push(`${i + 1}. **${article.title}**`);
        if (article.summary) lines.push(`   ${article.summary}`);
        if (article.sourceName) lines.push(`   来源：${article.sourceName}`);
        lines.push("");
      });
    }

    lines.push("---");
    lines.push("> 本简报由 SLG手游情报系统自动生成，仅供行业研究参考。");

    const content = lines.join("\n");

    // 创建简报
    const report = await prisma.dailyReport.create({
      data: {
        date: todayStr,
        title: `SLG行业情报简报 ${todayStr}`,
        content,
        articleCount: todayArticles.length,
        status: "published",
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("POST /api/daily error:", error);
    return NextResponse.json(
      { error: "生成每日简报失败" },
      { status: 500 }
    );
  }
}

function getColumnLabel(column: string): string {
  const labels: Record<string, string> = {
    daily_brief: "每日简报",
    new_game: "新游观察",
    product_review: "产品测评",
    gameplay_analysis: "玩法拆解",
    chart_analysis: "榜单观察",
    ad_creative: "买量素材",
    version_update: "版本更新",
    industry_news: "行业动态",
    overseas: "海外市场",
    deep_dive: "深度专题",
    data_report: "数据报告",
    game_database: "产品资料库",
  };
  return labels[column] || column;
}
