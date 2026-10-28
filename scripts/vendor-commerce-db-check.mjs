// Disposable loopback PostgreSQL only; provider-shaped fixtures, never live funds.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { createCommerceCommands } from '../src/backend/vendors/commerce.ts';
import { createWorkflowCommands } from '../src/backend/orders/workflow.ts';
const connection = { host: '127.0.0.1', port: 54329, user: 'vendor_replay', database: 'postgres', password: process.env.PGPASSWORD, ssl: false, connectionTimeoutMillis: 5000, statement_timeout: 10000 };
const db = new pg.Client(connection);
let checks = 0;
const check = (condition, name) => { assert(condition, name); checks++; };
await db.connect();
try {
  check((await db.query('SELECT rolsuper FROM pg_roles WHERE rolname=current_user')).rows[0].rolsuper, 'disposable administrator only');
  const fixture = await readFile('database/tests/vendor-onboarding-core.sql', 'utf8');
  for (const slug of ['synthetic-commerce-one', 'synthetic-commerce-two']) {
    const ids = new Map();
    const source = fixture.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, value => {
      if (!ids.has(value)) ids.set(value, randomUUID()); return ids.get(value);
    }).replaceAll('synthetic-core-studio', slug).replace(/ROLLBACK;\s*$/, 'COMMIT;');
    await db.query(source);
  }
  const vendors = (await db.query("SELECT v.tenant_id,v.owner_user_id,i.subject,i.issuer FROM virtual_ink.vendor_profiles v JOIN virtual_ink.identities i ON i.user_id=v.owner_user_id WHERE v.slug IN('synthetic-commerce-one','synthetic-commerce-two') ORDER BY v.slug")).rows;
  const actors = {};
  const now = Math.floor(Date.now() / 1000), issuer = vendors[0].issuer;
  await db.query('BEGIN');
  for (const [name, role, vendor] of [['vendor', 'VENDOR', vendors[0]], ['otherVendor', 'VENDOR', vendors[1]], ['customer', 'CUSTOMER'], ['admin', 'SUPER_ADMIN']]) {
    const user = vendor?.owner_user_id ?? randomUUID(), subject = vendor?.subject ?? randomUUID();
    if (!vendor) {
      await db.query('INSERT INTO virtual_ink.users(id) VALUES($1)', [user]);
      await db.query("INSERT INTO virtual_ink.identities(provider,issuer,subject,user_id) VALUES('supabase',$1,$2,$3)", [issuer, subject, user]);
      await db.query("INSERT INTO virtual_ink.provisioning_audits(operation_id,approval_id,reviewer_id,db_actor,action,request_fingerprint,user_id,outcome) VALUES(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),session_user,'create_account',repeat('a',64),$1,'created')", [user]);
    }
    const assignment = randomUUID(), session = randomUUID(), factor = randomUUID();
    await db.query("INSERT INTO virtual_ink_phase1.role_assignments(id,user_id,role,granted_by,approval_reference,reason_code) VALUES($1,$2,$3,$2,gen_random_uuid(),'synthetic_commerce')", [assignment, user, role]);
    await db.query("INSERT INTO virtual_ink_phase1.role_assignment_audits(id,assignment_id,user_id,role,version,action,actor_id,approval_reference,reason_code,request_id) SELECT gen_random_uuid(),id,user_id,role,version,'role.granted',granted_by,approval_reference,reason_code,gen_random_uuid() FROM virtual_ink_phase1.role_assignments WHERE id=$1", [assignment]);
    await db.query('INSERT INTO auth.users VALUES($1,false,to_timestamp($2),NULL,NULL)', [subject, now - 100]);
    await db.query("INSERT INTO auth.sessions VALUES($1,$2,'aal2',$3,NULL)", [session, subject, factor]);
    await db.query("INSERT INTO auth.mfa_factors VALUES($1,$2,'totp','verified',to_timestamp($3))", [factor, subject, now - 100]);
    await db.query("INSERT INTO auth.mfa_amr_claims VALUES($1,'password',to_timestamp($2)),($1,'totp',to_timestamp($3))", [session, now - 10, now - 1]);
    await db.query('INSERT INTO virtual_ink_auth_guard.factor_state VALUES($1,$2,to_timestamp($3))', [subject, factor, now - 1]);
    actors[name] = { user, subject, issuer, sessionId: session, aal: 'aal2', mfaAt: now - 1, primaryAt: now - 10, stepUpAt: now - 1 };
  }
  await db.query("UPDATE virtual_ink_security.configuration SET enabled=true,environment='local',issuer=$1", [issuer]);
  await db.query("UPDATE virtual_ink_auth_guard.settings SET enabled=true,environment='local'; UPDATE virtual_ink_workflow.configuration SET enabled=true,commercial_enabled=true");
  await db.query('COMMIT');
  const executor = client => ({ async query(sql, values) {
    await client.query('SET ROLE virtual_ink_security_service');
    try { return await client.query(sql, values); } finally { await client.query('RESET ROLE'); }
  } });
  const commerce = createCommerceCommands(executor(db), 'local'), workflow = createWorkflowCommands(executor(db), 'local');
  const vendorId = vendors[0].tenant_id;
  const run = async (who, action, extra = {}, patch = {}) => { const result = await commerce.run(action, { vendorId, operationId: randomUUID(), ...extra }, { ...actors[who], ...patch }, randomUUID()); checks++; return result; };
  const deny = async (who, action, extra, code, patch) => { await assert.rejects(run(who, action, extra, patch), { code }); checks++; };
  const priceId = randomUUID();
  const price = { priceId, expectedVersion: 0, service: 'printing', label: 'Synthetic A4 mono side', unit: 'page', amountMinor: 100, currency: 'ZMW' };
  check((await run('vendor', 'read')).policy === null, 'missing policy never becomes zero commission');
  await deny('vendor', 'price.save', price, 'CONFLICT');
  const policyId = randomUUID();
  const insertPolicy = async (id, version, basisPoints) => db.query("INSERT INTO virtual_ink_workflow.commission_policies(id,version,basis_points,terms,terms_sha256,collection,settlement,approved) VALUES($1,$2,$3,$4,encode(sha256(convert_to($4,'UTF8')),'hex'),'direct_to_vendor','weekly',true)", [id, version, basisPoints, 'Synthetic test-only commercial agreement. Direct vendor collection and weekly commission reconciliation.']);
  await insertPolicy(policyId, 1, 500);
  await db.query('UPDATE virtual_ink_workflow.configuration SET commercial_policy_id=$1', [policyId]);
  let read = await run('vendor', 'read');
  check(read.vendors.length === 1 && read.vendors[0].id === vendorId && !read.accepted, 'only current owner scope is disclosed');
  const agreement = { policyId, termsSha256: read.policy.termsSha256, consent: true, operationId: randomUUID() };
  await deny('vendor', 'agreement.accept', { ...agreement, termsSha256: '0'.repeat(64) }, 'CONFLICT');
  await deny('vendor', 'agreement.accept', { ...agreement, consent: false }, 'VALIDATION_FAILED');
  await deny('vendor', 'price.save', price, 'CONFLICT');
  for (const who of ['customer', 'admin']) await deny(who, 'read', {}, 'FORBIDDEN');
  await deny('otherVendor', 'read', {}, 'NOT_FOUND');
  await deny('vendor', 'read', {}, 'UNAUTHENTICATED', { sessionId: randomUUID() });
  await deny('vendor', 'agreement.accept', agreement, 'UNAUTHENTICATED', { aal: 'aal1', mfaAt: null, stepUpAt: null });
  await deny('vendor', 'agreement.accept', agreement, 'UNAUTHENTICATED', { stepUpAt: null });
  const accepted = await run('vendor', 'agreement.accept', agreement);
  check((await run('vendor', 'agreement.accept', agreement)).auditId === accepted.auditId, 'exact agreement retry returns original audit');
  const operationId = randomUUID();
  const saved = await run('vendor', 'price.save', { ...price, operationId });
  check(saved.version === 1, 'first price version saved');
  check((await run('vendor', 'price.save', { ...price, operationId })).auditId === saved.auditId, 'matching price retry is idempotent');
  await deny('vendor', 'price.save', { ...price, operationId, amountMinor: 200 }, 'CONFLICT');
  await deny('vendor', 'price.save', { ...price, amountMinor: 200 }, 'CONFLICT');
  await deny('otherVendor', 'price.save', { ...price, vendorId: vendors[1].tenant_id }, 'CONFLICT');
  const otherPolicy = await run('otherVendor', 'read', { vendorId: vendors[1].tenant_id });
  await run('otherVendor', 'agreement.accept', { vendorId: vendors[1].tenant_id, policyId, termsSha256: otherPolicy.policy.termsSha256, consent: true });
  await deny('otherVendor', 'price.save', { ...price, vendorId: vendors[1].tenant_id }, 'NOT_FOUND');
  // Raw SQL bypasses TypeScript validation to prove independent database checks.
  for (const patch of [{ amountMinor: '100' }, { amountMinor: 1.5 }, { amountMinor: 0 }, { amountMinor: 1000000001 }, { currency: 'USD' }, { service: 'delivery' }, { unit: 'bad' }, { label: '<script>' }, { label: 'x\u202e' }, { expectedVersion: '0' }, { commissionBasisPoints: 0 }, { label: null }]) {
    const badId = randomUUID();
    const result = await executor(db).query('SELECT virtual_ink_workflow.commercial_command($1,$2::jsonb,$3::jsonb) AS result', ['price.save', JSON.stringify({ ...price, priceId: badId, vendorId, operationId: randomUUID(), ...patch }), JSON.stringify({ ...actors.vendor, environment: 'local', correlationId: randomUUID() })]);
    check(result.rows[0].result.error === 'VALIDATION_FAILED' && result.rows[0].result.auditId, 'raw malformed price is denied and audited');
    check((await db.query('SELECT count(*)::int AS n FROM virtual_ink_workflow.price_headers WHERE id=$1', [badId])).rows[0].n === 0, 'malformed price rolls header back');
  }
  await db.query('BEGIN');
  await db.query('UPDATE virtual_ink.memberships SET active=false WHERE user_id=$1', [actors.vendor.user]);
  await deny('vendor', 'read', {}, 'NOT_FOUND');
  await db.query('ROLLBACK');
  const orderId = randomUUID(); let version = 0;
  const orderRun = async (who, action, extra = {}, fixedOperation) => { const result = await workflow.run(action, { orderId, operationId: fixedOperation ?? randomUUID(), expectedVersion: version, ...extra }, actors[who], randomUUID()); version = result.version; checks++; return result; };
  await orderRun('customer', 'order.create', { spec: { productCode: 'synthetic-print', quantity: 1, widthMm: 100, heightMm: 100 } });
  const file = async (who, purpose) => {
    const fileId = randomUUID();
    await orderRun(who, 'file.reserve', { fileId, purpose, mime: 'application/pdf', size: 32 });
    await db.query('SET ROLE virtual_ink_scan_service');
    try { await db.query('SELECT virtual_ink_workflow.record_scan($1,$2,$3,$4,$5,$6,$7)', [fileId, `approved:${randomUUID()}`, 'a'.repeat(64), 'SAFE', 32, 'application/pdf', randomUUID()]); } finally { await db.query('RESET ROLE'); }
    return fileId;
  };
  await file('customer', 'source'); await orderRun('customer', 'order.submit');
  for (const capability of ['order.assign', 'payment.confirm']) await db.query('INSERT INTO virtual_ink_workflow.grants VALUES(gen_random_uuid(),$1,$2,$3,\'synthetic_commerce\',gen_random_uuid(),clock_timestamp()+interval \'5 minutes\',clock_timestamp())', [actors.admin.user, orderId, capability]);
  await orderRun('admin', 'order.assign', { vendorId });
  await orderRun('vendor', 'quote.propose', { amountMinor: 10000, currency: 'ZMW', validUntil: new Date(Date.now() + 3600000).toISOString() });
  const storedQuoteId = (await db.query('SELECT quote_id FROM virtual_ink_workflow.orders WHERE id=$1', [orderId])).rows[0].quote_id;
  const quoteTerms = (await db.query('SELECT * FROM virtual_ink_workflow.quote_commercial_terms WHERE quote_id=$1', [storedQuoteId])).rows[0];
  check(quoteTerms.commission_minor === '500' && quoteTerms.policy_id === policyId, 'quote fee is server-calculated and frozen');
  const nextPolicy = randomUUID(); await insertPolicy(nextPolicy, 2, 700);
  await db.query('UPDATE virtual_ink_workflow.configuration SET commercial_policy_id=$1', [nextPolicy]);
  await deny('vendor', 'agreement.accept', agreement, 'CONFLICT');
  await deny('vendor', 'price.save', { ...price, expectedVersion: 1 }, 'CONFLICT');
  read = await run('vendor', 'read');
  check(read.policy.basisPoints === 700 && !read.accepted, 'new policy requires new acceptance');
  await run('vendor', 'agreement.accept', { policyId: nextPolicy, termsSha256: read.policy.termsSha256, consent: true });
  await db.query('REVOKE INSERT ON virtual_ink_workflow.commercial_events FROM virtual_ink_workflow_owner');
  try { await deny('vendor', 'price.save', { ...price, expectedVersion: 1 }, 'AUDIT_UNAVAILABLE'); }
  finally { await db.query('GRANT INSERT ON virtual_ink_workflow.commercial_events TO virtual_ink_workflow_owner'); }
  check((await db.query('SELECT count(*)::int AS n FROM virtual_ink_workflow.price_versions WHERE price_id=$1', [priceId])).rows[0].n === 1, 'commercial audit outage rolls price update back');
  const peer = new pg.Client(connection); await peer.connect();
  try {
    const concurrent = await Promise.allSettled([run('vendor', 'price.save', { ...price, expectedVersion: 1, amountMinor: 200 }), createCommerceCommands(executor(peer), 'local').run('price.save', { ...price, vendorId, operationId: randomUUID(), expectedVersion: 1, amountMinor: 300 }, actors.vendor, randomUUID())]);
    check(concurrent.filter(r => r.status === 'fulfilled').length === 1 && concurrent.some(r => r.status === 'rejected' && r.reason.code === 'CONFLICT'), 'concurrent price edits serialize without lost update');
  } finally { await peer.end(); }
  await run('vendor', 'price.retire', { priceId, expectedVersion: 2 });
  check(!(await run('vendor', 'read')).prices[0].active, 'retirement appends a historical version');
  await orderRun('customer', 'quote.accept');
  await orderRun('admin', 'payment.confirm', { evidenceReference: randomUUID() });
  check((await db.query('SELECT count(*)::int AS n FROM virtual_ink_workflow.commission_accruals WHERE order_id=$1', [orderId])).rows[0].n === 0, 'direct payment does not imply completion or commission collection');
  await orderRun('admin', 'order.assign', { vendorId }); await orderRun('vendor', 'job.accept'); await orderRun('vendor', 'proof.request');
  const proof = await file('vendor', 'proof');
  await orderRun('vendor', 'proof.upload', { fileId: proof });
  const proofId = (await db.query('SELECT proof_id FROM virtual_ink_workflow.orders WHERE id=$1', [orderId])).rows[0].proof_id;
  await orderRun('customer', 'proof.respond', { proofId, approve: true });
  await orderRun('vendor', 'production.queue'); await orderRun('vendor', 'production.start');
  for (const stage of ['printing', 'finishing', 'packing']) { const evidence = await file('vendor', 'evidence'); await orderRun('vendor', 'production.evidence', { fileId: evidence, stage }); }
  await orderRun('vendor', 'production.finish'); await orderRun('vendor', 'qc.record', { passed: true, checks: { artwork: true, quantity: true, finish: true }, reasonCode: 'synthetic_commerce' });
  await orderRun('vendor', 'order.ready', { handoff: 'collection' });
  await db.query('REVOKE INSERT ON virtual_ink_workflow.events FROM virtual_ink_workflow_owner');
  try { await assert.rejects(orderRun('customer', 'order.complete'), { code: 'AUDIT_UNAVAILABLE' }); checks++; }
  finally { await db.query('GRANT INSERT ON virtual_ink_workflow.events TO virtual_ink_workflow_owner'); }
  check((await db.query('SELECT count(*)::int AS n FROM virtual_ink_workflow.commission_accruals WHERE order_id=$1', [orderId])).rows[0].n === 0, 'workflow audit outage rolls accrual back');
  await orderRun('customer', 'order.complete');
  check((await run('vendor', 'read')).accruedCommissionMinor === 500, 'completed order accrues original 5 percent after policy becomes 7 percent');
  await assert.rejects(db.query('UPDATE virtual_ink_workflow.quote_commercial_terms SET commission_minor=0 WHERE quote_id=$1', [storedQuoteId]), { code: '23514' }); checks++;
  for (const table of ['commission_policies', 'vendor_agreements', 'price_headers', 'price_versions', 'quote_commercial_terms', 'commission_accruals', 'commercial_events']) {
    for (const role of ['anon', 'authenticated', 'service_role', 'virtual_ink_security_service']) check(!(await db.query('SELECT has_table_privilege($1,$2,\'SELECT,INSERT,UPDATE,DELETE,TRUNCATE\') AS allowed', [role, `virtual_ink_workflow.${table}`])).rows[0].allowed, 'runtime/browser roles have no direct commercial table privileges');
    check((await db.query('SELECT relrowsecurity AND relforcerowsecurity AS forced FROM pg_class WHERE oid=$1::regclass', [`virtual_ink_workflow.${table}`])).rows[0].forced, 'commercial RLS forced');
  }
  for (const role of ['anon', 'authenticated', 'service_role']) check(!(await db.query("SELECT has_function_privilege($1,'virtual_ink_workflow.commercial_command(text,jsonb,jsonb)','EXECUTE') AS allowed", [role])).rows[0].allowed, 'no browser commercial command privilege');
  await db.query('UPDATE virtual_ink_workflow.limits SET attempts=120,window_at=clock_timestamp() WHERE actor_id=$1', [actors.vendor.user]);
  await deny('vendor', 'read', {}, 'RATE_LIMITED');
  await db.query('UPDATE virtual_ink_workflow.configuration SET commercial_enabled=false');
  await deny('vendor', 'read', {}, 'IDENTITY_UNAVAILABLE');
  console.log(JSON.stringify({ check: 'vendor_commercial_sql', status: 'pass', checks, limits: 'Disposable SQL and provider-shaped sessions; synthetic scan/payment evidence. No hosted Auth, live funds, settlement or human agreement.' }));
} finally { await db.query('ROLLBACK').catch(() => {}); await db.end(); }
