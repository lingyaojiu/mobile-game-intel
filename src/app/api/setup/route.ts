import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/setup - 初始化数据库
export async function GET() {
  try {
    // 测试数据库连接
    await prisma.$connect();

    // 检查是否有文章数据
    const articleCount = await prisma.article.count();
    const gameCount = await prisma.game.count();

    // 如果文章表为空，插入示例数据
    if (articleCount === 0) {
      // 创建示例游戏
      const sampleGames = [
        {
          name: "三国志·战略版",
          nameEn: "Three Kingdoms Strategic Edition",
          developer: "灵犀互娱",
          publisher: "阿里游戏",
          genre: "4X SLG",
          theme: "三国",
          artStyle: "写实",
          coreGameplay: "赛季制大地图SLG",
          combatSystem: "自由行军+实时对战",
          buildingSystem: "城建+资源生产",
          progression: "武将养成+科技树",
          allianceSystem: "联盟+攻城战",
          seasonSystem: "赛季制",
          monetization: "抽卡+月卡+赛季通行证",
        },
        {
          name: "万国觉醒",
          nameEn: "Rise of Kingdoms",
          developer: "莉莉丝游戏",
          publisher: "莉莉丝游戏",
          genre: "4X SLG",
          theme: "多文明",
          artStyle: "卡通写实",
          coreGameplay: "大地图自由行军SLG",
          combatSystem: "实时对战",
          buildingSystem: "城建+科技",
          progression: "统帅养成+科技",
          allianceSystem: "联盟+KVK",
          seasonSystem: "KVK赛季",
          monetization: "抽统帅+月卡",
        },
        {
          name: "无尽的拉格朗日",
          nameEn: "Infinite Lagrange",
          developer: "网易游戏",
          publisher: "网易游戏",
          genre: "太空SLG",
          theme: "科幻太空",
          artStyle: "科幻写实",
          coreGameplay: "太空舰队SLG",
          combatSystem: "自动战斗",
          buildingSystem: "基地建设+舰队",
          progression: "舰船养成+蓝图",
          allianceSystem: "联盟+星系",
          seasonSystem: "赛季制",
          monetization: "抽蓝图+月卡",
        },
      ];

      for (const gameData of sampleGames) {
        await prisma.game.create({ data: gameData });
      }

      // 创建示例信息源
      const sampleSources = [
        { name: "GameLook", type: "media", url: "https://www.gamelook.com.cn", language: "zh", enabled: true },
        { name: "游戏茶馆", type: "media", url: "https://www.youxichaguan.com", language: "zh", enabled: true },
        { name: "游戏葡萄", type: "media", url: "https://youxiputao.com", language: "zh", enabled: true },
        { name: "游民星空", type: "media", url: "https://www.gamersky.com", language: "zh", enabled: true },
        { name: "TapTap", type: "community", url: "https://www.taptap.cn", language: "zh", enabled: true },
        { name: "Sensor Tower", type: "data", url: "https://sensortower.com", language: "en", enabled: true },
        { name: "Data.ai", type: "data", url: "https://www.data.ai", language: "en", enabled: true },
        { name: "微信公众号", type: "wechat", url: "", language: "zh", enabled: true },
      ];

      for (const sourceData of sampleSources) {
        await prisma.source.create({ data: sourceData });
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        articles: articleCount,
        games: gameCount,
      },
      message: "数据库初始化完成",
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "数据库初始化失败", details: String(error) },
      { status: 500 }
    );
  }
}
