import { ApiError, type ErrorCode } from '../api/errors.ts';
import { handleApi } from '../api/responses.ts';
import { readJson, strictObject, uuid } from '../api/validation.ts';
import { createAdmission } from '../api/admission.ts';
import type { SqlExecutor } from '../database/ports.ts';
import type { SecurityIdentity } from '../identity/security-admin.ts';
import { validateOrderSpecification } from './specification.ts';

export const workflowFields = {
  'order.create': ['spec'], 'order.read': [], 'order.timeline': ['limit','cursor'], 'order.submit': [], 'order.assign': ['vendorId'],
  'quote.propose': ['amountMinor', 'currency', 'validUntil'], 'quote.review': [], 'quote.accept': [], 'quote.reject': [],
  'payment.confirm': ['evidenceReference', 'recipientId', 'receiptReference', 'amountMinor', 'currency', 'receiptChecked'], 'job.accept': [], 'job.decline': ['reasonCode'], 'proof.request': [], 'proof.upload': ['fileId'],
  'proof.respond': ['proofId', 'approve', 'reasonCode'], 'production.queue': [], 'production.start': [],
  'production.evidence': ['fileId', 'stage'], 'production.finish': [], 'qc.record': ['passed', 'checks', 'reasonCode'],
  'production.correct': [], 'order.ready': ['handoff'], 'delivery.assign': ['deliveryUserId'], 'order.complete': [],
  'order.cancel': [], 'order.dispute': ['reasonCode'], 'file.reserve': ['fileId', 'purpose', 'mime', 'size'],
  'file.access': ['fileId'],
} as const;
export type WorkflowAction = keyof typeof workflowFields;
export type WorkflowContext = SecurityIdentity & Readonly<{ environment: 'local' | 'preview' }>;
export const workflowStatement = 'SELECT virtual_ink_workflow.command($1,$2::jsonb,$3::jsonb) AS result';
const admission = createAdmission(8);

export function validateWorkflowInput(action: WorkflowAction, value: unknown): Record<string, unknown> {
  if (!Object.hasOwn(workflowFields, action)) throw new ApiError('NOT_FOUND');
  const input = strictObject(value, ['orderId', 'operationId', 'expectedVersion', ...workflowFields[action]]);
  const result: Record<string, unknown> = { ...input, orderId: uuid(input.orderId, 'orderId'), operationId: uuid(input.operationId, 'operationId') };
  if (action === 'order.create') result.spec = validateOrderSpecification(input.spec);
  if (action === 'payment.confirm') {
    result.evidenceReference = uuid(input.evidenceReference, 'evidenceReference');
    result.recipientId = uuid(input.recipientId, 'recipientId');
    if (typeof input.receiptReference !== 'string' || input.receiptReference.length < 8 || input.receiptReference.length > 128 ||
      !/^[A-Za-z0-9 -]+$/.test(input.receiptReference) || input.receiptReference.replaceAll(/[ -]/g, '').length < 8 ||
      input.receiptReference.replaceAll(/[ -]/g, '').length > 100 ||
      !Number.isSafeInteger(input.amountMinor) || Number(input.amountMinor) < 1 || Number(input.amountMinor) > 1000000000 ||
      input.currency !== 'ZMW' || input.receiptChecked !== true) throw new ApiError('VALIDATION_FAILED');
  }
  if (!['order.read', 'order.timeline', 'file.access'].includes(action) &&
    (!Number.isInteger(input.expectedVersion) || (input.expectedVersion as number) < 0 || (input.expectedVersion as number) > 1000000)) {
    throw new ApiError('VALIDATION_FAILED', ['expectedVersion']);
  }
  // State, amounts, proof hashes, role and scan state remain DB-owned. The SQL
  // command repeats validation and current authority checks under one transaction.
  return result;
}

export function createWorkflowCommands(database: SqlExecutor, environment: 'local' | 'preview') {
  return Object.freeze({
    async run(action: WorkflowAction, input: unknown, identity: SecurityIdentity, requestId: string) {
      const checked = validateWorkflowInput(action, input);
      uuid(requestId, 'requestId');
      try {
        const result = await database.query(workflowStatement, [action, JSON.stringify(checked), JSON.stringify({ ...identity, environment, correlationId: requestId })]);
        const response = result.rows[0]?.result;
        if (result.rows.length !== 1 || !response || typeof response !== 'object' || Array.isArray(response)) throw new Error();
        const record = response as Record<string, unknown>;
        uuid(record.auditId);
        if (record.ok !== true) {
          const allowed = ['UNAUTHENTICATED', 'FORBIDDEN', 'CONFLICT', 'VALIDATION_FAILED', 'NOT_FOUND', 'IDENTITY_UNAVAILABLE', 'RATE_LIMITED'];
          throw new ApiError(allowed.includes(String(record.error)) ? record.error as ErrorCode : 'AUDIT_UNAVAILABLE');
        }
        if (!record.data || typeof record.data !== 'object' || Array.isArray(record.data)) throw new Error();
        return Object.freeze({ ...record.data, auditId: record.auditId });
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('AUDIT_UNAVAILABLE');
      }
    },
  });
}
export type WorkflowCommands = ReturnType<typeof createWorkflowCommands>;

// Internal server adapter, not an enablement switch. The app must supply its
// real verified-cookie gateway and restricted database after hosted acceptance.
export function workflowResponse(request: Request, action: string, dependencies?: Readonly<{
  origin: string; identity(): Promise<SecurityIdentity>; commands: WorkflowCommands;
}>): Promise<Response> {
  return handleApi(request, async (input, context) => {
    if (!dependencies || !Object.hasOwn(workflowFields, action)) throw new ApiError('NOT_FOUND');
    if (input.method !== 'POST') throw new ApiError('METHOD_NOT_ALLOWED');
    if (input.headers.get('origin') !== dependencies.origin || new URL(input.url).origin !== dependencies.origin || new URL(input.url).search) {
      throw new ApiError('FORBIDDEN');
    }
    return admission.run(async () => {
      const identity = await dependencies.identity();
      const body = await readJson(input, value => validateWorkflowInput(action as WorkflowAction, value));
      return dependencies.commands.run(action as WorkflowAction, body, identity, context.requestId);
    });
  }).then(response => {
    if (response.status === 405) response.headers.set('Allow', 'POST');
    return response;
  });
}
