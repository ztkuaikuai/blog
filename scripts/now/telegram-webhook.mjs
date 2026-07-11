import { pathToFileURL } from 'node:url';

import { loadLocalEnv, redact, requireEnv } from './env.mjs';

const endpoints = { set: 'setWebhook', info: 'getWebhookInfo', delete: 'deleteWebhook' };
const webhookUrl = 'https://blog.kuaikuaitz.top/api/telegram/webhook';

export async function runWebhookCommand(command, options = {}) {
  if (!(command in endpoints)) throw new Error('命令必须是 set、info 或 delete');
  const envFile = options.envFile ?? '.env.production.local';
  const values = await loadLocalEnv(envFile);
  const env = requireEnv(values, command === 'set'
    ? ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET']
    : ['TELEGRAM_BOT_TOKEN']);
  const rawSecrets = [values.TELEGRAM_BOT_TOKEN, values.TELEGRAM_WEBHOOK_SECRET, values.TURSO_AUTH_TOKEN];
  const secrets = rawSecrets.flatMap((value) => value ? [value, encodeURIComponent(value)] : []);
  const fetchFn = options.fetch ?? fetch;
  const log = options.log ?? console.log;
  const body = command === 'set' ? {
    url: webhookUrl,
    secret_token: env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ['channel_post', 'edited_channel_post'],
  } : command === 'delete' ? { drop_pending_updates: false } : undefined;

  try {
    const response = await fetchFn(`https://api.telegram.org/bot${encodeURIComponent(env.TELEGRAM_BOT_TOKEN)}/${endpoints[command]}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.description || `Telegram API 返回 ${response.status}`);
    if (command === 'info') {
      const result = payload.result || {};
      log(redact(JSON.stringify({
        url: result.url || '',
        pending_update_count: result.pending_update_count || 0,
        last_error_date: result.last_error_date || null,
        last_error_message: result.last_error_message || null,
        allowed_updates: result.allowed_updates || [],
      }, null, 2), secrets));
    } else {
      log(command === 'set' ? 'Webhook 已注册' : 'Webhook 已删除（未丢弃 pending updates）');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(redact(message, secrets));
  }
}

async function main() {
  await runWebhookCommand(process.argv[2], { envFile: process.argv[3] });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Webhook 命令执行失败');
    process.exitCode = 1;
  });
}
