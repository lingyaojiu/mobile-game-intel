import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sources - 获取信息源列表
export async function GET() {
  try {
    const sources = await prisma.source.findMany({
      orderBy: { enabled: "desc" },
    });
    return NextResponse.json({ items: sources });
  } catch (error) {
    console.error("GET /api/sources error:", error);
    return NextResponse.json(
      { error: "获取信息源失败" },
      { status: 500 }
    );
  }
}

// POST /api/sources - 创建信息源
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const source = await prisma.source.create({
      data: {
        name: body.name,
        type: body.type,
        url: body.url || null,
        rssUrl: body.rssUrl || null,
        language: body.language || "zh",
        enabled: body.enabled !== false,
      },
    });
    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    console.error("POST /api/sources error:", error);
    return NextResponse.json(
      { error: "创建信息源失败" },
      { status: 500 }
    );
  }
}
