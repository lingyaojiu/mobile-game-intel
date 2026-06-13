import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const entry = await prisma.entry.findUnique({
      where: { id: parseInt(id) },
    });
    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.content !== undefined) data.content = body.content;
    if (body.summary !== undefined) data.summary = body.summary;
    if (body.source !== undefined) data.source = body.source;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
    if (body.link !== undefined) data.link = body.link;
    if (body.contentHtml !== undefined) data.contentHtml = body.contentHtml;

    const entry = await prisma.entry.update({
      where: { id: parseInt(id) },
      data,
    });
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.entry.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
