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
});
