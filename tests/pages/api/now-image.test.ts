import type { Client } from '@libsql/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNowTestDatabase } from '../../helpers/now-database';

let client: Client;
let cleanup: () => Promise<void>;

async function getImage(id: string) {
  const { GET } = await import('../../../src/pages/api/now-images/[imageId]');
  return GET({ params: { imageId: id }, request: new Request(`http://localhost/api/now-images/${id}`) } as never);
}

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv('TELEGRAM_BOT_TOKEN', 'super-secret-token');
  ({ client, cleanup } = await createNowTestDatabase());
  const database = await import('../../../src/utils/now/database');
  database.setNowDatabaseForTests(client);
});

afterEach(async () => {
  const database = await import('../../../src/utils/now/database');
  database.setNowDatabaseForTests(undefined);
  await cleanup();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('GET /api/now-images/:imageId', () => {
  it('拒绝未知图片记录', async () => {
    expect((await getImage('unknown')).status).toBe(404);
  });

  it('只代理已发布图片并设置缓存头，响应不泄露 Bot Token', async () => {
    await client.execute(`INSERT INTO now_entries
      (telegram_channel_id, telegram_message_id, group_key, raw_text, display_text, entities_json, published_at, updated_at, status, telegram_link)
      VALUES ('-1001', 1, 'message:1', '#now pic', 'pic', '[]', 1, 1, 'published', 'https://t.me/test/1')`);
    await client.execute(`INSERT INTO telegram_message_fragments
      (entry_id, telegram_channel_id, telegram_message_id, raw_text, entities_json, file_id, image_id, width, height)
      VALUES (1, '-1001', 1, '#now pic', '[]', 'telegram-file-id', 'public-image-id', 100, 80)`);
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json({ ok: true, result: { file_path: 'photos/file.jpg' } }))
      .mockResolvedValueOnce(new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), {
        headers: { 'content-type': 'application/octet-stream', 'content-length': '4' },
      }));

    const response = await getImage('public-image-id');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    expect(response.headers.get('location') ?? '').not.toContain('super-secret-token');
    expect((await response.arrayBuffer()).byteLength).toBe(4);
  });

  it('将 Telegram 失败、不安全类型和超大响应安全地拒绝', async () => {
    await client.execute(`INSERT INTO now_entries
      (telegram_channel_id, telegram_message_id, group_key, raw_text, display_text, entities_json, published_at, updated_at, status, telegram_link)
      VALUES ('-1001', 1, 'message:1', '#now pic', 'pic', '[]', 1, 1, 'published', 'https://t.me/test/1')`);
    await client.execute(`INSERT INTO telegram_message_fragments
      (entry_id, telegram_channel_id, telegram_message_id, raw_text, entities_json, file_id, image_id, width, height)
      VALUES (1, '-1001', 1, '#now pic', '[]', 'telegram-file-id', 'public-image-id', 100, 80)`);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('bad gateway', { status: 502 }));
    expect((await getImage('public-image-id')).status).toBe(502);

    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ ok: true, result: { file_path: 'file.bin' } }))
      .mockResolvedValueOnce(new Response('script', { headers: { 'content-type': 'text/html' } }));
    expect((await getImage('public-image-id')).status).toBe(502);

    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ ok: true, result: { file_path: 'large.jpg' } }))
      .mockResolvedValueOnce(new Response(null, { headers: { 'content-length': String(10 * 1024 * 1024 + 1) } }));
    expect((await getImage('public-image-id')).status).toBe(502);

    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ ok: true, result: { file_path: 'missing.jpg' } }))
      .mockResolvedValueOnce(new Response('missing', { status: 404 }));
    expect((await getImage('public-image-id')).status).toBe(502);

    vi.mocked(fetch).mockRejectedValueOnce(new DOMException('timed out', 'TimeoutError'));
    expect((await getImage('public-image-id')).status).toBe(502);

    const oversizedStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(6 * 1024 * 1024));
        controller.enqueue(new Uint8Array(6 * 1024 * 1024));
        controller.close();
      },
    });
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ ok: true, result: { file_path: 'chunked.jpg' } }))
      .mockResolvedValueOnce(new Response(oversizedStream, { headers: { 'content-type': 'image/jpeg' } }));
    expect((await getImage('public-image-id')).status).toBe(502);
  });
});
