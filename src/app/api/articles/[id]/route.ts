import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/articles/[id] - 获取单篇文章
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的文章ID" }, { status: 400 });
    }

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        game: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("GET /api/articles/[id] error:", error);
    return NextResponse.json(
      { error: "获取文章失败" },
      { status: 500 }
    );
  }
}

// PUT /api/articles/[id] - 更新文章
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的文章ID" }, { status: 400 });
    }

    const body = await request.json();

    // 如果状态变更，记录审核队列
    if (body.status) {
      const article = await prisma.article.findUnique({ where: { id } });
      if (article && article.status !== body.status) {
        await prisma.reviewQueue.create({
          data: {
            articleId: id,
            action: body.status === "published" ? "approve" : body.status === "rejected" ? "reject" : null,
            reviewer: body.reviewer || "system",
            comment: body.reviewComment || null,
          },
        });
      }
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        gameId: body.gameId !== undefined ? body.gameId : undefined,
        column: body.column,
        title: body.title,
        summary: body.summary,
        content: body.content,
        background: body.background,
        keyPoints: body.keyPoints,
        analysis: body.analysis,
        insights: body.insights,
        sourceName: body.sourceName,
        sourceUrl: body.sourceUrl,
        sourceType: body.sourceType,
        isPrimary: body.isPrimary,
        publishedAt: body.publishedAt,
        imageUrl: body.imageUrl,
        gameName: body.gameName,
        companyName: body.companyName,
        region: body.region,
        category: body.category,
        credibility: body.credibility,
        relevanceScore: body.relevanceScore,
        status: body.status,
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("PUT /api/articles/[id] error:", error);
    return NextResponse.json(
      { error: "更新文章失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/[id] - 删除文章
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的文章ID" }, { status: 400 });
    }

    // 删除关联的审核记录
    await prisma.reviewQueue.deleteMany({ where: { articleId: id } });
    // 删除文章
    await prisma.article.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/articles/[id] error:", error);
    return NextResponse.json(
      { error: "删除文章失败" },
      { status: 500 }
    );
  }
}
