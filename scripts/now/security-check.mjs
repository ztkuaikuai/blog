import { readdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { loadLocalEnv } from './env.mjs';

const secretNames = ['TURSO_AUTH_TOKEN', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET', 'NOW_CURSOR_SECRET'];

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? filesBelow(path) : [path];
  }))).flat();
}

export async function findLeakedSecrets(directory, values) {
  const secrets = secretNames
    .map((name) => values[name])
    .filter((value) => typeof value === 'string' && value.length >= 8)
    .flatMap((value) => [value, encodeURIComponent(value)]);
  const leaks = [];
  for (const file of await filesBelow(directory)) {
    const content = await readFile(file);
    if (secrets.some((secret) => content.includes(Buffer.from(secret)))) leaks.push(file);
  }
  return leaks;
}

async function main() {
  const envFile = process.argv[2] ?? '.env.production.local';
  const directory = process.argv[3] ?? 'dist';
  const leaks = await findLeakedSecrets(directory, await loadLocalEnv(envFile));
  if (leaks.length) throw new Error(`构建产物包含秘密：${leaks.join(', ')}`);
  console.log(`安全检查通过：${directory} 未包含已配置的秘密值`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : '安全检查失败');
    process.exitCode = 1;
  });
}
