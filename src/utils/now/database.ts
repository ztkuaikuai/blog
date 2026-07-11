import { createClient, type Client } from '@libsql/client';
import { randomUUID } from 'node:crypto';
import type { TelegramEntity } from './text';
import { serverEnv } from '@/utils/server-env';

let testClient: Client | undefined;
let productionClient: Client | undefined;

export function setNowDatabaseForTests(client: Client | undefined): void {
  testClient = client;
}

export function getNowDatabase(): Client {
  if (testClient) return testClient;
  if (!productionClient) {
    const url = serverEnv('TURSO_DATABASE_URL');
    const authToken = serverEnv('TURSO_AUTH_TOKEN');
    if (!url) throw new Error('TURSO_DATABASE_URL is not configured');
    productionClient = createClient({ url, authToken });
  }
  return productionClient;
}

export interface PublishedTextEntry {
  channelId: string;
  messageId: number;
  rawText: string;
  displayText: string;
  entities: TelegramEntity[];
  publishedAt: number;
  updatedAt: number;
  telegramLink: string;
}

export async function publishTextEntry(entry: PublishedTextEntry): Promise<void> {
  const db = getNowDatabase();
  await db.batch([
    pendingAlbumCleanupStatement(),
    {
      sql: `INSERT INTO now_entries (
        telegram_channel_id, telegram_message_id, group_key, raw_text, display_text, entities_json,
        published_at, updated_at, status, telegram_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)
      ON CONFLICT (telegram_channel_id, group_key) DO UPDATE SET
        raw_text = excluded.raw_text,
        display_text = excluded.display_text,
        entities_json = excluded.entities_json,
        published_at = excluded.published_at,
        updated_at = excluded.updated_at,
        status = 'published',
        telegram_link = excluded.telegram_link`,
      args: [entry.channelId, entry.messageId, `message:${entry.messageId}`, entry.rawText, entry.displayText,
        JSON.stringify(entry.entities), entry.publishedAt, entry.updatedAt, entry.telegramLink],
    },
    {
      sql: `INSERT INTO telegram_message_fragments (
        entry_id, telegram_channel_id, telegram_message_id, raw_text, entities_json
      ) SELECT id, ?, ?, ?, ? FROM now_entries
        WHERE telegram_channel_id = ? AND group_key = ?
      ON CONFLICT (telegram_channel_id, telegram_message_id) DO UPDATE SET
        entry_id = excluded.entry_id,
        raw_text = excluded.raw_text,
        entities_json = excluded.entities_json`,
      args: [entry.channelId, entry.messageId, entry.rawText, JSON.stringify(entry.entities),
        entry.channelId, `message:${entry.messageId}`],
    },
  ], 'write');
}

export async function deleteTextEntry(channelId: string, messageId: number): Promise<void> {
  await getNowDatabase().batch([
    pendingAlbumCleanupStatement(),
    { sql: 'DELETE FROM now_entries WHERE telegram_channel_id = ? AND telegram_message_id = ?', args: [channelId, messageId] },
  ], 'write');
}

export interface NowPageCursor {
  publishedAt: number;
  id: number;
}

export interface StoredNowEntry {
  id: number;
  telegramMessageId: number;
  rawText: string;
  displayText: string;
  entities: TelegramEntity[];
  publishedAt: number;
  telegramLink: string;
  images: Array<{ id: string; width: number; height: number }>;
}

export async function listPublishedNowEntries(
  limit: number,
  cursor?: NowPageCursor,
): Promise<{ entries: StoredNowEntry[]; hasMore: boolean }> {
  const cursorClause = cursor ? 'AND (published_at < ? OR (published_at = ? AND id < ?))' : '';
  const args = cursor ? [cursor.publishedAt, cursor.publishedAt, cursor.id, limit + 1] : [limit + 1];
  const result = await getNowDatabase().execute({
    sql: `SELECT id, telegram_message_id, raw_text, display_text, entities_json,
      published_at, telegram_link
      FROM now_entries
      WHERE status = 'published' ${cursorClause}
      ORDER BY published_at DESC, id DESC
      LIMIT ?`,
    args,
  });
  const entries = await Promise.all(result.rows.slice(0, limit).map(async (row) => ({
    id: Number(row.id),
    telegramMessageId: Number(row.telegram_message_id),
    rawText: String(row.raw_text),
    displayText: String(row.display_text),
    entities: JSON.parse(String(row.entities_json)) as TelegramEntity[],
    publishedAt: Number(row.published_at),
    telegramLink: String(row.telegram_link),
    images: (await getNowDatabase().execute({
      sql: `SELECT image_id, width, height FROM telegram_message_fragments
        WHERE entry_id = ? AND file_id IS NOT NULL ORDER BY telegram_message_id`,
      args: [Number(row.id)],
    })).rows.map((image) => ({ id: String(image.image_id), width: Number(image.width), height: Number(image.height) })),
  })));
  return { entries, hasMore: result.rows.length > limit };
}

export interface PhotoFragmentInput {
  channelId: string;
  messageId: number;
  mediaGroupId?: string;
  rawText: string;
  entities: TelegramEntity[];
  fileId: string;
  width: number;
  height: number;
  publishedAt: number;
  updatedAt: number;
  telegramLink: string;
  normalized?: { displayText: string };
  edited: boolean;
}

export async function savePhotoFragment(input: PhotoFragmentInput): Promise<void> {
  const db = getNowDatabase();
  const tx = await db.transaction('write');
  const groupKey = input.mediaGroupId ? `album:${input.mediaGroupId}` : `message:${input.messageId}`;
  try {
    await tx.execute(pendingAlbumCleanupStatement());
    const existingFragment = await tx.execute({
      sql: `SELECT e.id AS entry_id, e.status, f.raw_text FROM telegram_message_fragments f
        JOIN now_entries e ON e.id = f.entry_id
        WHERE f.telegram_channel_id = ? AND f.telegram_message_id = ?`,
      args: [input.channelId, input.messageId],
    });
    const previousHadTag = normalizeStoredNowText(String(existingFragment.rows[0]?.raw_text ?? ''));
    if (input.edited && existingFragment.rows[0]?.status === 'published' && previousHadTag && !input.normalized) {
      await tx.execute({ sql: 'DELETE FROM now_entries WHERE id = ?', args: [Number(existingFragment.rows[0].entry_id)] });
      await tx.commit();
      return;
    }

    await tx.batch([
    {
      sql: `INSERT INTO now_entries (
        telegram_channel_id, telegram_message_id, group_key, media_group_id, raw_text, display_text,
        entities_json, published_at, updated_at, status, telegram_link
      ) VALUES (?, ?, ?, ?, '', '', '[]', ?, ?, 'pending', ?)
      ON CONFLICT (telegram_channel_id, group_key) DO NOTHING`,
      args: [input.channelId, input.messageId, groupKey, input.mediaGroupId ?? null,
        input.publishedAt, input.updatedAt, input.telegramLink],
    },
    {
      sql: `INSERT INTO telegram_message_fragments (
        entry_id, telegram_channel_id, telegram_message_id, raw_text, entities_json,
        file_id, image_id, width, height, received_at
      ) SELECT id, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM now_entries
        WHERE telegram_channel_id = ? AND group_key = ?
      ON CONFLICT (telegram_channel_id, telegram_message_id) DO UPDATE SET
        raw_text = excluded.raw_text, entities_json = excluded.entities_json,
        file_id = excluded.file_id, width = excluded.width, height = excluded.height`,
      args: [input.channelId, input.messageId, input.rawText, JSON.stringify(input.entities), input.fileId,
        randomUUID(), input.width, input.height, input.publishedAt, input.channelId, groupKey],
    },
    ]);

  if (input.normalized) {
    const first = await tx.execute({
      sql: `SELECT MIN(telegram_message_id) AS first_id FROM telegram_message_fragments
        WHERE entry_id = (SELECT id FROM now_entries WHERE telegram_channel_id = ? AND group_key = ?)`,
      args: [input.channelId, groupKey],
    });
    const firstId = Number(first.rows[0].first_id);
    const link = input.telegramLink.replace(/\/\d+$/, `/${firstId}`);
    await tx.execute({
      sql: `UPDATE now_entries SET telegram_message_id = ?, raw_text = ?, display_text = ?, entities_json = ?,
        published_at = MIN(published_at, ?), updated_at = ?, status = 'published', telegram_link = ?
        WHERE telegram_channel_id = ? AND group_key = ?`,
      args: [firstId, input.rawText, input.normalized.displayText, JSON.stringify(input.entities),
        input.publishedAt, input.updatedAt, link, input.channelId, groupKey],
    });
  } else if (input.mediaGroupId) {
    const album = await tx.execute({
      sql: `SELECT e.status, MIN(f.telegram_message_id) AS first_id, MIN(e.published_at) AS published_at
        FROM now_entries e JOIN telegram_message_fragments f ON f.entry_id = e.id
        WHERE e.telegram_channel_id = ? AND e.group_key = ? GROUP BY e.id`,
      args: [input.channelId, groupKey],
    });
    if (album.rows[0]?.status === 'published') {
      const firstId = Number(album.rows[0].first_id);
      await tx.execute({
        sql: `UPDATE now_entries SET telegram_message_id = ?, published_at = MIN(published_at, ?),
          telegram_link = ? WHERE telegram_channel_id = ? AND group_key = ?`,
        args: [firstId, input.publishedAt, input.telegramLink.replace(/\/\d+$/, `/${firstId}`), input.channelId, groupKey],
      });
    }
    }
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

function normalizeStoredNowText(rawText: string): boolean {
  return /#now\b/i.test(rawText);
}

function pendingAlbumCleanupStatement() {
  return {
    sql: `DELETE FROM now_entries WHERE status = 'pending' AND published_at < ?`,
    args: [Math.floor(Date.now() / 1000) - 24 * 60 * 60],
  };
}

export async function cleanupPendingAlbums(): Promise<void> {
  await getNowDatabase().execute(pendingAlbumCleanupStatement());
}

export async function findPublishedImage(imageId: string): Promise<{ fileId: string } | undefined> {
  const result = await getNowDatabase().execute({
    sql: `SELECT f.file_id FROM telegram_message_fragments f JOIN now_entries e ON e.id = f.entry_id
      WHERE f.image_id = ? AND f.file_id IS NOT NULL AND e.status = 'published'`,
    args: [imageId],
  });
  return result.rows[0] ? { fileId: String(result.rows[0].file_id) } : undefined;
}

export async function latestPublishedAt(): Promise<number | undefined> {
  const result = await getNowDatabase().execute(
    "SELECT published_at FROM now_entries WHERE status = 'published' ORDER BY published_at DESC, id DESC LIMIT 1",
  );
  return result.rows[0] ? Number(result.rows[0].published_at) : undefined;
}
