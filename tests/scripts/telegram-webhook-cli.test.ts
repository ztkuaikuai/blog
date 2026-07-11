import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runWebhookCommand } from '../../scripts/now/telegram-webhook.mjs';

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

async function localEnv() {
  const directory = await mkdtemp(join(tmpdir(), 'kkblog-webhook-'));
  const path = join(directory, '.env.production.local');
  await writeFile(path, [
    'TELEGRAM_BOT_TOKEN=123:super-secret-token',
    'TELEGRAM_WEBHOOK_SECRET=webhook-secret',
    'NOW_WEBHOOK_URL=https://blog.example/api/telegram/webhook',
  ].join('\n'));
  cleanups.push(() => rm(directory, { recursive: true, force: true }));
  return path;
}

describe('Telegram webhook CLI', () => {
  it('set 只注册频道发布与编辑更新，输出不包含秘密', async () => {
    const envFile = await localEnv();
    const fetch = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify({ ok: true, result: true }), { status: 200 }));
    const output: string[] = [];

    await runWebhookCommand('set', { envFile, fetch, log: (line: string) => output.push(line) });

    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe('https://api.telegram.org/bot123%3Asuper-secret-token/setWebhook');
    expect(JSON.parse(String(request?.body))).toEqual({
      url: 'https://blog.example/api/telegram/webhook',
      secret_token: 'webhook-secret',
      allowed_updates: ['channel_post', 'edited_channel_post'],
    });
    expect(output.join('\n')).not.toContain('super-secret-token');
    expect(output.join('\n')).not.toContain('webhook-secret');
  });

  it.each(['info', 'delete'] as const)('%s 调用对应 Telegram API 且失败信息会脱敏', async (command) => {
    const envFile = await localEnv();
    const fetch = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify({ ok: false, description: 'bad 123:super-secret-token webhook-secret' }), { status: 400 }));

    await expect(runWebhookCommand(command, { envFile, fetch, log: () => undefined })).rejects.not.toThrow(/super-secret-token|webhook-secret/);
    expect(String(fetch.mock.calls[0][0])).toContain(command === 'info' ? '/getWebhookInfo' : '/deleteWebhook');
  });

  it('info 会脱敏 Telegram 返回的状态文本和 URL 编码 Token', async () => {
    const envFile = await localEnv();
    const fetch = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify({
      ok: true,
      result: { last_error_message: 'bad webhook-secret 123%3Asuper-secret-token' },
    }), { status: 200 }));
    const output: string[] = [];

    await runWebhookCommand('info', { envFile, fetch, log: (line: string) => output.push(line) });

    expect(output.join('\n')).not.toMatch(/webhook-secret|super-secret-token/);
  });
});
