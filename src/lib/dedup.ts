// ===== SLG手游情报与产品分析网站 - 去重逻辑 =====
// 基于标题相似度和URL去重

/**
 * 计算两个字符串的编辑距离（Levenshtein Distance）
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

/**
 * 计算标题相似度 (0-1)
 */
export function titleSimilarity(title1: string, title2: string): number {
  const t1 = title1.replace(/[《》「」""''（）()]/g, '').trim().toLowerCase();
  const t2 = title2.replace(/[《》「」""''（）()]/g, '').trim().toLowerCase();

  if (t1 === t2) return 1;
  if (t1.includes(t2) || t2.includes(t1)) return 0.9;

  const distance = levenshtein(t1, t2);
  const maxLen = Math.max(t1.length, t2.length);
  if (maxLen === 0) return 1;

  return 1 - distance / maxLen;
}

/**
 * 标准化URL（移除协议、www、尾部斜杠等）
 */
export function normalizeUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .replace(/\?.*$/, '')
    .replace(/#.*$/, '');
}

/**
 * 检查URL是否重复
 */
export function isDuplicateUrl(url1: string, url2: string): boolean {
  return normalizeUrl(url1) === normalizeUrl(url2);
}

/**
 * 判断是否为重复文章
 * @param title 新文章标题
 * @param sourceUrl 新文章URL
 * @param existingTitles 已有文章标题列表
 * @param existingUrls 已有文章URL列表
 * @param threshold 相似度阈值（默认0.8）
 */
export function isDuplicate(
  title: string,
  sourceUrl: string | null,
  existingTitles: string[],
  existingUrls: string[],
  threshold = 0.8
): boolean {
  // URL去重
  if (sourceUrl) {
    const normalizedNew = normalizeUrl(sourceUrl);
    for (const url of existingUrls) {
      if (url && isDuplicateUrl(normalizedNew, url)) {
        return true;
      }
    }
  }

  // 标题相似度去重
  for (const existingTitle of existingTitles) {
    if (titleSimilarity(title, existingTitle) >= threshold) {
      return true;
    }
  }

  return false;
}

/**
 * 批量去重：从新文章列表中过滤掉与已有文章重复的
 */
export function deduplicateArticles<T extends { title: string; sourceUrl?: string | null }>(
  newArticles: T[],
  existingTitles: string[],
  existingUrls: string[],
  threshold = 0.8
): T[] {
  return newArticles.filter((article) => {
    return !isDuplicate(
      article.title,
      article.sourceUrl || null,
      existingTitles,
      existingUrls,
      threshold
    );
  });
}

/**
 * 从文章列表中提取所有标题
 */
export function extractTitles(articles: { title: string }[]): string[] {
  return articles.map((a) => a.title);
}

/**
 * 从文章列表中提取所有URL
 */
export function extractUrls(articles: { sourceUrl?: string | null }[]): string[] {
  return articles.map((a) => a.sourceUrl || '').filter(Boolean);
}
