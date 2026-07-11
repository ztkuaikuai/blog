import { createClient } from '@libsql/client';
import { readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { loadLocalEnv, requireEnv } from './env.mjs';

const migrationsUrl = new URL('../../migrations/', import.meta.url);

export async function applyMigrations(client) {
  await client.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const applied = new Set((await client.execute('SELECT version FROM schema_migrations')).rows.map((row) => String(row.version)));
  const files = (await readdir(migrationsUrl)).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
  const newlyApplied = [];

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(new URL(file, migrationsUrl), 'utf8');
    const version = file.replaceAll("'", "''");
    await client.executeMultiple(`${sql}\nINSERT INTO schema_migrations (version) VALUES ('${version}');`);
    newlyApplied.push(file);
  }
  return newlyApplied;
}

async function main() {
  const envFile = process.argv[2] ?? '.env.production.local';
  const values = await loadLocalEnv(envFile);
  const env = requireEnv(values, ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN']);
  const client = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });
  try {
    const applied = await applyMigrations(client);
    console.log(applied.length ? `已应用 migration：${applied.join(', ')}` : '数据库已是最新版本');
  } finally {
    client.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'migration 执行失败');
    process.exitCode = 1;
  });
}
