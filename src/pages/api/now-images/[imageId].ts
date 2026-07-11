import type { APIRoute } from 'astro';
import { findPublishedImage } from '@/utils/now/database';
import { serverEnv } from '@/utils/server-env';

export const prerender = false;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 8_000;
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400';
const SAFE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

async function upstream(url: string): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS), redirect: 'error' });
}

async function readLimitedBody(response: Response): Promise<Uint8Array<ArrayBuffer> | undefined> {
  if (!response.body) return new Uint8Array(new ArrayBuffer(0));
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_IMAGE_BYTES) {
        await reader.cancel();
        return undefined;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(new ArrayBuffer(size));
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export const GET: APIRoute = async ({ params }) => {
  try {
    const image = params.imageId ? await findPublishedImage(params.imageId) : undefined;
    if (!image) return new Response('Not found', { status: 404 });
    const token = serverEnv('TELEGRAM_BOT_TOKEN');
    if (!token) return new Response('Unavailable', { status: 503 });

    const metadata = await upstream(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(image.fileId)}`);
    if (!metadata.ok) return new Response('Upstream error', { status: 502 });
    const payload = await metadata.json() as { ok?: boolean; result?: { file_path?: string } };
    const path = payload.ok && payload.result?.file_path;
    if (!path || path.includes('..')) return new Response('Upstream error', { status: 502 });

    const file = await upstream(`https://api.telegram.org/file/bot${token}/${path}`);
    const type = file.headers.get('content-type')?.split(';')[0].toLowerCase();
    const declaredSize = Number(file.headers.get('content-length') ?? 0);
    if (!file.ok || !type || !SAFE_TYPES.has(type) || declaredSize > MAX_IMAGE_BYTES) {
      await file.body?.cancel();
      return new Response('Upstream error', { status: 502 });
    }
    const bytes = await readLimitedBody(file);
    if (!bytes) return new Response('Upstream error', { status: 502 });
    return new Response(bytes, { headers: { 'content-type': type, 'cache-control': CACHE_CONTROL } });
  } catch {
    return new Response('Upstream error', { status: 502 });
  }
};
