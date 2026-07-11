import type { Client } from '@libsql/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNowTestDatabase } from '../../helpers/now-database';

const secret = 'telegram-webhook-secret';
let client: Client;
let cleanup: () => Promise<void>;

function update(messageId: number, text: string, options: { edited?: boolean; channelId?: number; date?: number; entities?: unknown[] } = {}) {
  const post = {
    message_id: messageId,
    date: options.date ?? 1_700_000_000,
    text,
    entities: options.entities ?? [],
    chat: { id: options.channelId ?? -1001234567890, username: 'testchannel', type: 'channel' },
  };
  return { update_id: messageId, [options.edited ? 'edited_channel_post' : 'channel_post']: post };
}

function photoUpdate(messageId: number, caption: string | undefined, options: { edited?: boolean; mediaGroupId?: string; date?: number } = {}) {
  const post = {
    message_id: messageId,
    date: options.date ?? 1_700_000_000,
    ...(options.edited ? { edit_date: 1_700_000_100 } : {}),
    ...(caption === undefined ? {} : { caption }),
    ...(options.mediaGroupId ? { media_group_id: options.mediaGroupId } : {}),
    photo: [
      { file_id: `small-${messageId}`, file_unique_id: `small-u-${messageId}`, width: 90, height: 90, file_size: 100 },
      { file_id: `large-${messageId}`, file_unique_id: `large-u-${messageId}`, width: 1280, height: 720, file_size: 2000 },
    ],
    chat: { id: -1001234567890, username: 'testchannel', type: 'channel' },
  };
  return options.edited ? { edited_channel_post: post } : { channel_post: post };
}

async function callWebhook(body: unknown, providedSecret = secret, headers: Record<string, string> = {}) {
  const { POST } = await import('../../../src/pages/api/telegram/webhook');
  return POST({
    request: new Request('http://localhost/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': providedSecret,
        ...headers,
      },
      body: JSON.stringify(body),
    }),
  } as never);
}

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(1_700_000_000 * 1000));
  vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', secret);
  vi.stubEnv('TELEGRAM_CHANNEL_ID', '-1001234567890');
  ({ client, cleanup } = await createNowTestDatabase());
  const database = await import('../../../src/utils/now/database');
  database.setNowDatabaseForTests(client);
});

afterEach(async () => {
  const database = await import('../../../src/utils/now/database');
  database.setNowDatabaseForTests(undefined);
  await cleanup();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('POST /api/telegram/webhook', () => {
  it('拒绝错误密钥和超过限制的请求', async () => {
    expect((await callWebhook(update(1, '#now secret'), 'wrong')).status).toBe(401);
    expect((await callWebhook(update(1, '#now large'), secret, { 'content-length': '1000001' })).status).toBe(413);
    expect((await callWebhook({ payload: 'x'.repeat(1_000_001) }, secret)).status).toBe(413);
  });

  it('忽略合法但无关的更新和其他频道', async () => {
    expect((await callWebhook({ update_id: 1, message: { text: '#now private' } })).status).toBe(200);
    expect((await callWebhook(update(2, '#now elsewhere', { channelId: -1009 }))).status).toBe(200);
    expect(Number((await client.execute('SELECT count(*) AS count FROM now_entries')).rows[0].count)).toBe(0);
  });

  it('大小写不敏感地发布纯文字并保存原文与 entities', async () => {
    vi.stubEnv('TELEGRAM_CHANNEL_ID', '@testchannel');
    const entities = [{ type: 'text_link', offset: 5, length: 4, url: 'https://example.com' }];
    expect((await callWebhook(update(3, '#NOW link\nline', { entities }))).status).toBe(200);

    const entry = (await client.execute('SELECT * FROM now_entries')).rows[0];
    const fragment = (await client.execute('SELECT * FROM telegram_message_fragments')).rows[0];
    expect(entry.display_text).toBe('link\nline');
    expect(fragment.raw_text).toBe('#NOW link\nline');
    expect(JSON.parse(String(fragment.entities_json))).toEqual(entities);
  });

  it('重复推送幂等，编辑会更新，移除标签会级联删除', async () => {
    await callWebhook(update(4, '#now first'));
    await callWebhook(update(4, '#now first'));
    expect(Number((await client.execute('SELECT count(*) AS count FROM now_entries')).rows[0].count)).toBe(1);

    await callWebhook(update(4, '#NOW edited', { edited: true }));
    expect((await client.execute('SELECT display_text FROM now_entries')).rows[0].display_text).toBe('edited');

    await callWebhook(update(4, '撤回发布', { edited: true }));
    expect(Number((await client.execute('SELECT count(*) AS count FROM now_entries')).rows[0].count)).toBe(0);
    expect(Number((await client.execute('SELECT count(*) AS count FROM telegram_message_fragments')).rows[0].count)).toBe(0);
  });

  it('标签移除后正文为空时不发布', async () => {
    expect((await callWebhook(update(5, '  #now  '))).status).toBe(200);
    expect(Number((await client.execute('SELECT count(*) AS count FROM now_entries')).rows[0].count)).toBe(0);
  });

  it('单图只持久化最大尺寸的 file_id，分页只暴露不可猜测图片 ID', async () => {
    expect((await callWebhook(photoUpdate(6, '#now 一张图'))).status).toBe(200);
    const fragment = (await client.execute('SELECT file_id, image_id FROM telegram_message_fragments')).rows[0];
    expect(fragment.file_id).toBe('large-6');
    expect(String(fragment.image_id)).toMatch(/^[0-9a-f-]{36}$/);

    const { GET } = await import('../../../src/pages/api/now.json');
    vi.stubEnv('NOW_CURSOR_SECRET', 'cursor-secret');
    const payload = await (await GET({ request: new Request('http://localhost/api/now.json') } as never)).json();
    expect(payload.messages[0].images).toEqual([{ id: fragment.image_id, width: 1280, height: 720 }]);
    expect(JSON.stringify(payload)).not.toContain('large-6');
  });

  it('乱序相册保持 pending，出现标签后按消息 ID 合并、去重并可撤回', async () => {
    await callWebhook(photoUpdate(12, undefined, { mediaGroupId: 'album-1', date: 1_700_000_012 }));
    let entries = await client.execute('SELECT status FROM now_entries');
    expect(entries.rows[0].status).toBe('pending');

    await callWebhook(photoUpdate(10, '#NOW 相册正文', { mediaGroupId: 'album-1', date: 1_700_000_010 }));
    await callWebhook(photoUpdate(11, undefined, { mediaGroupId: 'album-1', date: 1_700_000_011 }));
    await callWebhook(photoUpdate(11, undefined, { mediaGroupId: 'album-1', date: 1_700_000_011 }));
    const entry = (await client.execute('SELECT * FROM now_entries')).rows[0];
    expect(entry.status).toBe('published');
    expect(entry.display_text).toBe('相册正文');
    expect(entry.telegram_message_id).toBe(10);
    expect(entry.telegram_link).toBe('https://t.me/testchannel/10');
    const fragments = await client.execute('SELECT telegram_message_id FROM telegram_message_fragments ORDER BY telegram_message_id');
    expect(fragments.rows.map((row) => Number(row.telegram_message_id))).toEqual([10, 11, 12]);

    await callWebhook(photoUpdate(11, undefined, { edited: true, mediaGroupId: 'album-1' }));
    expect(Number((await client.execute('SELECT count(*) AS count FROM now_entries')).rows[0].count)).toBe(1);

    await callWebhook(photoUpdate(10, '#now 更新后的正文', { edited: true, mediaGroupId: 'album-1' }));
    expect((await client.execute('SELECT display_text FROM now_entries')).rows[0].display_text).toBe('更新后的正文');

    const { GET } = await import('../../../src/pages/api/now.json');
    vi.stubEnv('NOW_CURSOR_SECRET', 'cursor-secret');
    const payload = await (await GET({ request: new Request('http://localhost/api/now.json') } as never)).json();
    expect(payload.messages[0].images).toHaveLength(3);
    const imageIds = (await client.execute('SELECT image_id FROM telegram_message_fragments ORDER BY telegram_message_id')).rows.map((row) => row.image_id);
    expect(payload.messages[0].images.map((image: { id: string }) => image.id)).toEqual(imageIds);

    await callWebhook(photoUpdate(10, '移除标签', { edited: true, mediaGroupId: 'album-1' }));
    expect(Number((await client.execute('SELECT count(*) AS count FROM now_entries')).rows[0].count)).toBe(0);
  });

  it('相册 caption 中标签无需前置空格，编辑移除后仍会撤回', async () => {
    await callWebhook(photoUpdate(30, '近况#now', { mediaGroupId: 'album-inline' }));
    expect(Number((await client.execute('SELECT count(*) AS count FROM now_entries')).rows[0].count)).toBe(1);
    await callWebhook(photoUpdate(30, '近况', { edited: true, mediaGroupId: 'album-inline' }));
    expect(Number((await client.execute('SELECT count(*) AS count FROM now_entries')).rows[0].count)).toBe(0);
  });

  it('在后续 Webhook 请求中清理超过 24 小时的 pending 相册', async () => {
    await callWebhook(photoUpdate(20, undefined, { mediaGroupId: 'old', date: 1_600_000_000 }));
    await callWebhook(photoUpdate(21, '#now fresh', { date: 1_700_000_000 }));
    expect(Number((await client.execute("SELECT count(*) AS count FROM now_entries WHERE status = 'pending'")).rows[0].count)).toBe(0);
  });
});
