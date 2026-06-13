import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/stats - 获取仪表盘统计数据
export async function GET() {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const [
      totalArticles,
      totalGames,
      totalCompanies,
      publishedArticles,
      pendingReview,
      todayNewArticles,
      topGames,
      topSources,
      todayCrawlLog,
    ] = await Promise.all([
      prisma.article.count(),
      prisma.game.count(),
      prisma.company.count(),
      prisma.article.count({ where: { status: "published" } }),
      prisma.article.count({ where: { status: "pending_review" } }),
      prisma.article.count({
        where: {
          publishedAt: { gte: todayStr },
        },
      }),
      prisma.article.groupBy({
        by: ["gameName"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
        where: { gameName: { not: null } },
      }),
      prisma.article.groupBy({
        by: ["sourceName"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
        where: { sourceName: { not: null } },
      }),
      prisma.crawlLog.findFirst({
        where: { date: todayStr },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      totalArticles,
      totalGames,
      totalCompanies,
      publishedArticles,
      pendingReview,
      todayNewArticles,
      todayCrawlStatus: todayCrawlLog?.status || null,
      topGames: topGames.map((g) => ({ name: g.gameName, count: g._count.id })),
      topSources: topSources.map((s) => ({ name: s.sourceName, count: s._count.id })),
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json(
      { error: "获取统计数据失败" },
      { status: 500 }
    );
  }
}
