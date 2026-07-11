import { readFile } from 'node:fs/promises';

function unquote(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export async function loadLocalEnv(path) {
  const source = await readFile(path, 'utf8');
  const values = {};
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || line.trimStart().startsWith('#')) continue;
    values[match[1]] = unquote(match[2]);
  }
  return values;
}

export function requireEnv(values, names) {
  return Object.fromEntries(names.map((name) => {
    const value = values[name];
    if (!value) throw new Error(`本地环境文件缺少 ${name}`);
    return [name, value];
  }));
}

export function redact(text, secrets) {
  return secrets.filter(Boolean).reduce((value, secret) => value.replaceAll(secret, '[REDACTED]'), String(text));
}
