import { createHash, timingSafeEqual } from 'node:crypto';
import type { APIRoute } from 'astro';
import { cleanupPendingAlbums, deleteTextEntry, publishTextEntry, savePhotoFragment } from '@/utils/now/database';
import { normalizeNowText, type TelegramEntity } from '@/utils/now/text';
import { serverEnv } from '@/utils/server-env';

export const prerender = false;
const MAX_BODY_BYTES = 1_000_000;

interface TelegramPost {
  message_id: number;
  date: number;
  edit_date?: number;
  text?: string;
  entities?: TelegramEntity[];
  caption?: string;
  caption_entities?: TelegramEntity[];
  media_group_id?: string;
  photo?: Array<{ file_id: string; width: number; height: number; file_size?: number }>;
  chat: { id: number; username?: string; type: string };
}

interface TelegramUpdate {
  channel_post?: TelegramPost;
  edited_channel_post?: TelegramPost;
}

function secretsEqual(received: string, expected: string): boolean {
  const receivedDigest = createHash('sha256').update(received).digest();
  const expectedDigest = createHash('sha256').update(expected).digest();
  return timingSafeEqual(receivedDigest, expectedDigest);
}

function telegramLink(post: TelegramPost): string {
  if (post.chat.username) return `https://t.me/${post.chat.username}/${post.message_id}`;
  return `https://t.me/c/${String(post.chat.id).replace(/^-100/, '')}/${post.message_id}`;
}

function json(status: number, body: object): Response {
  return Response.json(body, { status });
}

async function readLimitedBody(request: Request): Promise<string | undefined> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return undefined;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function isTargetChannel(post: TelegramPost, configuredChannel: string | undefined): boolean {
  if (!configuredChannel) return false;
  const configured = configuredChannel.replace(/^@/, '');
  return String(post.chat.id) === configured || post.chat.username?.toLowerCase() === configured.toLowerCase();
}

export const POST: APIRoute = async ({ request }) => {
  const expectedSecret = serverEnv('TELEGRAM_WEBHOOK_SECRET');
  const receivedSecret = request.headers.get('x-telegram-bot-api-secret-token') ?? '';
  if (!expectedSecret || !secretsEqual(receivedSecret, expectedSecret)) return json(401, { ok: false });

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return json(413, { ok: false });

  const body = await readLimitedBody(request);
  if (body === undefined) return json(413, { ok: false });

  let update: TelegramUpdate;
  try {
    update = JSON.parse(body) as TelegramUpdate;
  } catch {
    return json(400, { ok: false });
  }

  const post = update.channel_post ?? update.edited_channel_post;
  const targetChannelId = serverEnv('TELEGRAM_CHANNEL_ID');
  if (!post || post.chat.type !== 'channel' || !isTargetChannel(post, targetChannelId)) {
    return json(200, { ok: true });
  }

  const normalized = post.text ? normalizeNowText(post.text, post.entities) : undefined;
  try {
    if (post.photo?.length) {
      const photo = post.photo.at(-1)!;
      const captionNormalized = post.caption ? normalizeNowText(post.caption, post.caption_entities) : undefined;
      await savePhotoFragment({
        channelId: String(post.chat.id), messageId: post.message_id, mediaGroupId: post.media_group_id,
        rawText: post.caption ?? '', entities: post.caption_entities ?? [], fileId: photo.file_id,
        width: photo.width, height: photo.height, publishedAt: post.date, updatedAt: post.edit_date ?? post.date,
        telegramLink: telegramLink(post), normalized: captionNormalized, edited: Boolean(update.edited_channel_post),
      });
      return json(200, { ok: true });
    }
    if (!normalized) {
      if (update.edited_channel_post) await deleteTextEntry(String(post.chat.id), post.message_id);
      else await cleanupPendingAlbums();
      return json(200, { ok: true });
    }
    await publishTextEntry({
      channelId: String(post.chat.id),
      messageId: post.message_id,
      rawText: post.text!,
      displayText: normalized.displayText,
      entities: post.entities ?? [],
      publishedAt: post.date,
      updatedAt: post.edit_date ?? post.date,
      telegramLink: telegramLink(post),
    });
    return json(200, { ok: true });
  } catch {
    return json(500, { ok: false });
  }
};
