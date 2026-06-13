import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/articles - 获取文章列表（支持筛选、分页、排序）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const column = searchParams.get("column");
    const status = searchParams.get("status");
    const gameId = searchParams.get("gameId");
    const companyName = searchParams.get("companyName");
    const region = searchParams.get("region");
    const time = searchParams.get("time");
    const q = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const sortBy = searchParams.get("sortBy") || "publishedAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // 构建查询条件
    const where: any = {};

    if (column && column !== "all") {
      where.column = column;
    }
    if (status) {
      where.status = status;
    }
    if (gameId) {
      where.gameId = parseInt(gameId);
    }
    if (companyName) {
      where.companyName = { contains: companyName };
    }
    if (region) {
      where.region = region;
    }
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { summary: { contains: q } },
        { content: { contains: q } },
        { gameName: { contains: q } },
        { companyName: { contains: q } },
      ];
    }

    // 时间筛选
    const now = new Date();
    if (time === "today") {
      const today = now.toISOString().split("T")[0];
      where.publishedAt = { gte: today };
    } else if (time === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split("T")[0];
      where.publishedAt = {
        gte: yStr,
        lt: now.toISOString().split("T")[0],
      };
    } else if (time === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      where.publishedAt = { gte: weekAgo.toISOString().split("T")[0] };
    } else if (time === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      where.publishedAt = { gte: monthAgo.toISOString().split("T")[0] };
    }

    // 排序
    const orderBy: any = {};
    if (sortBy === "publishedAt") {
      orderBy.publishedAt = sortOrder;
    } else if (sortBy === "relevanceScore") {
      orderBy.relevanceScore = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // 查询
    const [items, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          game: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/articles error:", error);
    return NextResponse.json(
      { error: "获取文章列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/articles - 创建文章
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const article = await prisma.article.create({
      data: {
        gameId: body.gameId || null,
        column: body.column || "industry_news",
        title: body.title,
        summary: body.summary || null,
        content: body.content || null,
        background: body.background || null,
        keyPoints: body.keyPoints || null,
        analysis: body.analysis || null,
        insights: body.insights || null,
        sourceName: body.sourceName || null,
        sourceUrl: body.sourceUrl || null,
        sourceType: body.sourceType || null,
        isPrimary: body.isPrimary || false,
        publishedAt: body.publishedAt || null,
        imageUrl: body.imageUrl || null,
        gameName: body.gameName || null,
        companyName: body.companyName || null,
        region: body.region || null,
        category: body.category || null,
        credibility: body.credibility || null,
        relevanceScore: body.relevanceScore || null,
        status: body.status || "candidate",
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("POST /api/articles error:", error);
    return NextResponse.json(
      { error: "创建文章失败" },
      { status: 500 }
    );
  }
}
