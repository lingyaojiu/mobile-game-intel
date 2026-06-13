import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test basic query
    await prisma.$queryRaw`SELECT 1`;

    // Try to add new columns if they don't exist (PostgreSQL)
    const alterCommands = [
      `ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "summary" TEXT`,
      `ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT`,
      `ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "link" TEXT`,
      `ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "contentHtml" TEXT`,
      `ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "publishedAt" TEXT`,
    ];

    for (const sql of alterCommands) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch {
        // Column might already exist, ignore
      }
    }

    return NextResponse.json({ status: "ok", message: "Database setup complete" });
  } catch (error) {
    console.error("Database setup error:", error);
    return NextResponse.json(
      { status: "error", message: "Database setup failed: " + String(error) },
      { status: 500 }
    );
  }
}
