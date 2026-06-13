import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { execSync } from "child_process";
import path from "path";

// POST /api/collect - 手动触发采集
export async function POST() {
  const startTime = Date.now();
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    // 1. 执行采集脚本
    const collectorPath = path.join(process.cwd(), "src", "lib", "collector.mjs");
    let scriptOutput = "";

    try {
      scriptOutput = execSync(`node "${collectorPath}"`, {
        timeout: 120000,
        encoding: "utf-8",
        env: { ...process.env, NODE_PATH: path.join(process.cwd(), "node_modules") },
      }).toString();
    } catch (scriptError: any) {
      scriptOutput = scriptError.stdout || scriptError.message || "脚本执行失败";
    }

    // 2. 解析JSON输出
    let collectedArticles = [];
    try {
      const trimmed = scriptOutput.trim();
      collectedArticles = JSON.parse(trimmed);
    } catch {
      // 尝试提取JSON
      const jsonMatch = scriptOutput.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        collectedArticles = JSON.parse(jsonMatch[0]);
      }
    }

    if (!Array.isArray(collectedArticles) || collectedArticles.length === 0) {
      return NextResponse.json({
        success: false,
        error: "采集未返回有效数据",
        totalItems: 0,
        newItems: 0,
      });
    }

    // 3. 去重：获取已有文章的标题和URL
    const existingArticles = await prisma.article.findMany({
      select: { title: true, sourceUrl: true },
    });
    const existingTitles = existingArticles.map((a) => a.title);
    const existingUrls = existingArticles.map((a) => a.sourceUrl || "");

    // 4. 批量插入新文章
    let newCount = 0;
    for (const article of collectedArticles) {
      // 去重检查
      const isDup = existingTitles.some(
        (t) => t === article.title || article.title.includes(t) || t.includes(article.title)
      );
      if (isDup) continue;
      if (article.sourceUrl && existingUrls.includes(article.sourceUrl)) continue;

      try {
        await prisma.article.create({
          data: {
            title: article.title,
            summary: article.summary || null,
            content: article.content || null,
            column: article.column || "industry_news",
            sourceName: article.sourceName || null,
            sourceUrl: article.sourceUrl || null,
            sourceType: article.sourceType || "media",
            imageUrl: article.imageUrl || null,
            gameName: article.gameName || null,
            publishedAt: article.publishedAt || null,
            relevanceScore: article.relevanceScore || 0,
            status: "candidate",
          },
        });
        newCount++;
        existingTitles.push(article.title);
      } catch (insertError) {
        console.error("插入文章失败:", insertError);
      }
    }

    // 5. 记录采集日志
    await prisma.crawlLog.create({
      data: {
        date: todayStr,
        source: "manual",
        status: "success",
        totalItems: collectedArticles.length,
        newItems: newCount,
        duration: Math.floor((Date.now() - startTime) / 1000),
      },
    });

    return NextResponse.json({
      success: true,
      totalItems: collectedArticles.length,
      newItems: newCount,
      duration: Math.floor((Date.now() - startTime) / 1000),
    });
  } catch (error) {
    console.error("采集失败:", error);

    await prisma.crawlLog.create({
      data: {
        date: todayStr,
        source: "manual",
        status: "failed",
        totalItems: 0,
        newItems: 0,
        errors: String(error).substring(0, 500),
        duration: Math.floor((Date.now() - startTime) / 1000),
      },
    });

    return NextResponse.json(
      { error: "采集失败", details: String(error) },
      { status: 500 }
    );
  }
}
