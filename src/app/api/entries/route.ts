import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (date) where.date = date;
  if (category) where.category = category;

  const entries = await prisma.entry.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, category, title, content, source } = body;

    if (!date || !category || !title || !content) {
      return NextResponse.json(
        { error: "date, category, title, content are required" },
        { status: 400 }
      );
    }

    const entry = await prisma.entry.create({
      data: { date, category, title, content, source: source || null },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
