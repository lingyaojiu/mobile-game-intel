import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Run a simple query to verify the database connection
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", message: "Database setup complete" });
  } catch (error) {
    console.error("Database setup error:", error);
    return NextResponse.json(
      { status: "error", message: "Database setup failed" },
      { status: 500 }
    );
  }
}
