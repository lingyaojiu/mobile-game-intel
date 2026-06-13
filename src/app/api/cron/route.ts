import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { execSync } from "child_process";
import path from "path";

// GET /api/cron - 定时采集任务（Vercel Cron Jobs调用）
// 每天早上9点（UTC 1:00）执行
export async function GET() {
  const startTime = Date.now();
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const results: { source: string; status: string; count: number }[] = [];

  try {
    // 1. 执行采集脚本
    const collectorPath = path.join(process.cwd(), "src", "lib", "collector.mjs");
    let scriptSuccess = false;
    let scriptOutput = "";

    try {
      scriptOutput = execSync(`node "${collectorPath}"`, {
        timeout: 120000, // 2分钟超时
        encoding: "utf-8",
        env: { ...process.env, NODE_PATH: path.join(process.cwd(), "node_modules") },
      }).toString();
      scriptSuccess = true;
    } catch (scriptError: any) {
      scriptOutput = scriptError.stdout || scriptError.message || "脚本执行失败";
    }

    // 解析脚本输出
    const totalMatch = scriptOutput.match(/总计[：:]\s*(\d+)/);
    const newMatch = scriptOutput.match(/新增[：:]\s*(\d+)/);
    const totalItems = totalMatch ? parseInt(totalMatch[1]) : 0;
    const newItems = newMatch ? parseInt(newMatch[1]) : 0;

    // 2. 记录采集日志
    await prisma.crawlLog.create({
      data: {
        date: todayStr,
        source: "cron_auto",
        status: scriptSuccess ? "success" : "partial",
        totalItems,
        newItems,
        errors: scriptSuccess ? null : scriptOutput.substring(0, 500),
        duration: Math.floor((Date.now() - startTime) / 1000),
      },
    });

    // 3. 尝试生成每日简报
    try {
      const todayArticles = await prisma.article.findMany({
        where: {
          publishedAt: { gte: todayStr },
          status: "published",
        },
        orderBy: { relevanceScore: "desc" },
        take: 20,
      });

      if (todayArticles.length > 0) {
        // 检查是否已有简报
        const existing = await prisma.dailyReport.findUnique({
          where: { date: todayStr },
        });

        if (!existing) {
          const grouped: Record<string, typeof todayArticles> = {};
          for (const article of todayArticles) {
            if (!grouped[article.column]) grouped[article.column] = [];
            grouped[article.column].push(article);
          }

          const lines: string[] = [];
          lines.push(`# SLG行业情报简报 - ${todayStr}`);
          lines.push("");
          lines.push(`今日共收录 ${todayArticles.length} 篇相关文章，涵盖 ${Object.keys(grouped).length} 个栏目。`);
          lines.push("");

          for (const [column, articles] of Object.entries(grouped)) {
            lines.push(`## ${getColumnLabel(column)}`);
            lines.push("");
            articles.slice(0, 5).forEach((article, i) => {
              lines.push(`${i + 1}. **${article.title}**`);
              if (article.summary) lines.push(`   ${article.summary}`);
              if (article.sourceName) lines.push(`   来源：${article.sourceName}`);
              lines.push("");
            });
          }

          lines.push("---");
          lines.push("> 本简报由 SLG手游情报系统自动生成，仅供行业研究参考。");

          await prisma.dailyReport.create({
            data: {
              date: todayStr,
              title: `SLG行业情报简报 ${todayStr}`,
              content: lines.join("\n"),
              articleCount: todayArticles.length,
              status: "published",
            },
          });
        }
      }
    } catch (reportError) {
      console.error("生成简报失败:", reportError);
    }

    return NextResponse.json({
      success: true,
      duration: Math.floor((Date.now() - startTime) / 1000),
      totalItems,
      newItems,
      results,
    });
  } catch (error) {
    console.error("Cron job error:", error);

    // 记录失败日志
    await prisma.crawlLog.create({
      data: {
        date: todayStr,
        source: "cron_auto",
        status: "failed",
        totalItems: 0,
        newItems: 0,
        errors: String(error).substring(0, 500),
        duration: Math.floor((Date.now() - startTime) / 1000),
      },
    });

    return NextResponse.json(
      { error: "定时任务执行失败", details: String(error) },
      { status: 500 }
    );
  }
}

function getColumnLabel(column: string): string {
  const labels: Record<string, string> = {
    daily_brief: "每日简报",
    new_game: "新游观察",
    product_review: "产品测评",
    gameplay_analysis: "玩法拆解",
    chart_analysis: "榜单观察",
    ad_creative: "买量素材",
    version_update: "版本更新",
    industry_news: "行业动态",
    overseas: "海外市场",
    deep_dive: "深度专题",
    data_report: "数据报告",
    game_database: "产品资料库",
  };
  return labels[column] || column;
}
