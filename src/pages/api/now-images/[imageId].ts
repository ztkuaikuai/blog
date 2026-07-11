import type { APIRoute } from 'astro';
import { findPublishedImage } from '@/utils/now/database';
import { serverEnv } from '@/utils/server-env';

export const prerender = false;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 8_000;
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400';

function detectImageType(bytes: Uint8Array): string | undefined {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'image/png';
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.subarray(0, 4)) === 'RIFF'
    && new TextDecoder().decode(bytes.subarray(8, 12)) === 'WEBP') return 'image/webp';
  if (bytes.length >= 6) {
    const signature = new TextDecoder().decode(bytes.subarray(0, 6));
    if (signature === 'GIF87a' || signature === 'GIF89a') return 'image/gif';
  }
  return undefined;
}

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
    const declaredSize = Number(file.headers.get('content-length') ?? 0);
    if (!file.ok || declaredSize > MAX_IMAGE_BYTES) {
      await file.body?.cancel();
      return new Response('Upstream error', { status: 502 });
    }
    const bytes = await readLimitedBody(file);
    if (!bytes) return new Response('Upstream error', { status: 502 });
    const type = detectImageType(bytes);
    if (!type) return new Response('Upstream error', { status: 502 });
    return new Response(bytes, { headers: { 'content-type': type, 'cache-control': CACHE_CONTROL } });
  } catch {
    return new Response('Upstream error', { status: 502 });
  }
};
