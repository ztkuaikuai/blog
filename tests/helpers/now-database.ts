import { createClient, type Client } from '@libsql/client';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function createNowTestDatabase(): Promise<{ client: Client; cleanup: () => Promise<void> }> {
  const directory = await mkdtemp(join(tmpdir(), 'kkblog-now-'));
  const client = createClient({ url: `file:${join(directory, 'now.db')}` });
  const migrationsUrl = new URL('../../migrations/', import.meta.url);
  const migrations = (await readdir(migrationsUrl)).filter((file) => file.endsWith('.sql')).sort();
  for (const file of migrations) {
    const migration = await readFile(new URL(file, migrationsUrl), 'utf8');
    for (const statement of migration.split(';').map((sql) => sql.trim()).filter(Boolean)) {
      await client.execute(statement);
    }
  }

  return {
    client,
    cleanup: async () => {
      client.close();
      await rm(directory, { recursive: true, force: true });
    },
  };
}
