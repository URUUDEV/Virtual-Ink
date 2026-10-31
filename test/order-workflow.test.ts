import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../src/backend/api/errors.ts';
import { createWorkflowCommands, validateWorkflowInput, workflowResponse, workflowStatement } from '../src/backend/orders/workflow.ts';
import type { SecurityIdentity } from '../src/backend/identity/security-admin.ts';
import type { SqlExecutor } from '../src/backend/database/ports.ts';
import { assertEnvironmentIsolation, runtimeSecurityNotice } from '../src/backend/setup/environment-isolation.ts';
import { sensitiveRuntimeApproved } from '../src/backend/setup/runtime-policy.ts';
const id = '12345678-1234-4123-8123-123456789abc';
const identity: SecurityIdentity = { issuer: 'https://synthetic.invalid/auth/v1', subject: id, sessionId: id, aal: 'aal1', mfaAt: null, primaryAt: null, stepUpAt: null };
const input = { orderId: id, operationId: id, expectedVersion: 0, spec: { productCode: 'synthetic', quantity: 1, widthMm: 1, heightMm: 1 } };
const executor = (result: unknown, inspect: (sql: string, values: unknown) => void = () => {}): SqlExecutor => ({
  async query(sql, values) { inspect(sql, values); return { rows: [{ result }] as never, rowCount: 1 }; },
});
const commands = createWorkflowCommands(executor({ ok: true, data: { orderId: id, version: 1, state: 'DRAFT' }, auditId: id }), 'local');
const origin = 'https://app.example.test';
const request = (body: unknown = input, method = 'POST', headers: Record<string,string> = {}, path = '') => new Request(`${origin}/api/workflow/order.create${path}`, {
  method, ...(method === 'GET' || method === 'HEAD' ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  headers: { origin, 'content-type': 'application/json', ...headers },
});
const dependencies = { origin, identity: async () => identity, commands };

test('workflow input rejects mass assignment, unknown actions and invalid ids/versions', () => {
  assert.deepEqual(validateWorkflowInput('order.create', input), input);
  for (const value of [{ ...input, role: 'SUPER_ADMIN' }, { ...input, state: 'COMPLETED' }, { ...input, price: 1 },
    { ...input, orderId: '../other' }, { ...input, operationId: undefined }, { ...input, expectedVersion: -1 },
    { ...input, expectedVersion: 1.2 }, { ...input, expectedVersion: 1000001 }]) assert.throws(() => validateWorkflowInput('order.create', value), ApiError);
  assert.throws(() => validateWorkflowInput('constructor' as never, input), { code: 'NOT_FOUND' });
  assert.deepEqual(validateWorkflowInput('order.read', { orderId: id, operationId: id }), { orderId: id, operationId: id });
});

test('manual receipt input admits exact minor units and denies partial fields or forged financial authority', () => {
  const common = { orderId: id, operationId: id, expectedVersion: 4, evidenceReference: id };
  const receipt = { ...common, recipientId: id, receiptReference: 'synthetic-0001', amountMinor: 10000, currency: 'ZMW', receiptChecked: true };
  assert.deepEqual(validateWorkflowInput('payment.confirm', receipt), receipt);
  assert.throws(() => validateWorkflowInput('payment.confirm', common), ApiError);
  for (const patch of [
    { evidenceReference: null }, { recipientId: 'bad' }, { amountMinor: '10000' }, { amountMinor: 1.1 },
    { amountMinor: 0 }, { amountMinor: 1000000001 }, { currency: 'USD' }, { receiptChecked: 'true' }, { receiptChecked: false },
    { receiptReference: null }, { receiptReference: 'short' }, { receiptReference: '-'.repeat(8) },
    { receiptReference: 'x'.repeat(101) }, { receiptReference: 'x'.repeat(129) },
    { receiptReference: 'synthetic\n0001' }, { receiptReference: '<script>0001' }, { receiptReference: 'ＳYNTHETIC0001' },
    { recipientId: undefined }, { receiptReference: undefined }, { amountMinor: undefined }, { currency: undefined }, { receiptChecked: undefined },
    { paid: true }, { reviewerId: id }, { commissionReceived: true },
  ]) assert.throws(() => validateWorkflowInput('payment.confirm', { ...receipt, ...patch }), ApiError);
  assert.throws(() => validateWorkflowInput('payment.confirm', { ...common, currency: 'ZMW' }), ApiError);
});

test('workflow commands bind verified context/environment/request and require a committed audit receipt', async () => {
  const calls: unknown[] = [];
  const result = await createWorkflowCommands(executor({ ok: true, data: { version: 1 }, auditId: id }, (sql, values) => calls.push({ sql, values })), 'preview').run('order.create', input, identity, id);
  assert.deepEqual(result, { version: 1, auditId: id }); assert(Object.isFrozen(result));
  const call = calls[0] as { sql: string; values: string[] };
  assert.equal(call.sql, workflowStatement);
  assert.deepEqual(JSON.parse(call.values[1]), input);
  assert.deepEqual(JSON.parse(call.values[2]), { ...identity, environment: 'preview', correlationId: id });
  await assert.rejects(commands.run('order.create', input, identity, 'bad'), ApiError);
});

test('workflow commands preserve only fixed known errors and redact malformed/provider responses', async () => {
  for (const error of ['UNAUTHENTICATED','FORBIDDEN','CONFLICT','VALIDATION_FAILED','NOT_FOUND','IDENTITY_UNAVAILABLE','RATE_LIMITED','private-database-secret']) {
    const command = createWorkflowCommands(executor({ ok: false, error, auditId: id }), 'local');
    await assert.rejects(command.run('order.create', input, identity, id), { code: error === 'private-database-secret' ? 'AUDIT_UNAVAILABLE' : error });
  }
  for (const response of [null, [], 'secret', {}, { ok: true, data: {}, auditId: 'invalid' }, { ok: true, auditId: id }, { ok: true, data: [], auditId: id }]) {
    await assert.rejects(createWorkflowCommands(executor(response), 'local').run('order.create', input, identity, id), ApiError);
  }
  const broken: SqlExecutor = { query: async () => { throw new Error('private path credential'); } };
  await assert.rejects(createWorkflowCommands(broken, 'local').run('order.create', input, identity, id), { code: 'AUDIT_UNAVAILABLE' });
  const missing: SqlExecutor = { query: async () => ({ rows: [], rowCount: 0 }) };
  await assert.rejects(createWorkflowCommands(missing, 'local').run('order.create', input, identity, id), { code: 'AUDIT_UNAVAILABLE' });
});

test('workflow HTTP boundary is disabled by default and rejects CSRF, query data and wrong methods', async () => {
  assert.equal((await workflowResponse(request(), 'order.create')).status, 404);
  assert.equal((await workflowResponse(request(), '__proto__', dependencies)).status, 404);
  for (const headers of [{ origin: 'https://attacker.test' }, { origin: '' }]) {
    assert.equal((await workflowResponse(request(input, 'POST', headers), 'order.create', dependencies)).status, 403);
  }
  assert.equal((await workflowResponse(request(input, 'POST', {}, '?secret=synthetic'), 'order.create', dependencies)).status, 403);
  assert.equal((await workflowResponse(new Request('https://other.test/api/workflow/order.create', { method: 'POST', body: '{}', headers: { origin } }), 'order.create', dependencies)).status, 403);
  const wrong = await workflowResponse(request({}, 'GET'), 'order.create', dependencies);
  assert.equal(wrong.status, 405); assert.equal(wrong.headers.get('allow'), 'POST');
});

test('workflow HTTP requires verified identity, bounded strict JSON and safe no-store responses', async () => {
  const response = await workflowResponse(request(), 'order.create', dependencies);
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).data.state, 'DRAFT');
  const guest = await workflowResponse(request(), 'order.create', { ...dependencies, identity: async () => { throw new ApiError('UNAUTHENTICATED'); } });
  assert.equal(guest.status, 401);
  for (const [body, status] of [['{broken', 400], ['x'.repeat(17000), 413]]) {
    assert.equal((await workflowResponse(request(body), 'order.create', dependencies)).status, status);
  }
  assert.equal((await workflowResponse(request({}, 'POST', { 'content-type': 'text/plain' }), 'order.create', dependencies)).status, 415);
});

test('runtime security policy rejects affected releases and accepts the reviewed October fix', () => {
  assert.equal(runtimeSecurityNotice.open, false);
  for (const version of ['24.21.0','24.22.0','24.22.1-rc.1','26.12.1']) assert.equal(sensitiveRuntimeApproved(version), false);
  assert.equal(sensitiveRuntimeApproved('24.22.1'), true);
  assert.equal(sensitiveRuntimeApproved(), true);
  for (const flag of ['AUTH_ENABLED','WEB_AUTH_ENABLED','SECURITY_ADMIN_ENABLED','STORAGE_ENABLED','WORKFLOW_ENABLED']) {
    assert.equal(assertEnvironmentIsolation({ APPLICATION_ENVIRONMENT: 'production', [flag]: 'true' }).environment, 'production');
    assert.equal(assertEnvironmentIsolation({ APPLICATION_ENVIRONMENT: 'local', [flag]: 'true' }).environment, 'local');
  }
});
