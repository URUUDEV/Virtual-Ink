import { ApiError } from './errors.ts';
export type Validator<T> = (value: unknown) => T;
const MAX_JSON_BYTES = 16 * 1024;
export async function readJson<T>(request: Request, validate: Validator<T>): Promise<T> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new ApiError('UNSUPPORTED_MEDIA_TYPE');
  }
  const declared = request.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_JSON_BYTES)) {
    throw new ApiError('PAYLOAD_TOO_LARGE');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError('INVALID_JSON');
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_JSON_BYTES) { await reader.cancel(); throw new ApiError('PAYLOAD_TOO_LARGE'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  let value: unknown;
  try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))); }
  catch { throw new ApiError('INVALID_JSON'); }
  return validate(value);
}
export function strictObject(value: unknown, permittedKeys: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype ||
    Object.keys(value).some((key) => !permittedKeys.includes(key))) {
    throw new ApiError('VALIDATION_FAILED', ['body']);
  }
  return value as Record<string, unknown>;
}
export function uuid(value: unknown, field = 'id'): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new ApiError('VALIDATION_FAILED', [field]);
  }
  return value.toLowerCase();
}
export function boundedText(value: unknown, field: string, maxLength = 120): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength || /[\u0000-\u001f]/.test(value)) {
    throw new ApiError('VALIDATION_FAILED', [field]);
  }
  return value.trim();
}
export function parsePagination(query: URLSearchParams) {
  if ([...query.keys()].some((key) => !['limit', 'cursor'].includes(key)) ||
    query.getAll('limit').length > 1 || query.getAll('cursor').length > 1) throw new ApiError('VALIDATION_FAILED', ['query']);
  const limit = query.get('limit') ?? '20';
  if (!/^\d{1,3}$/.test(limit) || Number(limit) < 1 || Number(limit) > 100) throw new ApiError('VALIDATION_FAILED', ['limit']);
  const cursor = query.get('cursor');
  return Object.freeze({ limit: Number(limit), cursor: cursor === null ? null : uuid(cursor, 'cursor') });
}
