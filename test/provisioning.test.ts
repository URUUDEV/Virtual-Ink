import assert from 'node:assert/strict';
import test from 'node:test';
import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';
import { createProvisioningService, parseProvisioningCommand } from '../src/backend/provisioning/service.ts';
import { assertDatabaseRole } from '../src/backend/database/runtime.ts';
import type { SqlDatabase, SqlExecutor, SqlParameter } from '../src/backend/database/ports.ts';
import { provisioningEnvironment, validateProvisioningMode } from '../scripts/provision.ts';
import { smokeSettings, runAuthSmoke } from '../scripts/auth-smoke.ts';
import { readPrivateToken } from '../scripts/private-token.ts';

const user = '11111111-1111-4111-8111-111111111111';
const tenant = '22222222-2222-4222-8222-222222222222';
const operationId = '33333333-3333-4333-8333-333333333333';
const approvalId = '44444444-4444-4444-8444-444444444444';
const reviewerId = '55555555-5555-4555-8555-555555555555';
const identity = { provider: 'supabase' as const, issuer: 'https://odgxcuwueessxfsoveza.supabase.co/auth/v1', subject: user };
const verifier = { async verify(token: string) { assert.equal(token, 'synthetic-token'); return identity; } };
const command = { action: 'create_account', operationId, approvalId, reviewerId };

type Scenario = { mapped?: boolean; inactiveIdentity?: boolean; inactiveUser?: boolean; customerInactive?: boolean;
  delivery?: boolean; tenantExists?: boolean; tenantInactive?: boolean; noOwner?: boolean;
  member?: 'VendorOwner' | 'VendorStaff'; memberInactive?: boolean; auditFails?: boolean; auditZero?: boolean; commitFails?: boolean };
function memoryDatabase(scenario: Scenario = {}) {
  const state = { calls: [] as { sql: string; parameters: readonly SqlParameter[] }[], commits: 0, rollbacks: 0,
    users: [] as string[], mappings: [] as (readonly SqlParameter[])[], memberships: [] as (readonly SqlParameter[])[],
    audits: [] as Record<string, unknown>[] };
  let pendingAudits: Record<string, unknown>[] = [];
  const query: SqlExecutor['query'] = async <Row extends Record<string, unknown>>(sql: string, parameters: readonly SqlParameter[]) => {
    state.calls.push({ sql, parameters });
    let rows: Record<string, unknown>[] = [];
    let rowCount = 0;
    if (sql.startsWith('SELECT request_fingerprint')) rows = state.audits.filter((row) => row.operation_id === parameters[0]);
    else if (sql.startsWith('SELECT i.user_id')) rows = scenario.mapped === false ? [] : [{ user_id: user,
      identity_active: !scenario.inactiveIdentity, user_active: !scenario.inactiveUser }];
    else if (sql.startsWith('SELECT role, active FROM virtual_ink.user_roles')) {
      rows = scenario.mapped === false ? [] : [{ role: 'Customer', active: !scenario.customerInactive }];
      if (scenario.delivery) rows.push({ role: 'DeliveryPartner', active: true });
    } else if (sql.startsWith('SELECT id, active')) rows = scenario.tenantExists ? [{ id: tenant, active: !scenario.tenantInactive }] : [];
    else if (sql.startsWith('SELECT m.user_id')) rows = scenario.noOwner ? [] : [{ user_id: user }];
    else if (sql.startsWith('SELECT role, active FROM virtual_ink.memberships')) rows = scenario.member ? [{ role: scenario.member, active: !scenario.memberInactive }] : [];
    else if (sql.startsWith('INSERT')) {
      rowCount = 1;
      if (sql.startsWith('INSERT INTO virtual_ink.users')) state.users.push(String(parameters[0]));
      else if (sql.startsWith('INSERT INTO virtual_ink.identities')) state.mappings.push(parameters);
      else if (sql.startsWith('INSERT INTO virtual_ink.memberships')) state.memberships.push(parameters);
      else if (sql.startsWith('INSERT INTO virtual_ink.provisioning_audits')) {
        if (scenario.auditFails) throw new Error('private database details');
        rowCount = scenario.auditZero ? 0 : 1;
        if (rowCount) pendingAudits.push({ operation_id: parameters[0], request_fingerprint: parameters[4],
          user_id: parameters[5], tenant_id: parameters[6], outcome: parameters[7] });
      }
    }
    return { rows: rows as Row[], rowCount };
  };
  const db: SqlDatabase = { query, async close() {}, async transaction(work) {
    const before = { users: state.users.length, mappings: state.mappings.length, memberships: state.memberships.length };
    pendingAudits = [];
    try {
      const result = await work({ query });
      if (scenario.commitFails) throw new Error('private commit details');
      state.audits.push(...pendingAudits); state.commits++; return result;
    } catch (error) {
      state.users.length = before.users; state.mappings.length = before.mappings; state.memberships.length = before.memberships;
      pendingAudits = []; state.rollbacks++; throw error;
    }
  } };
  return { db, state };
}

test('provisioning command rejects role/identity injection, unknown actions and missing approval references', () => {
  assert.deepEqual(parseProvisioningCommand(command), { ...command, tenantId: null });
  for (const value of [{ ...command, role: 'PlatformOperator' }, { ...command, subject: user },
    { ...command, vendor_id: tenant }, { ...command, action: 'grant_operator' },
    { ...command, approvalId: undefined }, { ...command, reviewerId: 'Mumba' },
    { ...command, tenantId: tenant }, { ...command, action: 'add_staff' }]) {
    assert.throws(() => parseProvisioningCommand(value), { code: 'INVALID_COMMAND' });
  }
});

test('private provisioning needs explicit development enablement and a separate database URL', () => {
  const env = { PROVISIONING_ENABLED: 'true', NODE_ENV: 'development', PROVISIONING_DATABASE_URL: 'private-admin', DATABASE_URL: 'private-api' };
  assert.equal(provisioningEnvironment(env).DATABASE_URL, 'private-admin');
  for (const invalid of [{}, { ...env, PROVISIONING_ENABLED: 'false' }, { ...env, NODE_ENV: 'production' },
    { ...env, PROVISIONING_DATABASE_URL: env.DATABASE_URL }]) assert.throws(() => provisioningEnvironment(invalid));
});

test('demo commands can only be previewed; token arguments and unknown modes are rejected', () => {
  validateProvisioningMode('preview', 'create-account.demo.json', []);
  validateProvisioningMode('apply', 'approved-account.json', []);
  for (const [mode, file, extra] of [['apply', 'create-account.demo.json', []], ['apply', 'approved.json', ['secret']],
    ['unknown', 'approved.json', []], ['preview', '', []]] as [string, string, string[]][]) {
    assert.throws(() => validateProvisioningMode(mode, file, extra));
  }
});

test('unverified and malformed requests perform no provisioning SQL', async () => {
  const { db, state } = memoryDatabase();
  const denied = { async verify() { throw new Error('provider rejected'); } };
  await assert.rejects(createProvisioningService(db, denied).execute(command, 'synthetic-token'));
  await assert.rejects(createProvisioningService(db, verifier).execute({ ...command, role: 'VendorOwner' }, 'synthetic-token'));
  assert.equal(state.calls.length, 0);
});

test('verified new account gets a generated application UUID, Customer role and committed audit', async () => {
  const { db, state } = memoryDatabase({ mapped: false });
  const result = await createProvisioningService(db, verifier).execute(command, 'synthetic-token');
  assert.notEqual(result.userId, identity.subject);
  assert.equal(result.outcome, 'created');
  assert.equal(result.historicalReplay, false);
  assert.equal(state.commits, 1);
  assert.equal(state.audits.length, 1);
  assert.deepEqual(state.mappings[0], [identity.provider, identity.issuer, identity.subject, result.userId]);
  assert.ok(state.calls.some((call) => call.sql.includes("VALUES ($1,'Customer')")));
  for (const call of state.calls) {
    assert.equal(call.sql.includes(identity.subject), false);
    assert.equal(call.sql.includes('synthetic-token'), false);
    assert.equal(call.parameters.includes('synthetic-token'), false);
  }
});

test('repeated reviewed request returns its historical receipt without applying grants again', async () => {
  const { db, state } = memoryDatabase();
  const service = createProvisioningService(db, verifier);
  const first = await service.execute(command, 'synthetic-token');
  const second = await service.execute(command, 'synthetic-token');
  assert.equal(first.outcome, 'existing');
  assert.deepEqual(second, { ...first, historicalReplay: true });
  assert.equal(state.audits.length, 1);
  await assert.rejects(service.execute({ ...command, approvalId: reviewerId }, 'synthetic-token'), { code: 'CONFLICT' });
  assert.equal(state.audits.length, 1);
});

test('inactive mapping, disabled user and disabled Customer grant cannot be reactivated', async () => {
  for (const scenario of [{ inactiveIdentity: true }, { inactiveUser: true }, { customerInactive: true }]) {
    const { db, state } = memoryDatabase(scenario);
    await assert.rejects(createProvisioningService(db, verifier).execute(command, 'synthetic-token'), { code: 'NOT_ELIGIBLE' });
    assert.equal(state.audits.length, 0);
    assert.equal(state.calls.filter((call) => call.sql.startsWith('INSERT')).length, 0);
  }
});

test('new vendor requires an existing verified mapping and creates only its owner membership', async () => {
  const vendor = { ...command, action: 'create_vendor', tenantId: tenant };
  const { db, state } = memoryDatabase();
  assert.equal((await createProvisioningService(db, verifier).execute(vendor, 'synthetic-token')).outcome, 'created');
  assert.deepEqual(state.memberships[0], [tenant, user]);
  assert.ok(state.calls.some((call) => call.sql.includes("'VendorOwner'")));
  for (const scenario of [{ mapped: false }, { delivery: true }, { tenantExists: true }]) {
    const fixture = memoryDatabase(scenario);
    await assert.rejects(createProvisioningService(fixture.db, verifier).execute(vendor, 'synthetic-token'));
    assert.equal(fixture.state.memberships.length, 0);
    assert.equal(fixture.state.audits.length, 0);
  }
});

test('staff provisioning needs an active tenant and owner; refuses owner replacement and disabled membership', async () => {
  const staff = { ...command, action: 'add_staff', tenantId: tenant };
  for (const scenario of [{ tenantExists: true }, { tenantExists: true, member: 'VendorStaff' as const }]) {
    const { db, state } = memoryDatabase(scenario);
    const result = await createProvisioningService(db, verifier).execute(staff, 'synthetic-token');
    assert.equal(result.outcome, scenario.member ? 'existing' : 'created');
    assert.equal(state.memberships.length, scenario.member ? 0 : 1);
    assert.equal(state.audits.length, 1);
  }
  for (const scenario of [{}, { tenantExists: true, tenantInactive: true }, { tenantExists: true, noOwner: true },
    { tenantExists: true, member: 'VendorOwner' as const }, { tenantExists: true, member: 'VendorStaff' as const, memberInactive: true },
    { tenantExists: true, delivery: true }]) {
    const { db, state } = memoryDatabase(scenario);
    await assert.rejects(createProvisioningService(db, verifier).execute(staff, 'synthetic-token'), { code: 'NOT_ELIGIBLE' });
    assert.equal(state.memberships.length, 0);
    assert.equal(state.audits.length, 0);
  }
});

test('audit insert failure, zero affected rows and commit failure roll back account mutations', async () => {
  for (const scenario of [{ auditFails: true }, { auditZero: true }, { commitFails: true }]) {
    const { db, state } = memoryDatabase({ ...scenario, mapped: false });
    await assert.rejects(createProvisioningService(db, verifier).execute(command, 'synthetic-token'));
    assert.equal(state.users.length, 0);
    assert.equal(state.mappings.length, 0);
    assert.equal(state.audits.length, 0);
    assert.equal(state.commits, 0);
    assert.equal(state.rollbacks, 1);
  }
});

test('audit fingerprint binds command, reviewer and verified identity; token is excluded', async () => {
  const { db, state } = memoryDatabase();
  await createProvisioningService(db, verifier).execute(command, 'synthetic-token');
  const fingerprint = createHash('sha256').update(JSON.stringify({ ...parseProvisioningCommand(command), identity })).digest('hex');
  assert.equal(state.audits[0].request_fingerprint, fingerprint);
});

test('database startup rejects extra/admin memberships, owning and privileged logins in either group', async () => {
  const safe = { rolsuper: false, rolbypassrls: false, rolcreaterole: false, rolcreatedb: false, rolreplication: false,
    group_member: true, group_usable: true, unsafe_memberships: false, owns_app_tables: false };
  for (const group of ['virtual_ink_api', 'virtual_ink_provisioner'] as const) {
    for (const changed of [null, ...Object.keys(safe)]) {
      const flags = { ...safe, ...(changed ? { [changed]: !safe[changed as keyof typeof safe] } : {}) };
      const fixture = memoryDatabase();
      fixture.db.query = async <Row extends Record<string, unknown>>(_sql: string, parameters: readonly SqlParameter[]) => {
        assert.deepEqual(parameters, [group]); return { rows: [flags as unknown as Row], rowCount: 1 };
      };
      if (changed) await assert.rejects(assertDatabaseRole(fixture.db, group));
      else await assertDatabaseRole(fixture.db, group);
    }
  }
});

test('private token input is bounded and rejects multiline, empty and ambiguous input', async () => {
  assert.equal(await readPrivateToken(Readable.from(['synthetic-token\r\n'])), 'synthetic-token');
  for (const value of ['', 'a\nb', 'Bearer secret', 'a'.repeat(8195)]) await assert.rejects(readPrivateToken(Readable.from([value])));
});

test('live smoke target must be loopback with two distinct valid tenant UUIDs', () => {
  const env = { SMOKE_TENANT_ID: tenant, SMOKE_DENIED_TENANT_ID: user };
  assert.equal(smokeSettings(env).origin, 'http://127.0.0.1:3000');
  for (const invalid of [{ ...env, SMOKE_API_URL: 'https://example.com' }, { ...env, SMOKE_API_URL: 'http://user:secret@localhost' },
    { ...env, SMOKE_API_URL: 'http://localhost/path' }, { ...env, SMOKE_DENIED_TENANT_ID: tenant }, {}]) assert.throws(() => smokeSettings(invalid));
});

test('smoke checks five real API expectations and fails on false tenant allowance', async () => {
  const settings = smokeSettings({ SMOKE_TENANT_ID: tenant, SMOKE_DENIED_TENANT_ID: user });
  const calls: string[] = [];
  const fetcher: typeof fetch = async (url, options) => {
    const path = new URL(String(url)).pathname;
    calls.push(path);
    assert.equal(options?.redirect, 'error');
    if (options?.method === 'POST') return new Response(null, { status: 405 });
    if (!new Headers(options?.headers).has('authorization')) return new Response(null, { status: 401 });
    if (path.includes(user)) return new Response(null, { status: 404 });
    return Response.json({ data: path.endsWith('/access') ? { tenantId: tenant, capability: 'tenant.read' } : { userId: user, roles: ['Customer'] } });
  };
  await runAuthSmoke(settings, 'synthetic-token', fetcher);
  assert.equal(calls.length, 5);
  await assert.rejects(runAuthSmoke(settings, 'synthetic-token', async () => Response.json({ data: { userId: user, roles: [], tenantId: tenant, capability: 'tenant.read' } })));
});
