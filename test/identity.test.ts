import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError } from '../src/backend/api/errors.ts';
import { createSupabaseIdentityVerifier, bearerToken } from '../src/backend/identity/supabase.ts';
import { permits, type GlobalRole } from '../src/backend/permissions/policy.ts';
import { createIdentityService } from '../src/backend/identity/service.ts';
import { accessResponse } from '../src/backend/identity/routes.ts';
import { createPooledDatabase, type PoolConnection } from '../src/backend/database/pool.ts';
import { loadAccessDependencies } from '../src/backend/identity/runtime.ts';
import type { SqlDatabase, SqlExecutor, SqlParameter, QueryResult } from '../src/backend/database/ports.ts';

const user = '11111111-1111-4111-8111-111111111111';
const tenant = '22222222-2222-4222-8222-222222222222';
const other = '33333333-3333-4333-8333-333333333333';
const requestId = '44444444-4444-4444-8444-444444444444';
const projectUrl = 'https://odgxcuwueessxfsoveza.supabase.co';
const identity = { provider: 'supabase' as const, issuer: `${projectUrl}/auth/v1`, subject: user };
const config = { projectUrl, publishableKey: 'sb_publishable_synthetic' };

test('bearer tokens reject guest, cookie/query identities and ambiguous headers', () => {
  for (const authorization of [undefined, '', 'Basic secret', 'Bearer x, Bearer y', 'Bearer x y']) {
    assert.throws(() => bearerToken(new Request('http://localhost/api/v1/me?token=secret', {
      headers: { Cookie: 'token=secret', ...(authorization === undefined ? {} : { authorization }) },
    })), { code: 'UNAUTHENTICATED' });
  }
  assert.equal(bearerToken(new Request('http://localhost', { headers: { authorization: 'Bearer synthetic-token' } })), 'synthetic-token');
});

test('Supabase identity verification uses the Auth server and ignores metadata roles', async () => {
  let calls = 0;
  const verifier = createSupabaseIdentityVerifier(config, async (url, options) => {
    calls++;
    assert.equal(String(url), `${projectUrl}/auth/v1/user`);
    assert.equal(new Headers(options?.headers).get('authorization'), 'Bearer synthetic-token');
    assert.equal(options?.redirect, 'error');
    assert.equal(options?.cache, 'no-store');
    return Response.json({ id: user, is_anonymous: false, user_metadata: { role: 'PlatformOperator', vendor_id: other }, email: 'private@example.invalid' });
  });
  assert.deepEqual(await verifier.verify('synthetic-token'), identity);
  assert.deepEqual(await verifier.verify('synthetic-token'), identity);
  assert.equal(calls, 2, 'No verification cache');
});

test('anonymous, banned, malformed and rejected provider users fail closed', async () => {
  for (const payload of [{ id: user, is_anonymous: true }, { id: user }, { id: 'not-an-id', is_anonymous: false },
    { id: user, is_anonymous: false, banned_until: '2099-01-01T00:00:00Z' }]) {
    const verifier = createSupabaseIdentityVerifier(config, async () => Response.json(payload));
    await assert.rejects(verifier.verify('synthetic-token'), ApiError);
  }
  for (const status of [400, 401, 403, 429, 500]) {
    const verifier = createSupabaseIdentityVerifier(config, async () => new Response('private provider message', { status }));
    await assert.rejects(verifier.verify('synthetic-token'), (error: unknown) =>
      error instanceof ApiError && !error.message.includes('private'));
  }
  const verifier = createSupabaseIdentityVerifier(config, async () => { throw new Error('secret provider details'); });
  await assert.rejects(verifier.verify('synthetic-token'), { code: 'IDENTITY_UNAVAILABLE' });
});

test('all roles deny files/proofs and sensitive capabilities; delivery cannot inherit vendor access', () => {
  for (const roles of [[], ['Customer'], ['PlatformOperator'], ['DeliveryPartner']] as GlobalRole[][]) {
    for (const membership of [null, 'VendorOwner', 'VendorStaff'] as const) {
      const facts = { activeUser: true, activeTenant: true, roles, membership, operatorTenantReview: true };
      for (const capability of ['file.read', 'proof.read', 'membership.manage', 'pricing.change'] as const) assert.equal(permits(capability, facts), false);
      if (roles.includes('DeliveryPartner')) assert.equal(permits('tenant.read', facts), false);
      assert.equal(permits('tenant.read', { ...facts, activeUser: false }), false);
      assert.equal(permits('tenant.read', { ...facts, activeTenant: false }), false);
    }
  }
  assert.equal(permits('tenant.read', { activeUser: true, activeTenant: true, roles: ['Customer'], membership: null, operatorTenantReview: false }), false);
  assert.equal(permits('tenant.read', { activeUser: true, activeTenant: true, roles: ['PlatformOperator'], membership: null, operatorTenantReview: false }), false);
});

type Scenario = { roles?: GlobalRole[]; membership?: 'VendorOwner' | 'VendorStaff' | null; mapped?: boolean;
  userActive?: boolean; tenantVisible?: boolean; operatorGrant?: boolean; auditFails?: boolean; auditCount?: number; commitFails?: boolean };
function database(scenario: Scenario = {}) {
  const state = { calls: [] as { sql: string; parameters: readonly SqlParameter[] }[], commits: 0, rollbacks: 0, audits: 0 };
  let requested = '';
  const query: SqlExecutor['query'] = async <Row extends Record<string, unknown>>(sql: string, parameters: readonly SqlParameter[]) => {
    state.calls.push({ sql, parameters });
    let rows: Record<string, unknown>[] = [];
    let rowCount = 0;
    if (sql.startsWith('SELECT user_id')) rows = scenario.mapped === false ? [] : [{ user_id: user }];
    else if (sql.startsWith('SELECT id, active FROM virtual_ink.users')) rows = scenario.userActive === false ? [] : [{ id: user, active: true }];
    else if (sql.startsWith('SELECT role FROM virtual_ink.user_roles')) rows = (scenario.roles ?? []).map((role) => ({ role }));
    else if (sql.startsWith("SELECT set_config('app.tenant_id'")) requested = String(parameters[0]);
    else if (sql.startsWith('SELECT id, active FROM virtual_ink.tenants')) rows = requested !== tenant || scenario.tenantVisible === false ? [] : [{ id: tenant, active: true }];
    else if (sql.startsWith('SELECT role FROM virtual_ink.memberships')) rows = scenario.membership === null ? [] : [{ role: scenario.membership ?? 'VendorOwner' }];
    else if (sql.startsWith('SELECT capability')) rows = scenario.operatorGrant ? [{ capability: 'tenant.review' }] : [];
    else if (sql.startsWith('INSERT INTO virtual_ink.access_audits')) {
      if (scenario.auditFails) throw new Error('private DB detail');
      rowCount = scenario.auditCount ?? 1;
    }
    return { rows: rows as Row[], rowCount } as QueryResult<Row>;
  };
  const db: SqlDatabase = {
    query,
    async transaction(work) {
      try {
        const value = await work({ query });
        if (scenario.commitFails) throw new Error('commit failed');
        state.commits++;
        state.audits += state.calls.filter((call) => call.sql.startsWith('INSERT INTO virtual_ink.access_audits')).length;
        return value;
      } catch (error) { state.rollbacks++; throw error; }
    },
    async close() {},
  };
  return { db, state };
}

test('protected read binds verified subject and requested scope then durably audits before returning', async () => {
  const { db, state } = database();
  const result = await createIdentityService(db).tenantAccess(identity, tenant, requestId);
  assert.deepEqual(result, { tenantId: tenant, capability: 'tenant.read', membership: 'VendorOwner', accessBasis: 'active_membership' });
  assert.equal(state.commits, 1);
  assert.equal(state.audits, 1);
  const insert = state.calls.find((call) => call.sql.startsWith('INSERT'))!;
  assert.deepEqual(insert.parameters.slice(2), [user, tenant, 'tenant.accessed', tenant, requestId, 'allowed']);
  for (const call of state.calls) {
    assert.equal(call.sql.includes(identity.subject), false);
    assert.equal(call.sql.includes(tenant), false);
  }
});

test('unmapped/disabled identities and inaccessible/guessed tenants are denied without audit success', async () => {
  for (const scenario of [{ mapped: false }, { userActive: false }, { tenantVisible: false },
    { roles: ['Customer'], membership: null }, { roles: ['DeliveryPartner'] },
    { roles: ['PlatformOperator'], membership: null, operatorGrant: false }] as Scenario[]) {
    const { db, state } = database(scenario);
    await assert.rejects(createIdentityService(db).tenantAccess(identity, tenant, requestId), ApiError);
    assert.equal(state.commits, 0);
    assert.equal(state.audits, 0);
  }
  const { db, state } = database();
  await assert.rejects(createIdentityService(db).tenantAccess(identity, other, requestId), { code: 'NOT_FOUND' });
  assert.equal(state.commits, 0);
});

test('operator must hold both platform role and an explicit tenant grant', async () => {
  const { db } = database({ roles: ['PlatformOperator'], membership: null, operatorGrant: true });
  assert.equal((await createIdentityService(db).tenantAccess(identity, tenant, requestId)).accessBasis, 'explicit_operator_grant');
  const noRole = database({ roles: ['Customer'], membership: null, operatorGrant: true });
  await assert.rejects(createIdentityService(noRole.db).tenantAccess(identity, tenant, requestId), { code: 'NOT_FOUND' });
});

test('failed audit insert, zero-row insert and failed commit never release protected data', async () => {
  for (const scenario of [{ auditFails: true }, { auditCount: 0 }, { commitFails: true }]) {
    const { db, state } = database(scenario);
    await assert.rejects(createIdentityService(db).tenantAccess(identity, tenant, requestId));
    assert.equal(state.commits, 0);
    assert.equal(state.audits, 0);
  }
});

test('public identity boundary gives honest missing-config states and rejects selectors/role headers', async () => {
  const url = 'http://localhost/api/v1/me';
  assert.equal((await accessResponse(new Request(url))).status, 401);
  const headers = { authorization: 'Bearer synthetic-token', 'x-role': 'PlatformOperator', 'x-vendor-id': other };
  assert.equal((await accessResponse(new Request(url, { headers }))).status, 503);
  assert.equal((await accessResponse(new Request(url, { method: 'POST', headers }))).status, 405);
  const { db } = database({ roles: ['Customer'] });
  const dependencies = { verifier: { async verify() { return identity; } }, database: db };
  const response = await accessResponse(new Request(url, { headers }), dependencies);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, { userId: user, roles: ['Customer'] });
  assert.equal((await accessResponse(new Request(`${url}?vendor_id=${other}`, { headers }), dependencies)).status, 400);
});

test('transaction adapter keeps context/audit on one connection, resets context and rolls back on failure', async () => {
  const statements: string[] = [];
  const releases: (boolean | Error | undefined)[] = [];
  const connection: PoolConnection = {
    async query(sql) { statements.push(sql); return { rows: [], rowCount: 0 }; },
    release(value) { releases.push(value); },
  };
  const db = createPooledDatabase({ async connect() { return connection; }, async end() {} });
  let expired: SqlExecutor | undefined;
  await db.transaction(async (tx) => { expired = tx; await tx.query('SELECT private_action', []); });
  assert.equal(statements[0], 'BEGIN ISOLATION LEVEL REPEATABLE READ');
  assert.ok(statements[2].includes("set_config('app.user_id', '', true)"));
  assert.equal(statements.at(-1), 'COMMIT');
  await assert.rejects(expired!.query('SELECT late', []), /finished/);
  await assert.rejects(db.transaction(async () => { throw new Error('fail'); }));
  assert.equal(statements.at(-1), 'ROLLBACK');
  assert.equal(releases.length, 2);
});

test('a failed rollback discards the pooled connection', async () => {
  let discarded: boolean | Error | undefined;
  const db = createPooledDatabase({ async connect() { return {
    async query(sql) { if (sql === 'ROLLBACK') throw new Error(); return { rows: [], rowCount: 0 }; },
    release(value) { discarded = value; },
  }; }, async end() {} });
  await assert.rejects(db.transaction(async () => { throw new Error(); }));
  assert.equal(discarded, true);
});

test('optional runtime leaves health independent and rejects invalid auth switches', async () => {
  assert.equal(await loadAccessDependencies({}), undefined);
  await assert.rejects(loadAccessDependencies({ AUTH_ENABLED: 'yes' }), /AUTH_ENABLED/);
  await assert.rejects(loadAccessDependencies({ AUTH_ENABLED: 'true' }));
});
