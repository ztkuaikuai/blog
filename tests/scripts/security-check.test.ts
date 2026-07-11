import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { findLeakedSecrets } from '../../scripts/now/security-check.mjs';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('production secret scan', () => {
  it('识别构建产物中的原始与 URL 编码秘密', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'kkblog-security-'));
    directories.push(directory);
    await writeFile(join(directory, 'raw.js'), 'token=123:secret-value');
    await writeFile(join(directory, 'encoded.js'), 'token=123%3Asecret-value');

    expect(await findLeakedSecrets(directory, { TELEGRAM_BOT_TOKEN: '123:secret-value' })).toEqual([
      `${directory}/encoded.js`,
      `${directory}/raw.js`,
    ]);
  });
});
