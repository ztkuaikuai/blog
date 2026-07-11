import { createClient } from '@libsql/client';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { applyMigrations } from '../../scripts/now/migrate.mjs';

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe('now migration CLI', () => {
  it('从空数据库按版本执行 migration，重复执行不会重复应用', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'kkblog-migrate-'));
    const client = createClient({ url: `file:${join(directory, 'now.db')}` });
    cleanups.push(async () => {
      client.close();
      await rm(directory, { recursive: true, force: true });
    });

    expect(await applyMigrations(client)).toEqual(['0001_now.sql', '0002_now_photos.sql']);
    expect(await applyMigrations(client)).toEqual([]);

    const versions = await client.execute('SELECT version FROM schema_migrations ORDER BY version');
    expect(versions.rows.map((row) => row.version)).toEqual(['0001_now.sql', '0002_now_photos.sql']);
    const tables = await client.execute("SELECT name FROM sqlite_schema WHERE type = 'table'");
    expect(tables.rows.map((row) => row.name)).toContain('now_entries');
  });
});
