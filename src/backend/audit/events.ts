import { randomUUID } from 'node:crypto';
import { ApiError } from '../api/errors.ts';
import { strictObject, uuid } from '../api/validation.ts';
const actions = ['file.accessed', 'proof.accessed', 'membership.changed', 'pricing.changed', 'support.accessed', 'system.probe'] as const;
export type AuditAction = typeof actions[number];
export type AuditInput = {
  action: AuditAction; actorType: 'user' | 'system'; actorId: string | null; tenantId: string | null;
  resourceId: string; requestId: string; outcome: 'allowed' | 'denied';
};
export type AuditEvent = Readonly<AuditInput & { id: string; occurredAt: string }>;
export type AuditSink = Readonly<{ append: (event: AuditEvent) => Promise<void> }>;
export function createAuditEvent(input: AuditInput): AuditEvent {
  const record = strictObject(input, ['action', 'actorType', 'actorId', 'tenantId', 'resourceId', 'requestId', 'outcome']);
  if (!actions.includes(input.action) || !['user', 'system'].includes(input.actorType) ||
    !['allowed', 'denied'].includes(input.outcome)) throw new ApiError('VALIDATION_FAILED', ['audit']);
  const actorId = input.actorId === null ? null : uuid(record.actorId, 'actorId');
  const tenantId = input.tenantId === null ? null : uuid(record.tenantId, 'tenantId');
  if ((input.actorType === 'user' && actorId === null) ||
    (input.actorType === 'system' && (actorId !== null || input.action !== 'system.probe')) ||
    (input.action !== 'system.probe' && (tenantId === null || input.actorType !== 'user'))) {
    throw new ApiError('VALIDATION_FAILED', ['audit']);
  }
  return Object.freeze({ id: randomUUID(), occurredAt: new Date().toISOString(), action: input.action,
    actorType: input.actorType, actorId, tenantId, resourceId: uuid(record.resourceId, 'resourceId'),
    requestId: uuid(record.requestId, 'requestId'), outcome: input.outcome });
}
export async function recordAudit(input: AuditInput, sink?: AuditSink): Promise<AuditEvent> {
  const event = createAuditEvent(input);
  if (!sink) throw new ApiError('AUDIT_UNAVAILABLE');
  try { await sink.append(event); } catch { throw new ApiError('AUDIT_UNAVAILABLE'); }
  return event;
}
