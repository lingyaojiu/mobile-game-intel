# SLG手游情报与产品分析网站 - 项目规划

## 技术栈
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + 深色主题
- Prisma + SQLite (本地) / PostgreSQL (Vercel)
- 保留现有 Git 仓库和 Vercel 部署配置

## 数据库表结构

### games 游戏表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| name | String | 游戏名称 |
| nameEn | String? | 英文名称 |
| developer | String? | 开发商 |
| publisher | String? | 发行商 |
| launchDate | String? | 上线时间 |
| markets | String? | 主要市场(逗号分隔) |
| theme | String? | 游戏题材 |
| genre | String? | 游戏类型(4X/战争/休闲SLG等) |
| artStyle | String? | 美术风格 |
| coreGameplay | String? | 核心玩法 |
| combatSystem | String? | 战斗方式 |
| buildingSystem | String? | 城建系统 |
| progression | String? | 养成系统 |
| allianceSystem | String? | 联盟系统 |
| seasonSystem | String? | 赛季系统 |
| monetization | String? | 商业化方式 |
| appStoreUrl | String? | App Store链接 |
| googlePlayUrl | String? | Google Play链接 |
| officialUrl | String? | 官网 |
| tags | String? | 标签(逗号分隔) |
| imageUrl | String? | 游戏封面 |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### articles 文章表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键 |
| gameId | Int? | 关联游戏 |
| column | String | 栏目(news/review/analysis等) |
| title | String | 标题 |
| summary | String? | 摘要(80-150字) |
| content | String? | 正文(分析内容) |
| background | String? | 事件背景 |
| keyPoints | String? | 核心信息(JSON数组) |
| analysis | String? | SLG产品分析 |
| insights | String? | 从业者启示 |
| sourceName | String? | 来源名称 |
| sourceUrl | String? | 原文链接 |
| sourceType | String? | 来源类型(official/media/data/community) |
| isPrimary | Boolean | 是否一手来源 |
| publishedAt | String? | 原文发布时间 |
| imageUrl | String? | 封面图 |
| gameName | String? | 游戏名称(冗余) |
| companyName | String? | 公司名称(冗余) |
| region | String? | 市场地区 |
| category | String? | 内容标签 |
| credibility | Int? | 可信度1-5 |
| relevanceScore | Int? | 相关性评分0-100 |
| status | String | candidate/pending_review/published/rejected/archived |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### companies 公司表
| 字段 | 说明 |
|------|------|
| id, name, nameEn, country, website, description, createdAt, updatedAt |

### sources 信息源表
| 字段 | 说明 |
|------|------|
| id, name, type, url, rssUrl, language, enabled, lastCrawled, createdAt |

### tags 标签表
| 字段 | 说明 |
|------|------|
| id, name, type(game/theme/mechanic/region), createdAt |

### daily_reports 每日简报
| 字段 | 说明 |
|------|------|
| id, date, title, content, articleCount, status, createdAt |

### crawl_logs 采集日志
| 字段 | 说明 |
|------|------|
| id, date, source, status, totalItems, newItems, errors, duration, createdAt |

### review_queue 审核队列
| 字段 | 说明 |
|------|------|
| id, articleId, action, reviewer, comment, createdAt |

## 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| / | 首页 | 今日重点、SLG动态、新游观察、产品测评等 |
| /article/[id] | 文章详情 | 完整文章阅读 |
| /game/[id] | 游戏资料库 | 游戏详情+相关文章 |
| /games | 游戏列表 | 游戏资料库浏览 |
| /column/[slug] | 栏目页 | 按栏目筛选文章 |
| /search | 搜索 | 全文搜索+高级筛选 |
| /daily | 每日简报 | 每日简报列表 |
| /admin | 后台管理 | 审核、编辑、管理 |
| /admin/articles | 文章管理 | 待审核/已发布文章列表 |
| /admin/games | 游戏管理 | 游戏资料管理 |
| /admin/sources | 信息源管理 | 配置采集源 |
| /admin/logs | 采集日志 | 查看采集任务状态 |
| /rss | RSS订阅 | RSS feed |

## 文章状态流转
candidate → pending_review → published
                          → rejected
                          → archived

## 栏目定义
1. daily_brief - 每日简报
2. new_game - 新游观察
3. product_review - 产品测评
4. gameplay_analysis - 玩法拆解
5. chart_analysis - 榜单观察
6. ad_creative - 买量素材观察
7. version_update - 版本更新分析
8. industry_news - 厂商与行业动态
9. overseas - 海外市场
10. deep_dive - 深度专题
11. data_report - 数据报告
12. game_database - 产品资料库

## 执行顺序
1. ✅ 项目规划（当前）
2. 数据库 Schema 设计
3. 核心库文件（Prisma客户端、分类定义、评分器）
4. 布局和全局样式
5. 首页
6. 文章详情页
7. 游戏资料库页
8. 后台管理页
9. 采集引擎
10. 每日简报生成
11. API 路由
12. 部署配置更新
13. 本地测试
