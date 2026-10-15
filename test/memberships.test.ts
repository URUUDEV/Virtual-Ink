import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { ApiError } from '../src/backend/api/errors.ts';
import { createAuditEvent } from '../src/backend/audit/events.ts';
import { accessResponse } from '../src/backend/identity/routes.ts';
import { createMembershipService, parseMembershipPagination, membershipCursor,
  membershipsStatement, membershipCursorStatement } from '../src/backend/identity/memberships.ts';
import { createPooledDatabase } from '../src/backend/database/pool.ts';
import type { SqlDatabase, SqlExecutor, SqlParameter } from '../src/backend/database/ports.ts';
import type { GlobalRole } from '../src/backend/permissions/policy.ts';
import { createApp } from '../src/app.js';

const user = '11111111-1111-4111-8111-111111111111';
const otherUser = '99999999-9999-4999-8999-999999999999';
const first = '22222222-2222-4222-8222-222222222222';
const second = '33333333-3333-4333-8333-333333333333';
const hidden = '44444444-4444-4444-8444-444444444444';
const requestId = '55555555-5555-4555-8555-555555555555';
const identity = { provider: 'supabase' as const, issuer: 'https://synthetic.invalid/auth/v1', subject: user };
type Row = { tenant_id: string; user_id: string; role: 'VendorOwner' | 'VendorStaff'; active: boolean; tenant_active: boolean };
const fixtures: Row[] = [
  { tenant_id: first, user_id: user, role: 'VendorOwner', active: true, tenant_active: true },
  { tenant_id: second, user_id: user, role: 'VendorStaff', active: true, tenant_active: true },
  { tenant_id: hidden, user_id: otherUser, role: 'VendorOwner', active: true, tenant_active: true },
];
type Scenario = { rows?: Row[]; roles?: GlobalRole[]; mapped?: boolean; userActive?: boolean;
  auditFails?: boolean; auditCount?: number; commitFails?: boolean; badRows?: Record<string, unknown>[] };
function fixtureDatabase(scenario: Scenario = {}) {
  const state = { calls: [] as { sql: string; parameters: readonly SqlParameter[] }[], audits: 0, commits: 0, rollbacks: 0 };
  let pendingAudits = 0;
  const query: SqlExecutor['query'] = async <T extends Record<string, unknown>>(sql: string, parameters: readonly SqlParameter[]) => {
    state.calls.push({ sql, parameters });
    let rows: Record<string, unknown>[] = [];
    let rowCount = 0;
    if (sql.startsWith('SELECT user_id FROM virtual_ink.identities')) rows = scenario.mapped === false ? [] : [{ user_id: user }];
    else if (sql.startsWith('SELECT id, active FROM virtual_ink.users')) rows = scenario.userActive === false ? [] : [{ id: user, active: true }];
    else if (sql.startsWith('SELECT role FROM virtual_ink.user_roles')) rows = (scenario.roles ?? []).map((role) => ({ role }));
    else if ([membershipsStatement, membershipCursorStatement].includes(sql)) {
      assert.equal(parameters[0], user);
      const eligible = (scenario.rows ?? fixtures).filter((r) => r.user_id === user && r.active && r.tenant_active);
      rows = sql === membershipCursorStatement ? eligible.filter((r) => r.tenant_id === parameters[1]) :
        scenario.badRows ?? eligible.filter((r) => !parameters[1] || r.tenant_id > String(parameters[1]))
          .sort((a,b) => a.tenant_id.localeCompare(b.tenant_id)).slice(0, Number(parameters[2]));
    } else if (sql.startsWith('INSERT INTO virtual_ink.membership_list_audits')) {
      if (scenario.auditFails) throw new Error('SYNTHETIC_PRIVATE_DATABASE_DETAIL');
      rowCount = scenario.auditCount ?? 1;
      pendingAudits += rowCount;
    }
    return { rows: rows as T[], rowCount };
  };
  const db: SqlDatabase = { query, async close() {}, async transaction(work) {
    pendingAudits = 0;
    try {
      const result = await work({ query });
      if (scenario.commitFails) throw new Error('SYNTHETIC_PRIVATE_COMMIT_DETAIL');
      state.commits++; state.audits += pendingAudits;
      return result;
    } catch (error) { state.rollbacks++; throw error; }
  } };
  return { db, state };
}
const dependencies = (db: SqlDatabase) => ({ database: db, verifier: { async verify() { return identity; } } });
const headers = { authorization: 'Bearer synthetic-token', 'x-user-id': otherUser, 'x-role': 'PlatformOperator', 'x-vendor-id': hidden };

test('membership pagination is bounded and rejects unknown, duplicate and malformed inputs', () => {
  assert.deepEqual(parseMembershipPagination(new URLSearchParams()), { limit: 20, cursor: null });
  assert.equal(parseMembershipPagination(new URLSearchParams('limit=100')).limit, 100);
  for (const query of ['limit=0','limit=101','limit=-1','limit=1.5','limit=1&limit=2','cursor=','cursor=x&cursor=y',
    'cursor=bad=','cursor=' + 'a'.repeat(257), 'user_id=' + otherUser,'role=VendorOwner','vendor_id=' + hidden]) {
    assert.throws(() => parseMembershipPagination(new URLSearchParams(query)), ApiError);
  }
});

test('list returns minimal own active scopes and audits only after a successful transaction', async () => {
  const { db, state } = fixtureDatabase({ rows: [...fixtures,
    { ...fixtures[0], tenant_id: hidden, active: false },
    { ...fixtures[0], tenant_id: otherUser, tenant_active: false }] });
  const page = await createMembershipService(db).list(identity, { limit: 20, cursor: null }, requestId);
  assert.deepEqual(page, { data: [{ tenantId: first, role: 'VendorOwner' }, { tenantId: second, role: 'VendorStaff' }],
    pagination: { limit: 20, nextCursor: null } });
  assert.equal(state.commits, 1); assert.equal(state.audits, 1);
  const insert = state.calls.find((call) => call.sql.startsWith('INSERT'))!;
  assert.deepEqual(insert.parameters.slice(2), [user, 'memberships.listed', user, requestId, 'allowed']);
  assert.ok(!JSON.stringify(insert.parameters).includes(first));
  assert.ok(state.calls.some((call) => call.sql.includes("set_config('app.tenant_id', '', true)")));
  for (const call of state.calls) assert.ok(!call.sql.includes(user), 'Identifiers must be parameters');
});

test('caller-scoped cursor resumes deterministic pagination without duplicate or other-user records', async () => {
  const { db } = fixtureDatabase();
  const service = createMembershipService(db);
  const page1 = await service.list(identity, { limit: 1, cursor: null }, requestId);
  assert.deepEqual(page1.data, [{ tenantId: first, role: 'VendorOwner' }]);
  assert.equal(page1.pagination.nextCursor, membershipCursor(user, first));
  const page2 = await service.list(identity, { limit: 1, cursor: page1.pagination.nextCursor }, requestId);
  assert.deepEqual(page2, { data: [{ tenantId: second, role: 'VendorStaff' }], pagination: { limit: 1, nextCursor: null } });
});

test('changed, cross-user, inactive and guessed cursor positions fail within caller scope', async () => {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  for (const cursor of ['bad', membershipCursor(otherUser, first), membershipCursor(user, hidden),
    encode({ v: 2, userId: user, after: first }), encode({ v: 1, userId: user, after: first, role: 'VendorOwner' }),
    encode({ v: 1, userId: user, after: 'not-an-id' })]) {
    const { db, state } = fixtureDatabase();
    await assert.rejects(createMembershipService(db).list(identity, { limit: 1, cursor }, requestId), { code: 'VALIDATION_FAILED' });
    assert.equal(state.commits, 0); assert.equal(state.audits, 0);
  }
  const { db } = fixtureDatabase({ rows: fixtures.map((row) => ({ ...row, active: false })) });
  await assert.rejects(createMembershipService(db).list(identity, { limit: 1, cursor: membershipCursor(user, first) }, requestId), { code: 'VALIDATION_FAILED' });
});

test('unmapped and inactive users cannot list memberships', async () => {
  for (const scenario of [{ mapped: false }, { userActive: false }]) {
    const { db, state } = fixtureDatabase(scenario);
    await assert.rejects(createMembershipService(db).list(identity, { limit: 20, cursor: null }, requestId), { code: 'FORBIDDEN' });
    assert.equal(state.audits, 0); assert.equal(state.commits, 0);
  }
});

test('empty customer/operator lists and mixed delivery memberships produce audited empty pages', async () => {
  for (const roles of [['Customer'], ['PlatformOperator'], ['DeliveryPartner'], ['DeliveryPartner','PlatformOperator']] as GlobalRole[][]) {
    const { db, state } = fixtureDatabase({ roles, rows: roles.includes('DeliveryPartner') ? fixtures : [] });
    const page = await createMembershipService(db).list(identity, { limit: 20, cursor: null }, requestId);
    assert.deepEqual(page, { data: [], pagination: { limit: 20, nextCursor: null } });
    assert.equal(state.audits, 1);
    if (roles.includes('DeliveryPartner')) assert.ok(!state.calls.some((call) => call.sql === membershipsStatement));
  }
});

test('failed/zero-row audit and failed commit cannot release list or private database errors', async () => {
  for (const scenario of [{ auditFails: true }, { auditCount: 0 }, { commitFails: true }]) {
    const { db, state } = fixtureDatabase(scenario);
    const response = await accessResponse(new Request('http://localhost/api/v1/memberships', { headers }), dependencies(db));
    assert.ok([500,503].includes(response.status));
    const body = await response.text();
    assert.ok(!body.includes(first)); assert.ok(!body.includes('SYNTHETIC_PRIVATE'));
    assert.equal(state.commits, 0); assert.equal(state.audits, 0);
  }
});

test('corrupt role, oversized, duplicate and out-of-order results fail closed', async () => {
  for (const badRows of [[{ tenant_id: first, role: 'PlatformOperator' }],
    [{ tenant_id: first, role: 'VendorOwner' },{ tenant_id: first, role: 'VendorOwner' }],
    [{ tenant_id: second, role: 'VendorStaff' },{ tenant_id: first, role: 'VendorOwner' }],
    fixtures]) {
    const { db, state } = fixtureDatabase({ badRows });
    await assert.rejects(createMembershipService(db).list(identity, { limit: 1, cursor: null }, requestId), ApiError);
    assert.equal(state.audits, 0);
  }
});

test('shared HTTP boundary exposes page metadata, rejects authority selectors and methods honestly', async () => {
  const url = 'http://localhost/api/v1/memberships';
  assert.equal((await accessResponse(new Request(url))).status, 401);
  assert.equal((await accessResponse(new Request(url, { headers }))).status, 503);
  const { db } = fixtureDatabase();
  const response = await accessResponse(new Request(url + '?limit=1', { headers }), dependencies(db));
  const body = await response.json();
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(body.data, [{ tenantId: first, role: 'VendorOwner' }]);
  assert.deepEqual(body.meta.pagination, { limit: 1, nextCursor: membershipCursor(user, first) });
  assert.ok(body.meta.requestId);
  for (const query of ['user_id=' + otherUser,'vendor_id=' + hidden,'role=PlatformOperator','limit=1&limit=2']) {
    assert.equal((await accessResponse(new Request(url + '?' + query, { headers }), dependencies(db))).status, 400);
  }
  for (const method of ['HEAD','POST','PUT','PATCH','DELETE','OPTIONS']) {
    const denied = await accessResponse(new Request(url, { method, headers }), dependencies(db));
    assert.equal(denied.status, 405); assert.equal(denied.headers.get('allow'), 'GET');
  }
});

test('Node HTTP adapter uses the shared protected membership route and logs no query or token', async () => {
  const logs: unknown[] = [];
  const { db } = fixtureDatabase();
  const app = createApp({ access: dependencies(db), logger: (event: unknown) => logs.push(event) });
  app.listen(0, '127.0.0.1'); await once(app, 'listening');
  const address = app.address(); assert.ok(address && typeof address !== 'string');
  try {
    const url = `http://127.0.0.1:${address.port}/api/v1/memberships`;
    assert.equal((await fetch(url)).status, 401);
    const response = await fetch(url + '?limit=1', { headers });
    assert.equal(response.status, 200); assert.equal((await response.json()).data[0].tenantId, first);
    assert.equal((await fetch(url + '?user_id=' + otherUser, { headers })).status, 400);
    assert.equal((await fetch(url, { method: 'POST', headers })).status, 405);
    const output = JSON.stringify(logs);
    assert.ok(!output.includes('synthetic-token')); assert.ok(!output.includes(otherUser)); assert.ok(!output.includes('limit'));
  } finally { await new Promise<void>((resolve) => app.close(() => resolve())); }
});

test('pool resets discovery mode across requests and discards connections when rollback fails', async () => {
  const statements: string[] = [];
  let discard: boolean | Error | undefined;
  const db = createPooledDatabase({ async connect() { return {
    async query(sql) { statements.push(sql); if (sql === 'ROLLBACK') throw new Error(); return { rows: [], rowCount: 0 }; },
    release(error) { discard = error; },
  }; }, async end() {} });
  await db.transaction(async (tx) => { await tx.query("SELECT set_config('app.access_mode','memberships.list',true)", []); });
  await db.transaction(async () => {});
  assert.equal(statements.filter((sql) => sql.includes("set_config('app.access_mode', '', true)")).length, 2);
  await assert.rejects(db.transaction(async () => { throw new Error(); }));
  assert.equal(discard, true);
});

test('self-scoped audit accepts only membership-list events and Next route delegates to shared handler', async () => {
  const input = { action: 'memberships.listed' as const, actorType: 'user' as const, actorId: user,
    tenantId: null, resourceId: user, requestId, outcome: 'allowed' as const };
  assert.equal(createAuditEvent(input).tenantId, null);
  for (const change of [{ tenantId: first }, { resourceId: otherUser }, { action: 'tenant.accessed' as const }]) {
    assert.throws(() => createAuditEvent({ ...input, ...change }), ApiError);
  }
  const source = await readFile('apps/web/src/app/api/v1/memberships/route.ts', 'utf8');
  assert.ok(source.includes("import { backendAccessResponse } from '@/lib/backend-access'"));
  assert.ok(source.includes('export const GET = backendAccessResponse'));
  const adapter = await readFile('apps/web/src/lib/backend-access.ts', 'utf8');
  assert.ok(adapter.includes("import { accessResponse } from '@backend/identity/routes.ts'"));
  assert.ok(adapter.includes('boundAppResponse(request)') && adapter.includes('await backendAccess()'));
  for (const method of ['HEAD','POST','PUT','PATCH','DELETE','OPTIONS']) assert.ok(source.includes(`export const ${method} = GET`));
});
