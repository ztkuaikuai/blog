import { createHmac, timingSafeEqual } from 'node:crypto';
import type { APIRoute } from 'astro';
import { latestPublishedAt, listPublishedNowEntries, type NowPageCursor } from '@/utils/now/database';
import { normalizeNowText } from '@/utils/now/text';
import { serverEnv } from '@/utils/server-env';

export const prerender = false;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const RECENT_SECONDS = 48 * 60 * 60;

function cursorSecret(): string {
  const secret = serverEnv('NOW_CURSOR_SECRET') || serverEnv('TELEGRAM_WEBHOOK_SECRET');
  if (!secret) throw new Error('NOW_CURSOR_SECRET is not configured');
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', cursorSecret()).update(payload).digest('base64url');
}

function encodeCursor(cursor: NowPageCursor): string {
  const payload = Buffer.from(JSON.stringify(cursor)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function decodeCursor(value: string): NowPageCursor {
  const [payload, signature, extra] = value.split('.');
  if (!payload || !signature || extra) throw new Error('invalid cursor');
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new Error('invalid cursor');
  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Partial<NowPageCursor>;
  if (!Number.isSafeInteger(parsed.publishedAt) || !Number.isSafeInteger(parsed.id)) throw new Error('invalid cursor');
  return parsed as NowPageCursor;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const requestedLimit = Number.parseInt(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : DEFAULT_LIMIT, 1), MAX_LIMIT);
  let cursor: NowPageCursor | undefined;
  const cursorValue = url.searchParams.get('cursor');
  if (cursorValue) {
    try {
      cursor = decodeCursor(cursorValue);
    } catch {
      return Response.json({ error: '无效游标' }, { status: 400 });
    }
  }

  try {
    const [{ entries, hasMore }, latest] = await Promise.all([
      listPublishedNowEntries(limit, cursor),
      latestPublishedAt(),
    ]);
    const messages = entries.map((entry) => ({
      id: String(entry.telegramMessageId),
      text: entry.displayText,
      entities: normalizeNowText(entry.rawText, entry.entities)?.displayEntities ?? [],
      timestamp: new Date(entry.publishedAt * 1000).toISOString(),
      link: entry.telegramLink,
    }));
    const last = entries.at(-1);
    return Response.json({
      messages,
      nextCursor: hasMore && last ? encodeCursor({ publishedAt: last.publishedAt, id: last.id }) : null,
      hasRecentUpdate: latest !== undefined && latest >= Math.floor(Date.now() / 1000) - RECENT_SECONDS,
    });
  } catch {
    return Response.json(
      { error: '暂时无法获取数据，请稍后重试', messages: [], nextCursor: null, hasRecentUpdate: false },
      { status: 503 },
    );
  }
};
