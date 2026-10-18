import { ApiError } from '../api/errors.ts';
import { uuid } from '../api/validation.ts';
export type PrivateFileRef = Readonly<{ tenantId: string; fileId: string }>;
// Location only, never an authorization grant.
export function privateObjectKey(file: PrivateFileRef): string {
  return `tenants/${uuid(file.tenantId, 'tenantId')}/files/${uuid(file.fileId, 'fileId')}`;
}
// No file routes or signed URLs until verified identity and membership exist.
export function requireFileAccessFoundation(): never { throw new ApiError('FORBIDDEN'); }
