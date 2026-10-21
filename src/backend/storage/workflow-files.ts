import { createHash } from 'node:crypto';
import { ApiError } from '../api/errors.ts';
import { uuid } from '../api/validation.ts';
import type { SqlExecutor } from '../database/ports.ts';
import { createFileInspector, MAX_INSPECTION_BYTES, type MalwareScanner } from './file-inspection.ts';
import type { WorkflowCommands } from '../orders/workflow.ts';
import type { SecurityIdentity } from '../identity/security-admin.ts';
export type WorkflowFile = Readonly<{ fileId: string; orderId: string; purpose: 'source' | 'proof' | 'production' | 'evidence' | 'dispute'; mime: string; size: number }>;
export interface PrivateObjectStore {
  put(file: WorkflowFile, bytes: Uint8Array): Promise<string>;
  read(file: WorkflowFile, version: string): Promise<Uint8Array>;
  promote(file: WorkflowFile, version: string, sha256: string): Promise<string>;
}
export function workflowObjectKey(file: Pick<WorkflowFile, 'orderId' | 'fileId' | 'purpose'>): string {
  if (!['source','proof','production','evidence','dispute'].includes(file.purpose)) throw new ApiError('VALIDATION_FAILED');
  return `orders/${uuid(file.orderId)}/${file.purpose}/${uuid(file.fileId)}`;
}
function checkedFile(input: unknown): WorkflowFile {
  if (!input || typeof input !== 'object') throw new ApiError('NOT_FOUND');
  const value = input as WorkflowFile;
  workflowObjectKey(value);
  if (!Number.isInteger(value.size) || value.size < 1 || value.size > MAX_INSPECTION_BYTES || !['application/pdf','image/png','image/jpeg'].includes(value.mime)) throw new ApiError('CONFLICT');
  return Object.freeze({ fileId: uuid(value.fileId), orderId: uuid(value.orderId), purpose: value.purpose, mime: value.mime, size: value.size });
}

/** Private worker only: never pass its DB/storage credentials to web handlers.
 * The source is an authorized queue/loopback test, not an unauthenticated upload.
 * Persist the exact stored-byte verdict before any file can become accessible.
 */
export function createWorkflowFileWorker(database: SqlExecutor, store: PrivateObjectStore, scanner: MalwareScanner) {
  const inspect = createFileInspector(scanner, MAX_INSPECTION_BYTES);
  return Object.freeze({
    async ingest(fileId: string, input: Uint8Array, requestId: string) {
      uuid(fileId); uuid(requestId);
      const pending = await database.query('SELECT virtual_ink_workflow.pending_file($1) AS file', [fileId]);
      if (pending.rows.length !== 1) throw new ApiError('NOT_FOUND');
      const file = checkedFile(pending.rows[0].file);
      if (file.fileId !== fileId || !(input instanceof Uint8Array) || input.buffer instanceof SharedArrayBuffer || input.byteLength !== file.size) throw new ApiError('CONFLICT');
      const bytes = Buffer.from(input), hash = createHash('sha256').update(bytes).digest('hex');
      let version: string | null = null;
      let status: string;
      try {
        version = await store.put(file, bytes);
        if (typeof version !== 'string' || version.length < 1 || version.length > 256) { version = null; throw new Error(); }
        const stored = await store.read(file, version);
        if (!(stored instanceof Uint8Array) || stored.byteLength !== file.size || createHash('sha256').update(stored).digest('hex') !== hash) throw new Error();
        status = (await inspect(stored, file.mime)).status;
        if (status === 'SAFE') {
          version = await store.promote(file, version, hash);
          const promoted = await store.read(file, version);
          if (promoted.byteLength !== file.size || createHash('sha256').update(promoted).digest('hex') !== hash) throw new Error();
        }
      } catch { status = 'REVIEW_REQUIRED'; /* Unknown provider outcome stays inaccessible; no blind retry. */ }
      try {
        const saved = await database.query('SELECT virtual_ink_workflow.record_scan($1,$2,$3,$4,$5,$6,$7) AS result', [fileId, version, hash, status, file.size, file.mime, requestId]);
        const result = saved.rows[0]?.result as { fileId?: unknown; status?: unknown } | undefined;
        if (saved.rows.length !== 1 || result?.fileId !== fileId || typeof result.status !== 'string' || !['SAFE','REJECTED','REVIEW_REQUIRED'].includes(result.status)) throw new Error();
        status = result.status;
      } catch { throw new ApiError('AUDIT_UNAVAILABLE'); }
      return Object.freeze({ fileId, status });
    },
  });
}

export async function copyApprovedProductionFile(database: SqlExecutor, store: PrivateObjectStore,
  scanner: MalwareScanner, orderId: string, requestId: string) {
  uuid(orderId); uuid(requestId);
  const prepared = await database.query('SELECT virtual_ink_workflow.prepare_production_copy($1,$2) AS copy', [orderId, requestId]);
  const copy = prepared.rows[0]?.copy as Record<string, unknown> | undefined;
  if (prepared.rows.length !== 1 || !copy) throw new ApiError('CONFLICT');
  const target = checkedFile(copy.file), source = checkedFile(copy.source);
  if (target.orderId !== orderId || source.orderId !== orderId || target.purpose !== 'production' || source.purpose !== 'proof' ||
    typeof copy.sourceVersion !== 'string' || typeof copy.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(copy.sha256)) throw new ApiError('CONFLICT');
  if (copy.status === 'SAFE') return Object.freeze({ fileId: target.fileId, status: 'SAFE' });
  if (copy.status !== 'QUARANTINED') throw new ApiError('CONFLICT');
  const bytes = await store.read(source, copy.sourceVersion);
  if (hashBytes(bytes) !== copy.sha256) throw new ApiError('CONFLICT');
  return createWorkflowFileWorker(database, store, scanner).ingest(target.fileId, bytes, requestId);
}
const hashBytes = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

/** Read authorization/audit commits before provider access; bytes are verified
 * against the immutable scanned hash. No direct provider URL or credential leaves
 * the backend. This avoids relying on unsupported native S3 bucket versioning.
 */
export async function downloadWorkflowFile(commands: WorkflowCommands, store: PrivateObjectStore,
  identity: SecurityIdentity, input: Readonly<{ orderId: string; fileId: string; operationId: string }>, requestId: string) {
  const result = await commands.run('file.access', input, identity, requestId) as Record<string, unknown>;
  const file = checkedFile({ fileId: result.fileId, orderId: result.orderId, purpose: result.purpose, mime: result.mime, size: result.size });
  if (file.fileId !== input.fileId || file.orderId !== input.orderId || typeof result.objectVersion !== 'string' ||
    typeof result.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(result.sha256)) throw new ApiError('NOT_FOUND');
  let bytes: Uint8Array;
  try { bytes = await store.read(file, result.objectVersion); }
  catch { throw new ApiError('SERVICE_BUSY'); }
  if (!(bytes instanceof Uint8Array) || bytes.byteLength !== file.size || createHash('sha256').update(bytes).digest('hex') !== result.sha256) throw new ApiError('CONFLICT');
  // Provider I/O may overlap role revocation or proof supersession. Recheck the
  // live authority after reading and before releasing any bytes to the caller.
  const current = await commands.run('file.access', input, identity, requestId) as Record<string, unknown>;
  if (current.sha256 !== result.sha256 || current.objectVersion !== result.objectVersion) throw new ApiError('CONFLICT');
  const extension = file.mime === 'application/pdf' ? 'pdf' : file.mime === 'image/png' ? 'png' : 'jpg';
  return new Response(Buffer.from(bytes), { headers: { 'content-type': file.mime, 'content-length': String(file.size),
    'content-disposition': `attachment; filename="virtual-ink-file.${extension}"`, 'cache-control': 'no-store',
    'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox", 'referrer-policy': 'no-referrer' } });
}
