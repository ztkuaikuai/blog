import { createClient, type Client } from '@libsql/client';
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
    {
      sql: `INSERT INTO now_entries (
        telegram_channel_id, telegram_message_id, raw_text, display_text, entities_json,
        published_at, updated_at, status, telegram_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?)
      ON CONFLICT (telegram_channel_id, telegram_message_id) DO UPDATE SET
        raw_text = excluded.raw_text,
        display_text = excluded.display_text,
        entities_json = excluded.entities_json,
        published_at = excluded.published_at,
        updated_at = excluded.updated_at,
        status = 'published',
        telegram_link = excluded.telegram_link`,
      args: [entry.channelId, entry.messageId, entry.rawText, entry.displayText,
        JSON.stringify(entry.entities), entry.publishedAt, entry.updatedAt, entry.telegramLink],
    },
    {
      sql: `INSERT INTO telegram_message_fragments (
        entry_id, telegram_channel_id, telegram_message_id, raw_text, entities_json
      ) SELECT id, ?, ?, ?, ? FROM now_entries
        WHERE telegram_channel_id = ? AND telegram_message_id = ?
      ON CONFLICT (telegram_channel_id, telegram_message_id) DO UPDATE SET
        entry_id = excluded.entry_id,
        raw_text = excluded.raw_text,
        entities_json = excluded.entities_json`,
      args: [entry.channelId, entry.messageId, entry.rawText, JSON.stringify(entry.entities),
        entry.channelId, entry.messageId],
    },
  ], 'write');
}

export async function deleteTextEntry(channelId: string, messageId: number): Promise<void> {
  await getNowDatabase().execute({
    sql: 'DELETE FROM now_entries WHERE telegram_channel_id = ? AND telegram_message_id = ?',
    args: [channelId, messageId],
  });
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
  const entries = result.rows.slice(0, limit).map((row) => ({
    id: Number(row.id),
    telegramMessageId: Number(row.telegram_message_id),
    rawText: String(row.raw_text),
    displayText: String(row.display_text),
    entities: JSON.parse(String(row.entities_json)) as TelegramEntity[],
    publishedAt: Number(row.published_at),
    telegramLink: String(row.telegram_link),
  }));
  return { entries, hasMore: result.rows.length > limit };
}

export async function latestPublishedAt(): Promise<number | undefined> {
  const result = await getNowDatabase().execute(
    "SELECT published_at FROM now_entries WHERE status = 'published' ORDER BY published_at DESC, id DESC LIMIT 1",
  );
  return result.rows[0] ? Number(result.rows[0].published_at) : undefined;
}
