import assert from 'node:assert/strict';
import test from 'node:test';
import { loadPhase1Actor } from '../src/backend/identity/phase1-context.ts';
import { accessResponse } from '../src/backend/identity/routes.ts';
import { createSupabaseIdentityVerifier } from '../src/backend/identity/supabase.ts';
import type { SqlDatabase, SqlExecutor, SqlParameter } from '../src/backend/database/ports.ts';
import { permitsPhase1 } from '../src/backend/permissions/phase1.ts';

const userId = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
const projectUrl = 'https://odgxcuwueessxfsoveza.supabase.co';
const identity = { provider: 'supabase' as const, issuer: `${projectUrl}/auth/v1`, subject: userId };
type Scenario = { roles?: unknown[]; mapping?: boolean; active?: boolean; vendor?: boolean; fail?: boolean };
function fixture(scenario: Scenario = {}) {
  const calls: { sql: string; parameters: readonly SqlParameter[] }[] = [];
  let rollbacks = 0;
  const query: SqlExecutor['query'] = async <Row extends Record<string, unknown>>(sql: string, parameters: readonly SqlParameter[]) => {
    calls.push({ sql, parameters });
    let rows: Record<string, unknown>[] = [];
    if (scenario.fail) throw new Error('synthetic database failure');
    if (sql.startsWith('SELECT user_id FROM virtual_ink.identities')) rows = scenario.mapping === false ? [] : [{ user_id: userId }];
    else if (sql.startsWith('SELECT id, active')) rows = scenario.active === false ? [] : [{ id: userId, active: true }];
    else if (sql.startsWith('SELECT role')) rows = (scenario.roles ?? ['Customer']).map(role => ({ role }));
    else if (sql.startsWith('SELECT user_id FROM virtual_ink.memberships')) rows = scenario.vendor ? [{ user_id: userId }] : [];
    return { rows: rows as Row[], rowCount: rows.length };
  };
  const database: SqlDatabase = { query, close: async () => {}, async transaction(work) {
    try { return await work({ query }); } catch (error) { rollbacks++; throw error; }
  } };
  return { database, calls, rollbacks: () => rollbacks };
}

test('Phase 1 actor loads current trusted rows, clears prior scope and carries no delegated authority', async () => {
  for (const [legacyRole, phase1Role] of [['Customer', 'CUSTOMER'], ['DeliveryPartner', 'DELIVERY_PARTNER']]) {
    const f = fixture({ roles: [legacyRole] });
    const actor = await f.database.transaction(tx => loadPhase1Actor(tx, identity));
    assert.deepEqual(actor, { userId, active: true, roles: [phase1Role], organizationIds: [],
      activeVendorAssignment: false, activeDesignerAssignment: false, assignedDeliveryPartner: false,
      aal: 'aal1', grants: [] });
    assert.ok(Object.isFrozen(actor) && Object.isFrozen(actor.roles) && Object.isFrozen(actor.organizationIds) && Object.isFrozen(actor.grants));
    assert.match(f.calls[0].sql, /app.user_id.*\n.*app.tenant_id.*app.access_mode/);
    for (const call of f.calls) assert.ok(!call.sql.includes(userId), 'Identity stays parameterized');
    const resource = { id: otherId, ownerUserId: userId, organizationMembershipActive: false,
      vendorVerified: false, assignedDesignerIds: [], fileIsActive: true, fileApproved: true,
      paymentRequired: false, paymentConfirmed: false, proofRequired: false,
      proofApproved: false, proofIsLatest: false, isNew: true };
    assert.equal(permitsPhase1('order.create', { actor, resource, now: 1 }), legacyRole === 'Customer');
    assert.equal(permitsPhase1('order.read', { actor, resource: { ...resource, ownerUserId: otherId }, now: 1 }), false);
    assert.equal(permitsPhase1('identity.manage', { actor, resource, now: 1 }), false);
    assert.equal(permitsPhase1('file.download', { actor, resource: { ...resource, fileStatus: 'SAFE', filePurpose: 'production' }, now: 1 }), false);
    if (legacyRole === 'Customer') {
      assert.match(f.calls.at(-2)!.sql, /user_id = \$1 AND active LIMIT 1/);
      assert.deepEqual(f.calls.at(-2)!.parameters, [userId]);
      assert.match(f.calls.at(-1)!.sql, /app.access_mode', ''/);
    } else assert.ok(!f.calls.some(call => call.sql.includes('FROM virtual_ink.memberships')));
  }
});

test('Phase 1 context denies unmapped, suspended, missing, mixed, vendor and unsupported role facts', async () => {
  for (const scenario of [{ mapping: false }, { active: false }, { roles: [] },
    { roles: ['Customer', 'DeliveryPartner'] }, { roles: ['Customer', 'Customer'] },
    { roles: ['PlatformOperator'] }, { roles: ['ADMIN'] }, { roles: [null] }, { vendor: true }]) {
    const f = fixture(scenario);
    await assert.rejects(f.database.transaction(tx => loadPhase1Actor(tx, identity)), { code: 'FORBIDDEN' });
    assert.equal(f.rollbacks(), 1);
  }
  const failed = fixture({ fail: true });
  await assert.rejects(failed.database.transaction(tx => loadPhase1Actor(tx, identity)), /database failure/);
});

test('context is loaded again after suspension or role revocation; no actor cache survives requests', async () => {
  const scenario: Scenario = {};
  const f = fixture(scenario);
  await f.database.transaction(tx => loadPhase1Actor(tx, identity));
  scenario.active = false;
  await assert.rejects(f.database.transaction(tx => loadPhase1Actor(tx, identity)), { code: 'FORBIDDEN' });
  scenario.active = true; scenario.roles = [];
  await assert.rejects(f.database.transaction(tx => loadPhase1Actor(tx, identity)), { code: 'FORBIDDEN' });
});

test('HTTP rejects provider suspension/deletion and malformed ban state before querying application data', async () => {
  const headers = { Authorization: 'Bearer synthetic-token', 'x-role': 'SUPER_ADMIN' };
  for (const state of [{ banned_until: '2099-01-01T00:00:00Z' }, { banned_until: 'invalid' },
    { banned_until: '' }, { banned_until: true }, { banned_until: {} },
    { deleted_at: '2000-01-01T00:00:00Z' }, { deleted_at: '' }]) {
    const f = fixture();
    const verifier = createSupabaseIdentityVerifier({ projectUrl, publishableKey: 'sb_publishable_synthetic' },
      async () => Response.json({ id: userId, is_anonymous: false, user_metadata: { role: 'SUPER_ADMIN' }, ...state }));
    const response = await accessResponse(new Request('http://localhost/api/v1/me', { headers }), { verifier, database: f.database });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, 'UNAUTHENTICATED');
    assert.equal(f.calls.length, 0);
  }
  for (const banned_until of [undefined, null, '2000-01-01T00:00:00Z']) {
    const verifier = createSupabaseIdentityVerifier({ projectUrl, publishableKey: 'sb_publishable_synthetic' },
      async () => Response.json({ id: userId, is_anonymous: false, banned_until, deleted_at: null }));
    assert.deepEqual(await verifier.verify('synthetic-token'), identity);
  }
});

test('HTTP denies suspended or unmapped application users despite a valid provider identity and forged role headers', async () => {
  for (const scenario of [{ mapping: false }, { active: false }]) {
    const f = fixture(scenario);
    const response = await accessResponse(new Request('http://localhost/api/v1/me', {
      headers: { Authorization: 'Bearer synthetic-token', 'x-role': 'SUPER_ADMIN', 'x-user-id': otherId },
    }), { verifier: { async verify() { return identity; } }, database: f.database });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error.code, 'FORBIDDEN');
    assert.equal(f.rollbacks(), 1);
  }
});
