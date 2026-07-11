// ============================================================
// /api/now.json — Telegram #now 消息代理
// ============================================================
// 服务端调用 Telegram Bot API 获取频道消息，筛选带 #now 标签的消息，
// 缓存并分页返回。浏览器不直接访问 Telegram。
// ============================================================

export const prerender = false;

// ---- 类型定义 ----

interface NowMessage {
  id: string;
  text: string;
  images: string[];
  timestamp: string;
  link: string;
}

interface ApiResponse {
  messages: NowMessage[];
  hasRecentUpdate: boolean;
  stale?: boolean;
  error?: string;
}

interface TelegramUpdate {
  update_id: number;
  channel_post?: {
    message_id: number;
    date: number;
    text?: string;
    caption?: string;
    photo?: Array<{ file_id: string; file_unique_id: string; width: number; height: number; file_size?: number }>;
  };
}

// ---- 缓存 ----

// 存储所有已抓取的消息（按消息 ID 去重）
let allMessages: NowMessage[] = [];
// 上次从 Telegram 拉取的时间戳
let lastFetchTime = 0;
// API 响应缓存（仅缓存无 offset 请求）
const responseCache = new Map<string, { timestamp: number }>();
const CACHE_TTL = 60_000; // 60 秒
// file_path 缓存，避免重复调用 getFile
const filePathCache = new Map<string, string>();

// ---- 环境变量 ----

// 服务端环境变量：优先 import.meta.env（Astro/Vite），回退到 process.env（Node/Vercel）
const TELEGRAM_BOT_TOKEN = import.meta.env?.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = import.meta.env?.TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_CHANNEL_ID;

// ---- 工具函数 ----

/** 检查消息是否包含 #now 标签 */
function hasNowTag(text: string | undefined): boolean {
  if (!text) return false;
  return /#now\b/i.test(text);
}

/** 去除 #now 标签 */
function stripNowTag(text: string): string {
  return text
    .replace(/#now\b\s*/gi, '')
    .replace(/\s+#now\b/gi, '')
    .trim();
}

/** 判断最近 48 小时内是否有更新 */
function checkRecentUpdate(messages: NowMessage[]): boolean {
  if (messages.length === 0) return false;
  const latest = new Date(messages[0].timestamp).getTime();
  const now = Date.now();
  return (now - latest) <= 48 * 60 * 60 * 1000;
}

/** 生成 Telegram 消息链接 */
function buildTelegramLink(channelId: string, messageId: number): string {
  // 频道 ID 可能是 @username 格式或数字 ID
  // 数字 ID（如 -1001234567890）→ https://t.me/c/1234567890/messageId
  const numericMatch = channelId.match(/^-100(\d+)$/);
  if (numericMatch) {
    return `https://t.me/c/${numericMatch[1]}/${messageId}`;
  }
  // @username 或纯 username → https://t.me/username/messageId
  const clean = channelId.replace(/^@/, '');
  return `https://t.me/${clean}/${messageId}`;
}

// ---- Telegram API 调用 ----

/** 调用 Telegram Bot API，获取文件下载路径 */
async function getFilePath(fileId: string): Promise<string> {
  const cached = filePathCache.get(fileId);
  if (cached) return cached;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Telegram getFile failed: ${res.status}`);

  const data = await res.json() as { ok: boolean; result?: { file_path: string } };
  if (!data.ok || !data.result) throw new Error('Telegram getFile: invalid response');

  const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${data.result.file_path}`;
  filePathCache.set(fileId, downloadUrl);
  return downloadUrl;
}

/** 从 Telegram 拉取最新消息 */
async function fetchFromTelegram(): Promise<NowMessage[]> {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN 环境变量未配置');
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Telegram API 返回 ${res.status}`);
  }

  const data = await res.json() as { ok: boolean; result?: TelegramUpdate[] };
  if (!data.ok || !data.result) {
    throw new Error('Telegram API 返回非 ok 响应');
  }

  const channelUsername = TELEGRAM_CHANNEL_ID || '';

  // 筛选来自目标频道的 channel_post 消息
  const channelPosts = data.result.filter(
    (u) => u.channel_post && hasNowTag(u.channel_post.text || u.channel_post.caption)
  );

  // 并行解析图片
  const messages: NowMessage[] = [];
  for (const update of channelPosts) {
    const post = update.channel_post!;
    const rawText = post.text || post.caption || '';
    const text = stripNowTag(rawText);

    // 解析图片
    const images: string[] = [];
    if (post.photo && post.photo.length > 0) {
      // 取最大尺寸的 photo（最后一个）
      const largestPhoto = post.photo[post.photo.length - 1];
      try {
        const downloadUrl = await getFilePath(largestPhoto.file_id);
        images.push(downloadUrl);
      } catch {
        // 单张图片获取失败不影响整体
      }
    }

    messages.push({
      id: String(post.message_id),
      text,
      images,
      timestamp: new Date(post.date * 1000).toISOString(),
      link: buildTelegramLink(channelUsername, post.message_id),
    });
  }

  return messages;
}

/** 合并新旧消息（按 message_id 去重，保持倒序） */
function mergeMessages(existing: NowMessage[], incoming: NowMessage[]): NowMessage[] {
  const map = new Map<string, NowMessage>();
  // 先放入已有消息
  for (const msg of existing) {
    map.set(msg.id, msg);
  }
  // 新消息覆盖（同 ID 则以新的为准）
  for (const msg of incoming) {
    map.set(msg.id, msg);
  }
  // 按时间戳倒序排列
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/** 分页切片 */
function paginate(messages: NowMessage[], limit: number, offset: number): NowMessage[] {
  return messages.slice(offset, offset + limit);
}

// ---- API 路由 ----

export async function GET({ request }: { request: Request }): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20'), 1), 100);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

  const now = Date.now();
  const isFirstPage = offset === 0;

  // 首页命中缓存
  const cacheKey = `page_${limit}`;
  if (isFirstPage) {
    const cached = responseCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      // 缓存命中：直接从 allMessages 切片分页
      const paged = paginate(allMessages, limit, offset);
      return new Response(
        JSON.stringify({
          messages: paged,
          hasRecentUpdate: checkRecentUpdate(allMessages),
        } satisfies ApiResponse),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 尝试刷新消息
  let fetchError = false;
  if (!lastFetchTime || now - lastFetchTime > CACHE_TTL) {
    try {
      const newMessages = await fetchFromTelegram();
      allMessages = mergeMessages(allMessages, newMessages);
      lastFetchTime = now;
    } catch {
      fetchError = true;
    }
  }

  // Telegram API 失败时的降级策略
  if (fetchError) {
    if (allMessages.length > 0) {
      // 有缓存数据，返回 stale + 缓存
      const paged = paginate(allMessages, limit, offset);
      return new Response(
        JSON.stringify({
          messages: paged,
          hasRecentUpdate: checkRecentUpdate(allMessages),
          stale: true,
        } satisfies ApiResponse),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // 无缓存，返回错误
    return new Response(
      JSON.stringify({
        error: '暂时无法获取数据，请稍后重试',
        messages: [],
        hasRecentUpdate: false,
      } satisfies ApiResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 更新首页缓存
  if (isFirstPage) {
    responseCache.set(cacheKey, { timestamp: now });
  }

  // 返回分页结果
  const paged = paginate(allMessages, limit, offset);
  return new Response(
    JSON.stringify({
      messages: paged,
      hasRecentUpdate: checkRecentUpdate(allMessages),
    } satisfies ApiResponse),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

// ---- 测试辅助 ----

/** 重置所有缓存状态（仅用于测试） */
export function __resetForTest(): void {
  allMessages = [];
  lastFetchTime = 0;
  responseCache.clear();
  filePathCache.clear();
}
