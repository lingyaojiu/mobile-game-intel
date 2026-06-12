# 手游情报每日收集系统

每日收集、整理和查阅手游情报的 Web 应用，支持 11 个情报类别，每日更新不覆盖历史。

## 技术栈

- **前端/后端**：Next.js 15 (App Router)
- **数据库**：PostgreSQL（Neon 免费版）
- **ORM**：Prisma
- **样式**：Tailwind CSS
- **部署**：Vercel（免费套餐）

---

## 部署步骤

### 第一步：创建 GitHub 仓库

1. 打开 https://github.com 并登录你的账号
2. 点击右上角 `+` 号 → `New repository`
3. 仓库名填写 `mobile-game-intel`，选择 **Private**（私有仓库）
4. 不要勾选任何初始化选项，直接点击 **Create repository**
5. 创建完成后，你会看到一排命令提示，先放着备用

### 第二步：推送代码到 GitHub

打开你电脑的终端（CMD 或 PowerShell），逐条执行以下命令：

```bash
# 进入项目目录
cd D:\文档\lingxi-claw\20260612-10-21-55-772\mobile-game-intel

# 初始化 Git
git init
git add .
git commit -m "init: 手游情报收集系统"

# 连接远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/mobile-game-intel.git
git branch -M main
git push -u origin main
```

> 推送时可能会弹出 GitHub 登录窗口，按提示登录即可。

### 第三步：创建 Neon 免费 PostgreSQL 数据库

1. 打开 https://neon.tech 并注册/登录（可用 GitHub 账号直接登录）
2. 点击 **Create a project**
   - Project name: `mobile-game-intel`
   - Region: 选择 **Singapore (Asia Southeast)**（离中国近，延迟低）
   - 点击 **Create project**
3. 创建成功后，你会看到一个连接字符串，类似：
   ```
   postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **复制这个连接字符串**，保存好，下一步要用

### 第四步：部署到 Vercel

1. 打开 https://vercel.com 并登录（推荐用 GitHub 账号登录）
2. 点击 **Add New...** → **Project**
3. 在 Import Git Repository 中，找到并选择 `mobile-game-intel` 仓库
4. 在 **Configure Project** 页面：
   - Framework Preset: 会自动识别为 **Next.js**
   - **Environment Variables** 区域，添加：
     - **Name**: `DATABASE_URL`
     - **Value**: 粘贴你从 Neon 复制的连接字符串
   - 点击 **Add**
5. 点击 **Deploy** 按钮
6. 等待部署完成（约 2-3 分钟）
7. 部署成功后，Vercel 会给你一个域名，类似 `https://mobile-game-intel.vercel.app`

### 第五步：初始化数据库表

部署完成后，需要创建数据库表：

1. 在浏览器中访问以下地址（替换你的域名）：
   ```
   https://mobile-game-intel.vercel.app/api/setup
   ```
2. 页面显示 `Database setup complete` 即表示成功

### 第六步：开始使用

访问你的 Vercel 域名即可开始使用：
```
https://mobile-game-intel.vercel.app
```

---

## 日常使用

### 录入情报
1. 打开首页，选择分类、填写标题和内容
2. 点击「录入情报」即可保存

### 查看历史
1. 点击顶部导航栏的「历史记录」
2. 按日期浏览所有历史情报

### 数据安全
- 数据存储在 Neon PostgreSQL 云端，不会丢失
- 免费套餐包含 500MB 存储，足够日常使用

---

## 本地开发

```bash
# 安装依赖
npm install

# 复制环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 DATABASE_URL

# 初始化数据库
npx prisma db push

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000
