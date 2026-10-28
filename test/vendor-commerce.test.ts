import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../src/backend/api/errors.ts';
import { commissionMinor, pilotCommissionProposal, validateCommerceInput, commerceFormInput, createCommerceCommands } from '../src/backend/vendors/commerce.ts';
import type { SecurityIdentity } from '../src/backend/identity/security-admin.ts';
import type { SqlExecutor } from '../src/backend/database/ports.ts';
const id = '12345678-1234-4123-8123-123456789abc';
const base = { vendorId: id, operationId: id };
const price = { ...base, priceId: id, expectedVersion: 0, service: 'printing', label: 'A4 mono per printed side', unit: 'page', amountMinor: 100, currency: 'ZMW' };
const agreement = { ...base, policyId: id, termsSha256: 'a'.repeat(64), consent: true };
const identity: SecurityIdentity = { subject: id, issuer: 'https://synthetic.invalid/auth/v1', sessionId: id, aal: 'aal1', mfaAt: null, primaryAt: null, stepUpAt: null };
test('commission proposal is draft only and money rounds half-up once in minor units', () => {
  assert(Object.isFrozen(pilotCommissionProposal)); assert.equal(pilotCommissionProposal.status, 'proposed');
  assert.equal(pilotCommissionProposal.basisPoints, 500);
  for (const [amount, rate, expected] of [[10000, 500, 500], [1, 500, 0], [10, 500, 1], [0, 500, 0], [1000000000, 10000, 1000000000], [999999999, 9999, 999899999], [100, 0, 0]]) assert.equal(commissionMinor(amount, rate), expected);
  for (const amount of [-1, 1.1, 1000000001, NaN, Infinity, '100', null, undefined]) assert.throws(() => commissionMinor(amount as number, 500), ApiError);
  for (const rate of [-1, 1.1, 10001, NaN, Infinity, '500', undefined]) assert.throws(() => commissionMinor(100, rate as number), ApiError);
});
test('commercial inputs reject forged authority, coercive money, missing consent and malformed terms', () => {
  assert.deepEqual(validateCommerceInput('read', { operationId: id }), { operationId: id });
  assert.deepEqual(validateCommerceInput('read', base), base);
  assert.deepEqual(validateCommerceInput('agreement.accept', agreement), agreement);
  assert.deepEqual(validateCommerceInput('price.save', price), price);
  assert.deepEqual(validateCommerceInput('price.retire', { ...base, priceId: id, expectedVersion: 1 }), { ...base, priceId: id, expectedVersion: 1 });
  for (const patch of [{ role: 'ADMIN' }, { commissionBasisPoints: 0 }, { amountMinor: '100' }, { amountMinor: 0 }, { amountMinor: 1.5 }, { amountMinor: 1000000001 }, { currency: 'USD' }, { expectedVersion: -1 }, { expectedVersion: 1000000 }, { service: 'delivery' }, { unit: 'constructor' }, { label: '' }, { label: ' padded ' }, { label: '<script>' }, { label: 'x\u202e' }, { label: 'x'.repeat(121) }, { vendorId: 'bad' }, { priceId: undefined }]) assert.throws(() => validateCommerceInput('price.save', { ...price, ...patch }), ApiError);
  for (const patch of [{ consent: false }, { consent: 'true' }, { termsSha256: 'A'.repeat(64) }, { termsSha256: '' }, { policyId: 'bad' }]) assert.throws(() => validateCommerceInput('agreement.accept', { ...agreement, ...patch }), ApiError);
  assert.throws(() => validateCommerceInput('price.retire', { ...base, priceId: id, expectedVersion: 0 }), ApiError);
  assert.throws(() => validateCommerceInput('read', {}), ApiError);
  assert.throws(() => validateCommerceInput('__proto__' as never, base), { code: 'NOT_FOUND' });
});
test('commercial server-form parsing rejects duplicate fields, files and numeric coercion', () => {
  const entries = Object.entries({ action: 'price.save', ...price }).filter(([key]) => key !== 'amountMinor').map(([key, value]) => [key, String(value)] as [string, string]).concat([['amount', '1.00']]);
  assert.deepEqual(commerceFormInput(entries), { action: 'price.save', input: price });
  assert.deepEqual(commerceFormInput(Object.entries({ action: 'agreement.accept', ...agreement, consent: 'on' })), { action: 'agreement.accept', input: agreement });
  const retire = { ...base, priceId: id, expectedVersion: 1 };
  assert.deepEqual(commerceFormInput(Object.entries({ action: 'price.retire', ...retire }).map(([key, value]) => [key, String(value)])), { action: 'price.retire', input: retire });
  for (const bad of [entries.concat([entries[0]]), Array.from({ length: 25 }, (_, index) => [String(index), 'x'] as [string, string]), [['action', new File(['synthetic'], 'synthetic.txt')]], [['action', 'x'.repeat(4097)]], [['action', 'read']], [['action', 'nope']], []]) assert.throws(() => commerceFormInput(bad as [string, FormDataEntryValue][]), ApiError);
  for (const value of ['', ' ', '1e2', '01', '0x10', '-1', '1.0']) assert.throws(() => commerceFormInput(entries.map(([key, current]) => [key, key === 'expectedVersion' ? value : current])), ApiError);
  for (const value of ['', ' ', '1e2', '01', '0x10', '-1', '1.001', '10000000.01']) assert.throws(() => commerceFormInput(entries.map(([key, current]) => [key, key === 'amount' ? value : current])), ApiError);
  for (const amount of ['1', '1.0']) assert.equal(commerceFormInput(entries.map(([key, value]) => [key, key === 'amount' ? amount : value])).input.amountMinor, 100);
  assert.equal(commerceFormInput(entries.concat([['$ACTION_ID_synthetic', 'framework-only']])).input.amountMinor, 100);
  assert.throws(() => commerceFormInput(entries.concat([['amountMinor', '100']])), ApiError);
});
test('commercial database adapter binds verified context, requires audit and hides provider details', async () => {
  const executor = (result: unknown): SqlExecutor => ({ async query(sql, values) {
    assert.equal(sql, 'SELECT virtual_ink_workflow.commercial_command($1,$2::jsonb,$3::jsonb) AS result');
    assert.equal(values[0], 'price.save'); assert.deepEqual(JSON.parse(String(values[1])), price);
    assert.deepEqual(JSON.parse(String(values[2])), { ...identity, environment: 'preview', correlationId: id });
    return { rows: [{ result }] as never, rowCount: 1 };
  } });
  const result = await createCommerceCommands(executor({ ok: true, data: { version: 1 }, auditId: id }), 'preview').run('price.save', price, identity, id);
  assert.deepEqual(result, { version: 1, auditId: id }); assert(Object.isFrozen(result));
  for (const code of ['UNAUTHENTICATED', 'FORBIDDEN', 'CONFLICT', 'VALIDATION_FAILED', 'NOT_FOUND', 'IDENTITY_UNAVAILABLE', 'RATE_LIMITED', 'private-provider-error']) await assert.rejects(createCommerceCommands(executor({ ok: false, error: code, auditId: id }), 'preview').run('price.save', price, identity, id), { code: code === 'private-provider-error' ? 'AUDIT_UNAVAILABLE' : code });
  for (const result of [null, [], 'private', {}, { ok: true, auditId: 'bad', data: {} }, { ok: true, auditId: id }, { ok: true, auditId: id, data: [] }]) await assert.rejects(createCommerceCommands(executor(result), 'preview').run('price.save', price, identity, id), ApiError);
  for (const database of [{ query: async () => ({ rows: [], rowCount: 0 }) }, { query: async () => { throw Error('synthetic private credential'); } }]) await assert.rejects(createCommerceCommands(database, 'local').run('price.save', price, identity, id), { code: 'AUDIT_UNAVAILABLE' });
  await assert.rejects(createCommerceCommands(executor({}), 'preview').run('price.save', price, identity, 'bad'), ApiError);
});
