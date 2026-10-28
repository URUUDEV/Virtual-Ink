import { ApiError, type ErrorCode } from '../api/errors.ts';
import { strictObject, uuid } from '../api/validation.ts';
import type { SqlExecutor } from '../database/ports.ts';
import type { SecurityIdentity } from '../identity/security-admin.ts';

// A proposal for review, never a fallback for missing approved database policy.
export const pilotCommissionProposal = Object.freeze({ basisPoints: 500, collection: 'direct_to_vendor', settlement: 'weekly', status: 'proposed' });
const fields = {
  read: [], 'agreement.accept': ['policyId', 'termsSha256', 'consent'],
  'price.save': ['priceId', 'expectedVersion', 'service', 'label', 'unit', 'amountMinor', 'currency'],
  'price.retire': ['priceId', 'expectedVersion'],
} as const;
export type CommerceAction = keyof typeof fields;
const integer = (value: unknown, minimum: number, maximum: number): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum;

export function commissionMinor(amountMinor: number, basisPoints: number): number {
  if (!integer(amountMinor, 0, 1_000_000_000) || !integer(basisPoints, 0, 10000)) throw new ApiError('VALIDATION_FAILED');
  // Half up once per immutable quote; no floating-point currency arithmetic.
  return Number((BigInt(amountMinor) * BigInt(basisPoints) + 5000n) / 10000n);
}
export function validateCommerceInput(action: CommerceAction, value: unknown) {
  if (!Object.hasOwn(fields, action)) throw new ApiError('NOT_FOUND');
  const input = strictObject(value, ['vendorId', 'operationId', ...fields[action]]);
  const result: Record<string, unknown> = { ...input, operationId: uuid(input.operationId, 'operationId') };
  if (action !== 'read' || input.vendorId !== undefined) result.vendorId = uuid(input.vendorId, 'vendorId');
  if (action === 'agreement.accept') {
    result.policyId = uuid(input.policyId, 'policyId');
    if (input.consent !== true || typeof input.termsSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(input.termsSha256)) throw new ApiError('VALIDATION_FAILED');
  }
  if (action === 'price.save' || action === 'price.retire') {
    result.priceId = uuid(input.priceId, 'priceId');
    if (!integer(input.expectedVersion, action === 'price.save' ? 0 : 1, 999999)) throw new ApiError('VALIDATION_FAILED');
  }
  if (action === 'price.save') {
    if (!['printing', 'design'].includes(String(input.service)) || !['page', 'copy', 'item', 'job', 'hour'].includes(String(input.unit)) ||
      input.currency !== 'ZMW' || !integer(input.amountMinor, 1, 1_000_000_000) || typeof input.label !== 'string' ||
      input.label !== input.label.trim() || !input.label || input.label.length > 120 || /[<>\p{Cc}\u202a-\u202e\u2066-\u2069]/u.test(input.label)) throw new ApiError('VALIDATION_FAILED');
  }
  return result;
}
export function commerceFormInput(entries: readonly [string, FormDataEntryValue][]) {
  if (entries.length > 24 || new Set(entries.map(([key]) => key)).size !== entries.length ||
    entries.some(([, value]) => typeof value !== 'string' || value.length > 4096)) throw new ApiError('VALIDATION_FAILED');
  const { action, ...values } = Object.fromEntries(entries.filter(([key]) => !key.startsWith('$ACTION_')));
  const input: Record<string, unknown> = values;
  if (typeof action !== 'string' || !Object.hasOwn(fields, action) || action === 'read') throw new ApiError('VALIDATION_FAILED');
  if ('expectedVersion' in input) {
    if (!/^(0|[1-9][0-9]{0,5})$/.test(String(input.expectedVersion))) throw new ApiError('VALIDATION_FAILED');
    input.expectedVersion = Number(input.expectedVersion);
  }
  if ('amountMinor' in input) throw new ApiError('VALIDATION_FAILED');
  if ('amount' in input) {
    if (typeof input.amount !== 'string' || !/^(0|[1-9][0-9]{0,7})(?:\.[0-9]{1,2})?$/.test(input.amount)) throw new ApiError('VALIDATION_FAILED');
    const [whole, fraction = ''] = input.amount.split('.');
    input.amountMinor = Number(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')));
    delete input.amount;
  }
  if ('consent' in input) input.consent = input.consent === 'on';
  return { action: action as CommerceAction, input: validateCommerceInput(action as CommerceAction, input) };
}
export function createCommerceCommands(database: SqlExecutor, environment: 'local' | 'preview') {
  return Object.freeze({ async run(action: CommerceAction, input: unknown, identity: SecurityIdentity, requestId: string) {
    const checked = validateCommerceInput(action, input); uuid(requestId);
    try {
      const response = await database.query('SELECT virtual_ink_workflow.commercial_command($1,$2::jsonb,$3::jsonb) AS result',
        [action, JSON.stringify(checked), JSON.stringify({ ...identity, environment, correlationId: requestId })]);
      const record = response.rows[0]?.result as { ok?: unknown; auditId?: unknown; error?: unknown; data?: unknown } | undefined;
      if (response.rows.length !== 1 || !record || typeof record !== 'object' || Array.isArray(record)) throw new Error();
      uuid(record.auditId);
      if (record.ok !== true) {
        const errors = ['UNAUTHENTICATED', 'FORBIDDEN', 'CONFLICT', 'VALIDATION_FAILED', 'NOT_FOUND', 'IDENTITY_UNAVAILABLE', 'RATE_LIMITED'];
        throw new ApiError(errors.includes(String(record.error)) ? record.error as ErrorCode : 'AUDIT_UNAVAILABLE');
      }
      if (!record.data || typeof record.data !== 'object' || Array.isArray(record.data)) throw new Error();
      return Object.freeze({ ...record.data, auditId: record.auditId });
    } catch (error) { if (error instanceof ApiError) throw error; throw new ApiError('AUDIT_UNAVAILABLE'); }
  } });
}
