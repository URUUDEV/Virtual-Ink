import { createHash, createHmac } from 'node:crypto';
import { ApiError } from '../api/errors.ts';
import { MAX_INSPECTION_BYTES } from './file-inspection.ts';
import { workflowObjectKey, type PrivateObjectStore, type WorkflowFile } from './workflow-files.ts';

export type PrivateS3Config = Readonly<{
  environment: 'local' | 'staging'; endpoint: string; region: string; accessKeyId: string; secretAccessKey: string;
  buckets: Readonly<Record<WorkflowFile['purpose'] | 'quarantine', string>>;
}>;
const digest = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
const hmac = (key: Uint8Array | string, value: string) => createHmac('sha256', key).update(value).digest();

/** Private queue worker only. This config must never enter Next/Vercel web envs.
 * S3 versioning is not assumed: immutable UUID keys, write-if-absent, conditional
 * reads and full-byte SHA-256 verification bind each scanned/published object.
 * Downloads are verified proxies, not bearer URLs to mutable object locations.
 */
export function createPrivateS3Store(config: PrivateS3Config, fetcher: typeof fetch = fetch,
  clock: () => Date = () => new Date()): PrivateObjectStore {
  let endpoint: URL;
  try {
    endpoint = new URL(config.endpoint);
    const local = ['127.0.0.1','[::1]','localhost'].includes(endpoint.hostname);
    if (!['local','staging'].includes(config.environment) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash ||
      !['/', '/storage/v1/s3', '/storage/v1/s3/'].includes(endpoint.pathname) ||
      !(endpoint.protocol === 'https:' || config.environment === 'local' && local && endpoint.protocol === 'http:') ||
      !/^[a-z0-9-]{1,40}$/.test(config.region) || !/^[A-Za-z0-9_-]{3,128}$/.test(config.accessKeyId) ||
      typeof config.secretAccessKey !== 'string' || config.secretAccessKey.length < 16 || config.secretAccessKey.length > 256) throw new Error();
  } catch { throw new ApiError('VALIDATION_FAILED', ['storage']); }
  const purposes = ['quarantine','source','proof','production','evidence','dispute'] as const;
  const buckets = Object.fromEntries(purposes.map(purpose => [purpose, config.buckets?.[purpose]])) as PrivateS3Config['buckets'];
  if (purposes.some(purpose => !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(buckets[purpose] ?? '')) || new Set(Object.values(buckets)).size !== 6) {
    throw new ApiError('VALIDATION_FAILED', ['buckets']);
  }
  // Capture scalar configuration; later caller mutations cannot redirect secrets.
  const { region, accessKeyId, secretAccessKey } = config;
  const endpointText = endpoint.toString();
  async function send(file: WorkflowFile, bucket: string, method: 'PUT' | 'GET', bytes?: Uint8Array, etag?: string) {
    const key = workflowObjectKey(file);
    if (!Number.isInteger(file.size) || file.size < 1 || file.size > MAX_INSPECTION_BYTES || !['application/pdf','image/png','image/jpeg'].includes(file.mime)) throw new ApiError('VALIDATION_FAILED');
    const url = new URL(endpointText);
    url.pathname = `${url.pathname.replace(/\/$/, '')}/${bucket}/${key}`;
    const date = clock().toISOString().replace(/[:-]|\.\d{3}/g, ''), day = date.slice(0, 8);
    const scope = `${day}/${region}/s3/aws4_request`, hash = digest(bytes ?? '');
    const headers: Record<string,string> = { host: url.host, 'x-amz-date': date, 'x-amz-content-sha256': hash };
    if (method === 'PUT') Object.assign(headers, { 'content-type': file.mime, 'if-none-match': '*', 'x-amz-meta-sha256': hash });
    else { headers['if-match'] = etag!; headers['accept-encoding'] = 'identity'; }
    const names = Object.keys(headers).sort(), signed = names.join(';');
    const canonical = [method, url.pathname, '', names.map(name => `${name}:${headers[name].trim()}\n`).join(''), signed, hash].join('\n');
    const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, day), region), 's3'), 'aws4_request');
    headers.authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signed}, Signature=${hmac(signingKey, `AWS4-HMAC-SHA256\n${date}\n${scope}\n${digest(canonical)}`).toString('hex')}`;
    let response: Response;
    try { response = await fetcher(url, { method, headers, ...(bytes ? { body: Buffer.from(bytes) } : {}), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10_000) }); }
    catch { throw new ApiError('SERVICE_BUSY'); }
    if (!response.ok) { void response.body?.cancel().catch(() => {}); throw new ApiError(response.status === 412 ? 'CONFLICT' : 'SERVICE_BUSY'); }
    return response;
  }
  async function put(file: WorkflowFile, bytes: Uint8Array, published: boolean) {
    if (!(bytes instanceof Uint8Array) || bytes.buffer instanceof SharedArrayBuffer || !Number.isInteger(file.size) || file.size < 1 || file.size > MAX_INSPECTION_BYTES || bytes.byteLength !== file.size) throw new ApiError('VALIDATION_FAILED');
    const owned = Buffer.from(bytes);
    const response = await send(file, published ? buckets[file.purpose] : buckets.quarantine, 'PUT', owned);
    void response.body?.cancel().catch(() => {});
    const etag = response.headers.get('etag');
    if (!etag || !/^"[A-Za-z0-9._=-]{1,120}"$/.test(etag)) throw new ApiError('SERVICE_BUSY');
    return `${published ? 'approved' : 'quarantine'}:${etag}`;
  }
  async function read(file: WorkflowFile, version: string) {
    const match = typeof version === 'string' && /^(quarantine|approved):("[A-Za-z0-9._=-]{1,120}")$/.exec(version);
    if (!match) throw new ApiError('VALIDATION_FAILED');
    const response = await send(file, match[1] === 'quarantine' ? buckets.quarantine : buckets[file.purpose], 'GET', undefined, match[2]);
    const declared = response.headers.get('content-length');
    if (response.headers.get('etag') !== match[2] || response.headers.get('content-type')?.split(';')[0] !== file.mime ||
      declared === null || !/^\d+$/.test(declared) || Number(declared) !== file.size || !response.body) {
      void response.body?.cancel().catch(() => {}); throw new ApiError('CONFLICT');
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      while (true) {
        const next = await reader.read(); if (next.done) break;
        size += next.value.byteLength;
        if (size > file.size) { await reader.cancel(); throw new ApiError('CONFLICT'); }
        chunks.push(next.value);
      }
    } catch { throw new ApiError('SERVICE_BUSY'); }
    finally { reader.releaseLock(); }
    const bytes = Buffer.concat(chunks);
    if (bytes.length !== file.size || response.headers.get('x-amz-meta-sha256') !== digest(bytes)) throw new ApiError('CONFLICT');
    return bytes;
  }
  return Object.freeze({ put: (file: WorkflowFile, bytes: Uint8Array) => put(file, bytes, false), read,
    async promote(file: WorkflowFile, version: string, hash: string) {
      if (!version.startsWith('quarantine:') || !/^[a-f0-9]{64}$/.test(hash)) throw new ApiError('CONFLICT');
      const bytes = await read(file, version);
      if (digest(bytes) !== hash) throw new ApiError('CONFLICT');
      return put(file, bytes, true);
    },
  });
}
