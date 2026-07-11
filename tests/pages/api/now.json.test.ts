import type { Client } from '@libsql/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNowTestDatabase } from '../../helpers/now-database';

let client: Client;
let cleanup: () => Promise<void>;

async function publish(messageId: number, publishedAt: number, text = `#now message ${messageId}`) {
  const { publishTextEntry } = await import('../../../src/utils/now/database');
  await publishTextEntry({
    channelId: '-100123',
    messageId,
    rawText: text,
    displayText: text.replace(/#now\s*/i, ''),
    entities: [],
    publishedAt,
    updatedAt: publishedAt,
    telegramLink: `https://t.me/test/${messageId}`,
  });
}

async function get(query = '') {
  const { GET } = await import('../../../src/pages/api/now.json');
  return GET({ request: new Request(`http://localhost/api/now.json${query}`) } as never);
}

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv('NOW_CURSOR_SECRET', 'cursor-secret');
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

describe('GET /api/now.json', () => {
  it('默认返回 20 条，最大 50 条，并按发布时间与稳定 ID 倒序', async () => {
    await Promise.all(Array.from({ length: 55 }, (_, index) => publish(index + 1, 1_700_000_000)));

    const defaultPage = await (await get()).json();
    const maxPage = await (await get('?limit=100')).json();
    expect(defaultPage.messages).toHaveLength(20);
    expect(defaultPage.messages.slice(0, 3).map((message: { id: string }) => message.id)).toEqual(['55', '54', '53']);
    expect(maxPage.messages).toHaveLength(50);
  });

  it('使用不透明游标稳定翻页，末页明确没有下一页', async () => {
    for (let index = 1; index <= 5; index += 1) await publish(index, 1_700_000_000 - index);
    const first = await (await get('?limit=2')).json();
    expect(first.nextCursor).toEqual(expect.any(String));

    await publish(99, 1_800_000_000);
    const second = await (await get(`?limit=2&cursor=${encodeURIComponent(first.nextCursor)}`)).json();
    const third = await (await get(`?limit=2&cursor=${encodeURIComponent(second.nextCursor)}`)).json();
    expect([...first.messages, ...second.messages, ...third.messages].map((message) => message.id)).toEqual(['1', '2', '3', '4', '5']);
    expect(third.nextCursor).toBeNull();
  });

  it('拒绝无效或被篡改的游标', async () => {
    await publish(1, 1_700_000_000);
    const first = await (await get('?limit=1')).json();
    expect((await get('?cursor=garbage')).status).toBe(400);
    expect((await get(`?cursor=${encodeURIComponent(`${first.nextCursor}x`)}`)).status).toBe(400);
  });

  it('根据最新持久记录判断 48 小时更新', async () => {
    const now = Math.floor(Date.now() / 1000);
    await publish(1, now - 49 * 60 * 60);
    expect((await (await get('?limit=1')).json()).hasRecentUpdate).toBe(false);
    await publish(2, now - 60 * 60);
    expect((await (await get('?limit=1')).json()).hasRecentUpdate).toBe(true);
  });

  it('数据库不可用时返回 503', async () => {
    client.close();
    expect((await get()).status).toBe(503);
  });
});
