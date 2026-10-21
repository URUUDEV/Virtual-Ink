import { ApiError, type ErrorCode } from '../api/errors.ts';
import { strictObject, uuid } from '../api/validation.ts';
import type { SqlExecutor } from '../database/ports.ts';
import type { SecurityIdentity } from '../identity/security-admin.ts';
import { validateWorkflowInput, type WorkflowAction } from './workflow.ts';

export type DashboardView = 'customer' | 'vendor' | 'admin';
export function dashboardMutation(value: unknown) {
  const common = ['action', 'orderId', 'operationId', 'expectedVersion'];
  const input = strictObject(value, [...common, 'productCode', 'quantity', 'widthMm', 'heightMm', 'handoff', 'artwork', 'quantityChecked', 'finish', 'passed', 'reasonCode']);
  const action = String(input.action) as WorkflowAction;
  const extras: Record<string, string[]> = {
    'order.create': ['productCode', 'quantity', 'widthMm', 'heightMm'],
    'order.cancel': [], 'quote.review': [], 'quote.accept': [], 'quote.reject': [],
    'job.accept': [], 'job.decline': ['reasonCode'], 'proof.request': [], 'production.queue': [],
    'production.start': [], 'production.finish': [], 'production.correct': [], 'order.complete': [],
    'order.ready': ['handoff'], 'qc.record': ['artwork', 'quantityChecked', 'finish', 'passed', 'reasonCode'],
  };
  if (!Object.hasOwn(extras, action)) throw new ApiError('NOT_FOUND');
  strictObject(input, [...common, ...extras[action]]);
  const body: Record<string, unknown> = { orderId: input.orderId, operationId: input.operationId, expectedVersion: Number(input.expectedVersion) };
  if (action === 'order.create') body.spec = { productCode: input.productCode, quantity: Number(input.quantity), widthMm: Number(input.widthMm), heightMm: Number(input.heightMm) };
  else if (action === 'qc.record') {
    if (!['true', 'false'].includes(String(input.passed))) throw new ApiError('VALIDATION_FAILED');
    body.passed = input.passed === 'true'; body.reasonCode = input.reasonCode;
    body.checks = { artwork: input.artwork === 'on', quantity: input.quantityChecked === 'on', finish: input.finish === 'on' };
  } else for (const field of extras[action]) body[field] = input[field];
  return { action, input: validateWorkflowInput(action, body) };
}
export function dashboardInput(value: unknown) {
  const input = strictObject(value, ['view', 'state', 'cursor', 'limit', 'orderId']);
  if (!['customer', 'vendor', 'admin'].includes(String(input.view)) ||
    input.state !== undefined && (typeof input.state !== 'string' || !/^[A-Z_]{3,32}$/.test(input.state)) ||
    input.limit !== undefined && (!Number.isInteger(input.limit) || Number(input.limit) < 1 || Number(input.limit) > 50)) throw new ApiError('VALIDATION_FAILED');
  for (const key of ['cursor', 'orderId']) if (input[key] !== undefined) uuid(input[key], key);
  return input;
}
export function createDashboardQueries(database: SqlExecutor, environment: 'local' | 'preview') {
  return Object.freeze({ async read(input: unknown, identity: SecurityIdentity, requestId: string) {
    const checked = dashboardInput(input); uuid(requestId);
    try {
      const result = await database.query('SELECT virtual_ink_workflow.dashboard($1::jsonb,$2::jsonb) AS result',
        [JSON.stringify(checked), JSON.stringify({ ...identity, environment, correlationId: requestId })]);
      const raw = result.rows[0]?.result;
      if (result.rows.length !== 1 || !raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error();
      const record=raw as {auditId?:unknown;ok?:unknown;error?:unknown;data?:Record<string,unknown>};
      uuid(record.auditId);
      if (record.ok !== true) {
        const codes = ['UNAUTHENTICATED', 'FORBIDDEN', 'CONFLICT', 'VALIDATION_FAILED', 'NOT_FOUND', 'IDENTITY_UNAVAILABLE', 'RATE_LIMITED'];
        throw new ApiError(codes.includes(String(record.error)) ? record.error as ErrorCode : 'AUDIT_UNAVAILABLE');
      }
      if (!record.data || !Array.isArray(record.data.orders) || !record.data.summary || record.data.view !== checked.view) throw new Error();
      return { ...record.data, auditId: record.auditId };
    } catch (error) { if (error instanceof ApiError) throw error; throw new ApiError('AUDIT_UNAVAILABLE'); }
  } });
}
