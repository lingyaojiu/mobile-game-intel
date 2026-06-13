import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/games/[id] - 获取游戏详情
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的游戏ID" }, { status: 400 });
    }

    const game = await prisma.game.findUnique({
      where: { id },
    });

    if (!game) {
      return NextResponse.json({ error: "游戏不存在" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error("GET /api/games/[id] error:", error);
    return NextResponse.json(
      { error: "获取游戏详情失败" },
      { status: 500 }
    );
  }
}

// PUT /api/games/[id] - 更新游戏
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的游戏ID" }, { status: 400 });
    }

    const body = await request.json();

    const game = await prisma.game.update({
      where: { id },
      data: {
        name: body.name,
        nameEn: body.nameEn,
        developer: body.developer,
        publisher: body.publisher,
        launchDate: body.launchDate,
        markets: body.markets,
        theme: body.theme,
        genre: body.genre,
        artStyle: body.artStyle,
        coreGameplay: body.coreGameplay,
        combatSystem: body.combatSystem,
        buildingSystem: body.buildingSystem,
        progression: body.progression,
        allianceSystem: body.allianceSystem,
        seasonSystem: body.seasonSystem,
        monetization: body.monetization,
        appStoreUrl: body.appStoreUrl,
        googlePlayUrl: body.googlePlayUrl,
        officialUrl: body.officialUrl,
        tags: body.tags,
        imageUrl: body.imageUrl,
        description: body.description,
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error("PUT /api/games/[id] error:", error);
    return NextResponse.json(
      { error: "更新游戏失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/games/[id] - 删除游戏
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的游戏ID" }, { status: 400 });
    }

    // 解除文章关联
    await prisma.article.updateMany({
      where: { gameId: id },
      data: { gameId: null },
    });

    await prisma.game.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/games/[id] error:", error);
    return NextResponse.json(
      { error: "删除游戏失败" },
      { status: 500 }
    );
  }
}
