import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/games - 获取游戏列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const genre = searchParams.get("genre");
    const theme = searchParams.get("theme");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    const where: any = {};

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { nameEn: { contains: q } },
        { developer: { contains: q } },
      ];
    }
    if (genre) {
      where.genre = { contains: genre };
    }
    if (theme) {
      where.theme = { contains: theme };
    }

    const [items, total] = await Promise.all([
      prisma.game.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.game.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/games error:", error);
    return NextResponse.json(
      { error: "获取游戏列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/games - 创建游戏
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 检查是否已存在同名游戏
    const existing = await prisma.game.findFirst({
      where: { name: body.name },
    });
    if (existing) {
      return NextResponse.json(existing);
    }

    const game = await prisma.game.create({
      data: {
        name: body.name,
        nameEn: body.nameEn || null,
        developer: body.developer || null,
        publisher: body.publisher || null,
        launchDate: body.launchDate || null,
        markets: body.markets || null,
        theme: body.theme || null,
        genre: body.genre || null,
        artStyle: body.artStyle || null,
        coreGameplay: body.coreGameplay || null,
        combatSystem: body.combatSystem || null,
        buildingSystem: body.buildingSystem || null,
        progression: body.progression || null,
        allianceSystem: body.allianceSystem || null,
        seasonSystem: body.seasonSystem || null,
        monetization: body.monetization || null,
        appStoreUrl: body.appStoreUrl || null,
        googlePlayUrl: body.googlePlayUrl || null,
        officialUrl: body.officialUrl || null,
        tags: body.tags || null,
        imageUrl: body.imageUrl || null,
        description: body.description || null,
      },
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error("POST /api/games error:", error);
    return NextResponse.json(
      { error: "创建游戏失败" },
      { status: 500 }
    );
  }
}
