import test from 'node:test';
import assert from 'node:assert/strict';
import { documentChoices } from '../src/shared/document-print.ts';
import { validateOrderSpecification } from '../src/backend/orders/specification.ts';
import { createWorkflowCommands, workflowResponse } from '../src/backend/orders/workflow.ts';
import type { SecurityIdentity } from '../src/backend/identity/security-admin.ts';

const spec = { kind: 'document', schemaVersion: 1, pages: 5, copies: 3, purpose: 'notes', paperSize: 'a4',
  paperType: 'standard', colour: 'mono', sides: 'double', binding: 'spiral', urgency: 'standard', handoff: 'collection' };
const id = '12345678-1234-4123-8123-123456789abc';
const identity: SecurityIdentity = { issuer: 'https://synthetic.invalid/auth/v1', subject: id, sessionId: id,
  aal: 'aal1', mfaAt: null, primaryAt: null, stepUpAt: null };

test('server document contract preserves all selections and legacy merchandise', () => {
  assert.deepEqual(validateOrderSpecification(spec), spec);
  for (const [key, choice] of Object.entries(documentChoices)) {
    for (const option of Object.keys(choice.options)) assert.deepEqual(validateOrderSpecification({ ...spec, [key]: option }), { ...spec, [key]: option });
  }
  for (const [pages, copies] of [[1, 1], [2000, 1000]]) assert.equal(validateOrderSpecification({ ...spec, pages, copies }).pages, pages);
  const merchandise = { productCode: 'cotton-t-shirt', quantity: 10, widthMm: 100, heightMm: 150 };
  assert.deepEqual(validateOrderSpecification(merchandise), merchandise);
});

test('server document contract rejects coercion, unsupported versions and client authority', () => {
  const bad: unknown[] = [null, [], 'document', Object.create(null), { ...spec, kind: 'constructor' }, { ...spec, schemaVersion: '1' },
    { ...spec, schemaVersion: 2 }, { ...spec, price: 1 }, { ...spec, productCode: 'fake' }, { ...spec, sourceFile: 'private.pdf' }];
  for (const key of Object.keys(spec)) {
    const missing = { ...spec } as Record<string, unknown>; delete missing[key]; bad.push(missing);
    bad.push({ ...spec, [key]: null });
  }
  for (const key of ['pages', 'copies']) {
    for (const value of [0, -1, 1.5, '2', true, Infinity, NaN, 2001, {}]) bad.push({ ...spec, [key]: value });
  }
  for (const key of Object.keys(documentChoices)) for (const value of ['__proto__', 'constructor', '<script>synthetic</script>', 1, [], {}]) bad.push({ ...spec, [key]: value });
  for (const value of bad) assert.throws(() => validateOrderSpecification(value), { code: 'VALIDATION_FAILED' });
  for (const patch of [{ quantity: '1' }, { widthMm: 0 }, { heightMm: 10001 }, { quantity: 1.1 }, { productCode: '__proto__' }, { schemaVersion: 1 }]) {
    assert.throws(() => validateOrderSpecification({ productCode: 'synthetic', quantity: 1, widthMm: 1, heightMm: 1, ...patch }), { code: 'VALIDATION_FAILED' });
  }
});

test('authenticated workflow binds document options intact and rejects malformed spec before SQL', async () => {
  let calls = 0;
  const commands = createWorkflowCommands({ async query(_sql, values) {
    calls++;
    assert.deepEqual(JSON.parse(values![1] as string).spec, spec);
    return { rows: [{ result: { ok: true, data: { state: 'DRAFT', spec }, auditId: id } }] as never, rowCount: 1 };
  } }, 'local');
  const origin = 'https://synthetic.invalid';
  const request = (spec: unknown) => new Request(`${origin}/api/workflow/order.create`, { method: 'POST',
    headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ orderId: id, operationId: id, expectedVersion: 0, spec }) });
  const dependencies = { origin, commands, identity: async () => identity };
  const result = await workflowResponse(request(spec), 'order.create', dependencies);
  assert.equal(result.status, 200); assert.deepEqual((await result.json()).data.spec, spec);
  const invalid = await workflowResponse(request({ ...spec, amountMinor: 1 }), 'order.create', dependencies);
  assert.equal(invalid.status, 400); assert.equal(calls, 1);
  assert.equal((await workflowResponse(request(spec), 'order.create')).status, 404);
});
