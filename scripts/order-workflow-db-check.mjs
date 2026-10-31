// Disposable PostgreSQL with provider-shaped session fixtures. NOT genuine Auth.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { createWorkflowCommands } from '../src/backend/orders/workflow.ts';
import { createDashboardQueries } from '../src/backend/orders/dashboard.ts';
import { createWorkflowFileWorker, downloadWorkflowFile, copyApprovedProductionFile } from '../src/backend/storage/workflow-files.ts';
import { createPrivateS3Store } from '../src/backend/storage/s3-private-store.ts';
import { createClamAvScanner } from '../src/backend/storage/clamav.ts';
const db = new pg.Client({ host: '127.0.0.1', port: 54329, user: 'vendor_replay', database: 'postgres',
  password: process.env.PGPASSWORD, ssl: false, connectionTimeoutMillis: 5000, statement_timeout: 10000 });
let checks = 0;
const check = (value, name) => { assert(value, name); checks++; };
await db.connect();
try {
  check((await db.query("SELECT rolsuper FROM pg_roles WHERE rolname=current_user")).rows[0].rolsuper, 'disposable administrator');
  // Reuse the reviewed real vendor command fixture; commit only in this disposable
  // cluster so workflow tests can prove current verified vendor membership.
  const vendorFixture = await readFile('database/tests/vendor-onboarding-core.sql', 'utf8');
  assert.match(vendorFixture, /ROLLBACK;\s*$/);
  await db.query(vendorFixture.replace(/ROLLBACK;\s*$/, 'COMMIT;'));
  const vendorRow = (await db.query("SELECT p.tenant_id,p.owner_user_id,i.subject,i.issuer FROM virtual_ink.vendor_profiles p JOIN virtual_ink.identities i ON i.user_id=p.owner_user_id WHERE p.slug='synthetic-core-studio'")).rows[0];
  const issuer = vendorRow.issuer, current = Math.floor(Date.now() / 1000);
  const actors = {};
  await db.query('BEGIN');
  for (const [name, role] of [['customer', 'CUSTOMER'], ['other', 'CUSTOMER'], ['admin', 'SUPER_ADMIN'], ['vendor', 'VENDOR'], ['delivery', 'DELIVERY_PARTNER']]) {
    const user = name === 'vendor' ? vendorRow.owner_user_id : randomUUID();
    const subject = name === 'vendor' ? vendorRow.subject : randomUUID();
    if (name !== 'vendor') {
      await db.query('INSERT INTO virtual_ink.users(id) VALUES($1)', [user]);
      await db.query("INSERT INTO virtual_ink.identities(provider,issuer,subject,user_id) VALUES('supabase',$1,$2,$3)", [issuer, subject, user]);
      await db.query("INSERT INTO virtual_ink.provisioning_audits(operation_id,approval_id,reviewer_id,db_actor,action,request_fingerprint,user_id,outcome) VALUES(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),session_user,'create_account',repeat('a',64),$1,'created')", [user]);
    }
    const assignment = randomUUID(), session = randomUUID(), factor = randomUUID();
    await db.query("INSERT INTO virtual_ink_phase1.role_assignments(id,user_id,role,granted_by,approval_reference,reason_code) VALUES($1,$2,$3,$2,gen_random_uuid(),'synthetic_workflow')", [assignment, user, role]);
    await db.query("INSERT INTO virtual_ink_phase1.role_assignment_audits(id,assignment_id,user_id,role,version,action,actor_id,approval_reference,reason_code,request_id) SELECT gen_random_uuid(),id,user_id,role,version,'role.granted',granted_by,approval_reference,reason_code,gen_random_uuid() FROM virtual_ink_phase1.role_assignments WHERE id=$1", [assignment]);
    await db.query('INSERT INTO auth.users VALUES($1,false,to_timestamp($2),NULL,NULL)', [subject, current - 100]);
    await db.query("INSERT INTO auth.sessions VALUES($1,$2,'aal2',$3,NULL)", [session, subject, factor]);
    await db.query("INSERT INTO auth.mfa_factors VALUES($1,$2,'totp','verified',to_timestamp($3))", [factor, subject, current - 100]);
    await db.query("INSERT INTO auth.mfa_amr_claims VALUES($1,'password',to_timestamp($2)),($1,'totp',to_timestamp($3))", [session, current - 10, current - 1]);
    await db.query('INSERT INTO virtual_ink_auth_guard.factor_state VALUES($1,$2,to_timestamp($3))', [subject, factor, current - 1]);
    actors[name] = { user, subject, issuer, sessionId: session, aal: 'aal2', mfaAt: current - 1, primaryAt: current - 10, stepUpAt: current - 1 };
  }
  await db.query("UPDATE virtual_ink_security.configuration SET enabled=true,environment='local',issuer=$1", [issuer]);
  await db.query("UPDATE virtual_ink_auth_guard.settings SET enabled=true,environment='local'; UPDATE virtual_ink_workflow.configuration SET enabled=true");
  const receiptPolicy = randomUUID(), receiptRecipient = randomUUID();
  const syntheticTerms = 'Synthetic SQL fixture only. Direct vendor payment with separately reconciled commission.';
  await db.query("INSERT INTO virtual_ink_workflow.commission_policies(id,version,basis_points,terms,terms_sha256,collection,settlement,approved) VALUES($1,10001,500,$2,encode(sha256(convert_to($2,'UTF8')),'hex'),'direct_to_vendor','weekly',true)", [receiptPolicy, syntheticTerms]);
  await db.query('INSERT INTO virtual_ink_workflow.vendor_agreements(vendor_id,policy_id,actor_id,session_id) VALUES($1,$2,$3,$4)', [vendorRow.tenant_id, receiptPolicy, actors.vendor.user, actors.vendor.sessionId]);
  await db.query("INSERT INTO virtual_ink_workflow.manual_payment_recipients(id,vendor_id,method,provider_code,account_sha256,currency,approval_reference,enabled) VALUES($1,$2,'bank_transfer','synthetic_workflow_bank',repeat('b',64),'ZMW',gen_random_uuid(),true)", [receiptRecipient, vendorRow.tenant_id]);
  await db.query('UPDATE virtual_ink_workflow.configuration SET commercial_enabled=true,commercial_policy_id=$1,manual_payments_enabled=true', [receiptPolicy]);
  await db.query('COMMIT');
  const orderId = randomUUID();
  let version = 0;
  const commands = createWorkflowCommands({ async query(sql, values) {
    await db.query('SET ROLE virtual_ink_security_service');
    try { return await db.query(sql, values); } finally { await db.query('RESET ROLE'); }
  } }, 'local');
  const run = async (actor, action, extra = {}, patch = {}) => {
    const result = await commands.run(action, { orderId, operationId: randomUUID(), expectedVersion: version, ...extra }, { ...actors[actor], ...patch }, randomUUID());
    version = result.version; checks++; return result;
  };
  const deny = async (actor, action, extra = {}, code = 'CONFLICT', patch = {}) => {
    await assert.rejects(run(actor, action, extra, patch), error => error.code === code); checks++;
  };
  const result = await run('customer', 'order.create', { spec: { productCode: 'cotton-t-shirt', quantity: 10, widthMm: 100, heightMm: 150 } });
  check(result.state === 'DRAFT', 'draft created');
  const dashboard=createDashboardQueries({async query(sql,values){await db.query('SET ROLE virtual_ink_security_service');try{return await db.query(sql,values);}finally{await db.query('RESET ROLE');}}},'local');
  const readDashboard=(actor,input={},patch={})=>dashboard.read({view:actor==='admin'?'admin':actor==='vendor'?'vendor':'customer',...input},{...actors[actor],...patch},randomUUID());
  check((await readDashboard('customer')).summary.total===1,'customer total comes from own stored orders');
  check((await readDashboard('other')).summary.total===0,'other customer cannot infer owner orders');
  check((await readDashboard('vendor')).orders.length===0,'vendor has no unassigned queue');
  check((await readDashboard('admin')).summary.total===1,'fresh MFA administrator oversight');
  check((await readDashboard('customer',{orderId})).detail.id===orderId,'own order detail');
  check(!(JSON.stringify(await readDashboard('admin',{orderId}))).includes('objectVersion'),'dashboard omits private storage bindings');
  for(const [actor,input,code,patch] of [
    ['customer',{view:'admin'},'FORBIDDEN',{}],['vendor',{view:'customer'},'FORBIDDEN',{}],
    ['admin',{},'UNAUTHENTICATED',{aal:'aal1',mfaAt:null,stepUpAt:null}],['admin',{},'UNAUTHENTICATED',{stepUpAt:null}],
    ['other',{orderId},'NOT_FOUND',{}],['other',{cursor:orderId},'NOT_FOUND',{}],['customer',{},'UNAUTHENTICATED',{sessionId:randomUUID()}],
  ]){await assert.rejects(readDashboard(actor,input,patch),{code});checks++;}
  await deny('other', 'order.read', {}, 'NOT_FOUND');
  await deny('delivery', 'order.read', {}, 'NOT_FOUND');
  await deny('customer', 'order.submit');
  await deny('customer', 'order.read', { roles: ['SUPER_ADMIN'] }, 'VALIDATION_FAILED');
  await deny('customer', 'order.read', {}, 'UNAUTHENTICATED', { sessionId: randomUUID() });
  const realStorage = process.env.LOCAL_S3_WORKFLOW_CHECK === 'true';
  const s3 = realStorage ? createPrivateS3Store(JSON.parse(await readFile('.private/workflow-s3-check.json', 'utf8'))) : undefined;
  const scanner = createClamAvScanner({ host: '127.0.0.1', port: 33310, maxBytes: 26214400, timeoutMs: 30000, concurrency: 1 });
  const workerDb = { async query(sql, values) {
    await db.query('SET ROLE virtual_ink_scan_service');
    try { return await db.query(sql, values); } finally { await db.query('RESET ROLE'); }
  } };
  const fileBytes = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n');
  const scannedFile = async (actor, purpose) => {
    const fileId = randomUUID();
    await run(actor, 'file.reserve', { fileId, purpose, mime: 'application/pdf', size: realStorage ? fileBytes.length : 32 });
    if (s3) {
      const receipt = await createWorkflowFileWorker(workerDb, s3, scanner).ingest(fileId, fileBytes, randomUUID());
      assert.equal(receipt.status, 'SAFE');
    } else await workerDb.query('SELECT virtual_ink_workflow.record_scan($1,$2,$3,$4,$5,$6,$7)', [fileId, `approved:${randomUUID()}`, 'a'.repeat(64), 'SAFE', 32, 'application/pdf', randomUUID()]);
    checks++; return fileId;
  };
  const sourceFile = await scannedFile('customer', 'source');
  if (s3) {
    const download = await downloadWorkflowFile(commands, s3, actors.customer, { orderId, fileId: sourceFile, operationId: randomUUID() }, randomUUID());
    check(Buffer.from(await download.arrayBuffer()).equals(fileBytes), 'actual S3 and scanner hash-bound download');
    const ref = { fileId: sourceFile, orderId, purpose: 'source', mime: 'application/pdf', size: fileBytes.length };
    await assert.rejects(s3.put(ref, fileBytes), { code: 'CONFLICT' }); checks++;
    await assert.rejects(s3.read(ref, 'approved:"wrong"'), { code: 'CONFLICT' }); checks++;
    const config = JSON.parse(await readFile('.private/workflow-s3-check.json', 'utf8'));
    const anonymous = await fetch(`${config.endpoint}/${config.buckets.source}/orders/${orderId}/source/${sourceFile}`);
    check(anonymous.status === 403, 'real S3 anonymous private object denial'); await anonymous.body?.cancel();
    const rawEicar = Buffer.from('WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=', 'base64');
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R /Names << /EmbeddedFiles << /Names [(eicar.com) 4 0 R] >> >> >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 72 72] /Resources << >> >>',
      '<< /Type /Filespec /F (eicar.com) /EF << /F 5 0 R >> >>',
      `<< /Type /EmbeddedFile /Length ${rawEicar.length} >>\nstream\n${rawEicar.toString('ascii')}\nendstream`,
    ];
    let document = '%PDF-1.7\n'; const offsets = [];
    for (const [index, object] of objects.entries()) { offsets.push(Buffer.byteLength(document)); document += `${index + 1} 0 obj\n${object}\nendobj\n`; }
    const xref = Buffer.byteLength(document);
    document += `xref\n0 6\n0000000000 65535 f \n${offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    const malwarePdf = Buffer.from(document), rejectedFile = randomUUID();
    await run('customer', 'file.reserve', { fileId: rejectedFile, purpose: 'source', mime: 'application/pdf', size: malwarePdf.length });
    const rejected = await createWorkflowFileWorker(workerDb, s3, scanner).ingest(rejectedFile, malwarePdf, randomUUID());
    check(rejected.status === 'REJECTED', 'real scanner positive stays in quarantine');
    await deny('customer', 'file.access', { fileId: rejectedFile }, 'NOT_FOUND');
  }
  const pendingSource = randomUUID();
  await run('customer', 'file.reserve', { fileId: pendingSource, purpose: 'source', mime: 'application/pdf', size: 32 });
  await run('customer', 'order.submit');
  const late = await workerDb.query('SELECT virtual_ink_workflow.record_scan($1,$2,$3,$4,$5,$6,$7) AS result', [pendingSource, 'approved:synthetic-late-receipt', 'b'.repeat(64), 'SAFE', 32, 'application/pdf', randomUUID()]);
  check(late.rows[0].result.status === 'REVIEW_REQUIRED', 'late source scan cannot replace submitted content');
  check((await db.query('SELECT source_file_id FROM virtual_ink_workflow.orders WHERE id=$1', [orderId])).rows[0].source_file_id === sourceFile, 'submitted source frozen');
  await deny('vendor', 'order.assign', { vendorId: vendorRow.tenant_id }, 'UNAUTHENTICATED', { aal: 'aal1' });
  await deny('admin', 'order.assign', { vendorId: vendorRow.tenant_id }, 'FORBIDDEN');
  for (const capability of ['order.assign', 'payment.confirm', 'delivery.assign']) await db.query("INSERT INTO virtual_ink_workflow.grants VALUES(gen_random_uuid(),$1,$2,$3,'synthetic_review',gen_random_uuid(),clock_timestamp()+interval '1 hour',clock_timestamp())", [actors.admin.user, orderId, capability]);
  await run('admin', 'order.assign', { vendorId: vendorRow.tenant_id });
  await run('vendor', 'quote.propose', { amountMinor: 150000, currency: 'ZMW', validUntil: new Date(Date.now() + 3600000).toISOString() });
  await run('customer', 'quote.review');
  const acceptanceInput = { orderId, operationId: randomUUID(), expectedVersion: version };
  const accepted = await commands.run('quote.accept', acceptanceInput, actors.customer, randomUUID()); version = accepted.version;
  const replay = await commands.run('quote.accept', acceptanceInput, actors.customer, randomUUID());
  check(replay.version === accepted.version && replay.auditId === accepted.auditId, 'idempotent acceptance');
  await assert.rejects(commands.run('quote.accept', { ...acceptanceInput, expectedVersion: 1 }, actors.customer, randomUUID()), { code: 'CONFLICT' }); checks++;
  await deny('vendor', 'production.start');
  const reviewedPayment = { evidenceReference: randomUUID(), recipientId: receiptRecipient, receiptReference: 'SyntheticWorkflowReceipt0001', amountMinor: 150000, currency: 'ZMW', receiptChecked: true };
  await deny('admin', 'payment.confirm', reviewedPayment, 'UNAUTHENTICATED', { stepUpAt: null });
  await run('admin', 'payment.confirm', reviewedPayment);
  await run('admin', 'order.assign', { vendorId: vendorRow.tenant_id });
  await run('vendor', 'job.accept');
  await run('vendor', 'proof.request');
  await deny('vendor', 'production.start');
  const firstFile = await scannedFile('vendor', 'proof');
  const firstProof = (await run('vendor', 'proof.upload', { fileId: firstFile })).proofId;
  const staleAccess = { orderId, fileId: firstFile, operationId: randomUUID() };
  await commands.run('file.access', staleAccess, actors.customer, randomUUID());
  await deny('vendor', 'proof.respond', { proofId: firstProof, approve: true });
  await run('customer', 'proof.respond', { proofId: firstProof, approve: false, reasonCode: 'adjust_alignment' });
  const latestFile = await scannedFile('vendor', 'proof');
  const latestProof = (await run('vendor', 'proof.upload', { fileId: latestFile })).proofId;
  await deny('customer', 'proof.respond', { proofId: firstProof, approve: true });
  await deny('customer', 'file.access', { fileId: firstFile }, 'NOT_FOUND');
  await deny('vendor', 'file.access', { fileId: firstFile }, 'NOT_FOUND');
  await assert.rejects(commands.run('file.access', staleAccess, actors.customer, randomUUID()), { code: 'NOT_FOUND' }); checks++;
  await run('customer', 'proof.respond', { proofId: latestProof, approve: true });
  if(s3) {
    const production = await copyApprovedProductionFile(workerDb, s3, scanner, orderId, randomUUID());
    check(production.status === 'SAFE', 'approved proof copied into isolated production storage');
    const printFile = await downloadWorkflowFile(commands, s3, actors.vendor, { orderId, fileId: production.fileId, operationId: randomUUID() }, randomUUID());
    check(Buffer.from(await printFile.arrayBuffer()).equals(fileBytes), 'assigned vendor downloads only approved production bytes');
    await deny('vendor', 'file.access', { fileId: sourceFile }, 'NOT_FOUND');
  }
  await run('vendor', 'production.queue');
  await run('vendor', 'production.start');
  await deny('vendor', 'production.finish');
  const evidence = async () => { for (const stage of ['printing', 'finishing', 'packing']) await run('vendor', 'production.evidence', { fileId: await scannedFile('vendor', 'evidence'), stage }); };
  await evidence();
  await run('vendor', 'production.finish');
  await deny('vendor', 'qc.record', { passed: true, checks: { artwork: true }, reasonCode: 'synthetic_qc' });
  await run('vendor', 'qc.record', { passed: false, checks: { artwork: false }, reasonCode: 'print_defect' });
  await deny('vendor', 'order.ready', { handoff: 'collection' });
  await run('vendor', 'production.correct');
  await deny('vendor', 'production.finish');
  await evidence();
  await run('vendor', 'production.finish');
  await run('vendor', 'qc.record', { passed: true, checks: { artwork: true, quantity: true, finish: true }, reasonCode: 'synthetic_qc' });
  await deny('vendor', 'order.ready', { handoff: 'delivery', deliveryUserId: actors.delivery.user }, 'VALIDATION_FAILED');
  await deny('vendor', 'order.ready', { handoff: 'delivery' }, 'VALIDATION_FAILED');
  await run('admin', 'delivery.assign', { deliveryUserId: actors.delivery.user });
  await run('vendor', 'order.ready', { handoff: 'delivery' });
  const delivery = await run('delivery', 'order.read');
  check(!('spec' in delivery) && !('quote' in delivery) && !('proofId' in delivery), 'delivery projection');
  await deny('delivery', 'file.access', { fileId: latestFile });
  check((await run('delivery', 'order.complete')).state === 'COMPLETED', 'delivery completes after QC');
  check((await run('customer', 'order.dispute', { reasonCode: 'synthetic_dispute' })).state === 'DISPUTED', 'customer dispute');
  const page = await run('customer', 'order.timeline', { limit: 2 });
  check(page.timeline.length === 2 && page.nextCursor, 'bounded order timeline');
  const nextPage = await run('customer', 'order.timeline', { limit: 2, cursor: page.nextCursor });
  check(!nextPage.timeline.some(event => page.timeline.some(previous => previous.id === event.id)), 'timeline pages do not overlap');
  await deny('customer', 'order.timeline', { cursor: randomUUID() }, 'NOT_FOUND');
  await db.query('SET ROLE virtual_ink_security_service');
  for (const sql of ['SELECT * FROM virtual_ink_workflow.files', "UPDATE virtual_ink_workflow.orders SET state='COMPLETED'", 'DELETE FROM virtual_ink_workflow.events']) {
    await assert.rejects(db.query(sql), { code: '42501' }); checks++;
  }
  await db.query('RESET ROLE');
  await assert.rejects(db.query("UPDATE virtual_ink_workflow.proofs SET sha256=repeat('b',64)"), { code: '23514' }); checks++;
  const raceOrder = randomUUID();
  await commands.run('order.create', { ...inputForRace(raceOrder), spec: { productCode: 'synthetic', quantity: 1, widthMm: 1, heightMm: 1 } }, actors.customer, randomUUID()); checks++;
  async function competitor(input) {
    const connection = new pg.Client({ host: '127.0.0.1', port: 54329, user: 'vendor_replay', database: 'postgres', password: process.env.PGPASSWORD, ssl: false });
    await connection.connect();
    try { await connection.query('SET ROLE virtual_ink_security_service'); return await createWorkflowCommands(connection, 'local').run('order.cancel', input, actors.customer, randomUUID()); }
    finally { await connection.end(); }
  }
  function inputForRace(orderId) { return { orderId, operationId: randomUUID(), expectedVersion: 0 }; }
  const races = await Promise.allSettled([competitor({ ...inputForRace(raceOrder), expectedVersion: 1 }), competitor({ ...inputForRace(raceOrder), expectedVersion: 1 })]);
  check(races.filter(row => row.status === 'fulfilled').length === 1 && races.filter(row => row.status === 'rejected' && row.reason.code === 'CONFLICT').length === 1, 'true concurrent transition is serialized');
  const readInput = { orderId, operationId: randomUUID(), expectedVersion: version };
  await commands.run('order.read', readInput, actors.customer, randomUUID());
  const auditOrder = randomUUID();
  await commands.run('order.create', { ...inputForRace(auditOrder), spec: { productCode: 'synthetic', quantity: 1, widthMm: 1, heightMm: 1 } }, actors.customer, randomUUID());
  await db.query('REVOKE INSERT ON virtual_ink_workflow.events FROM virtual_ink_workflow_owner');
  try { await assert.rejects(commands.run('order.cancel', { orderId: auditOrder, operationId: randomUUID(), expectedVersion: 1 }, actors.customer, randomUUID()), { code: 'AUDIT_UNAVAILABLE' }); checks++;
    await assert.rejects(readDashboard('customer'),{code:'AUDIT_UNAVAILABLE'});checks++;
  }
  finally { await db.query('GRANT INSERT ON virtual_ink_workflow.events TO virtual_ink_workflow_owner'); }
  check((await db.query('SELECT state FROM virtual_ink_workflow.orders WHERE id=$1', [auditOrder])).rows[0].state === 'DRAFT', 'audit outage rolls mutation back');
  check((await db.query("SELECT count(*)::int AS count FROM virtual_ink_workflow.events WHERE order_id=$1 AND outcome='failure'", [orderId])).rows[0].count >= 15, 'durable denials');
  const dashboardPage=await readDashboard('customer',{limit:1});
  check(dashboardPage.orders.length===1&&dashboardPage.nextCursor===dashboardPage.orders[0].id,'bounded dashboard first page');
  const dashboardNextPage=await readDashboard('customer',{limit:1,cursor:dashboardPage.nextCursor});
  check(dashboardNextPage.orders.length===1&&dashboardNextPage.orders[0].id!==dashboardPage.orders[0].id,'stable keyset next page');
  // Documents use the same authenticated/audited transaction, retaining all
  // choices without converting pages/copies into merchandise dimensions.
  const beforeDocumentChecks = checks;
  const documentSpec = { kind: 'document', schemaVersion: 1, pages: 5, copies: 3, purpose: 'notes', paperSize: 'a4',
    paperType: 'standard', colour: 'mono', sides: 'double', binding: 'spiral', urgency: 'standard', handoff: 'collection' };
  const documentId = randomUUID(), operationId = randomUUID();
  const documentInput = { orderId: documentId, operationId, expectedVersion: 0, spec: documentSpec };
  const document = await commands.run('order.create', documentInput, actors.customer, randomUUID());
  check(document.state === 'DRAFT', 'document draft created');
  assert.deepEqual(document.spec, documentSpec); checks++;
  const sameDocument = await commands.run('order.create', documentInput, actors.customer, randomUUID());
  check(sameDocument.auditId === document.auditId, 'matching document retry uses original audit');
  await assert.rejects(commands.run('order.create', { ...documentInput, spec: { ...documentSpec, pages: 6 } }, actors.customer, randomUUID()), { code: 'CONFLICT' }); checks++;
  const documentRun = (who, action, expectedVersion, extra = {}) => commands.run(action,
    { orderId: documentId, operationId: randomUUID(), expectedVersion, ...extra }, actors[who], randomUUID());
  for (const who of ['other', 'vendor', 'delivery']) {
    await assert.rejects(documentRun(who, 'order.read', 1), { code: 'NOT_FOUND' }); checks++;
  }
  assert.deepEqual((await readDashboard('customer', { orderId: documentId })).detail.spec, documentSpec); checks++;
  // Raw SQL bypasses the JS validator: malformed options must still deny,
  // leave no order, and commit an immutable denial event.
  const invalidSpecs = [null, [], { ...documentSpec, kind: 'constructor' }, { ...documentSpec, schemaVersion: '1' },
    { ...documentSpec, schemaVersion: 2 }, { ...documentSpec, price: 1 }, { ...documentSpec, pages: '5' },
    { ...documentSpec, pages: 0 }, { ...documentSpec, pages: 1.5 }, { ...documentSpec, pages: 2001 },
    { ...documentSpec, copies: 1001 }, { ...documentSpec, copies: null }, { ...documentSpec, pages: {} }];
  for (const key of Object.keys(documentSpec)) {
    const missing = { ...documentSpec }; delete missing[key]; invalidSpecs.push(missing);
  }
  for (const key of ['purpose', 'paperSize', 'paperType', 'colour', 'sides', 'binding', 'urgency', 'handoff']) {
    invalidSpecs.push({ ...documentSpec, [key]: '__proto__' }, { ...documentSpec, [key]: null });
  }
  for (const spec of invalidSpecs) {
    const rejectedId = randomUUID();
    await db.query('SET ROLE virtual_ink_security_service');
    let rejection;
    try { rejection = (await db.query('SELECT virtual_ink_workflow.command($1,$2::jsonb,$3::jsonb) AS result', ['order.create',
      JSON.stringify({ orderId: rejectedId, operationId: randomUUID(), expectedVersion: 0, spec }),
      JSON.stringify({ ...actors.customer, environment: 'local', correlationId: randomUUID() })])).rows[0].result; }
    finally { await db.query('RESET ROLE'); }
    check(!rejection.ok && rejection.error === 'VALIDATION_FAILED' && rejection.auditId, 'SQL document rejection is audited');
    check((await db.query('SELECT count(*)::int AS n FROM virtual_ink_workflow.orders WHERE id=$1', [rejectedId])).rows[0].n === 0, 'invalid document creates no order');
  }
  await assert.rejects(db.query("UPDATE virtual_ink_workflow.orders SET spec=jsonb_set(spec,'{pages}','6') WHERE id=$1", [documentId]), { code: '23514' }); checks++;
  await assert.rejects(documentRun('customer', 'order.submit', 1), { code: 'CONFLICT' }); checks++;
  const documentFile = randomUUID();
  const reserved = await documentRun('customer', 'file.reserve', 1, { fileId: documentFile, purpose: 'source', mime: 'application/pdf', size: 32 });
  await workerDb.query('SELECT virtual_ink_workflow.record_scan($1,$2,$3,$4,$5,$6,$7)', [documentFile, `approved:${randomUUID()}`, 'a'.repeat(64), 'SAFE', 32, 'application/pdf', randomUUID()]);
  const submitted = await documentRun('customer', 'order.submit', reserved.version);
  check(submitted.state === 'SUBMITTED', 'document submits only after synthetic SAFE metadata');
  await db.query("INSERT INTO virtual_ink_workflow.grants VALUES(gen_random_uuid(),$1,$2,'order.assign','synthetic_document',gen_random_uuid(),clock_timestamp()+interval '5 minutes',clock_timestamp())", [actors.admin.user, documentId]);
  const assigned = await documentRun('admin', 'order.assign', submitted.version, { vendorId: vendorRow.tenant_id });
  assert.deepEqual((await documentRun('vendor', 'order.read', assigned.version)).spec, documentSpec); checks++;
  assert.deepEqual((await readDashboard('vendor', { orderId: documentId })).detail.spec, documentSpec); checks++;
  const quoted = await documentRun('vendor', 'quote.propose', assigned.version, { amountMinor: 15000, currency: 'ZMW', validUntil: new Date(Date.now() + 3600000).toISOString() });
  const documentAccepted = await documentRun('customer', 'quote.accept', quoted.version);
  check(documentAccepted.state === 'AWAITING_PAYMENT', 'document uses existing server quotation lifecycle');
  assert.deepEqual((await readDashboard('customer', { orderId: documentId })).detail.spec, documentSpec); checks++;
  // Audit outage must roll back even an otherwise valid new document draft.
  const auditDocumentId = randomUUID();
  await db.query('REVOKE INSERT ON virtual_ink_workflow.events FROM virtual_ink_workflow_owner');
  try { await assert.rejects(commands.run('order.create', { ...documentInput, orderId: auditDocumentId, operationId: randomUUID() }, actors.customer, randomUUID()), { code: 'AUDIT_UNAVAILABLE' }); checks++; }
  finally { await db.query('GRANT INSERT ON virtual_ink_workflow.events TO virtual_ink_workflow_owner'); }
  check((await db.query('SELECT count(*)::int AS n FROM virtual_ink_workflow.orders WHERE id=$1', [auditDocumentId])).rows[0].n === 0, 'audit outage creates no document order');
  for (const role of ['anon', 'authenticated', 'service_role', 'virtual_ink_security_service', 'virtual_ink_scan_service']) {
    check(!(await db.query("SELECT has_function_privilege($1,'virtual_ink_workflow.valid_spec(jsonb)','EXECUTE') AS allowed", [role])).rows[0].allowed, 'no new direct validator grants');
  }
  console.log(JSON.stringify({ check: 'document_specification', status: 'pass', checks: checks - beforeDocumentChecks, limits: 'Local SQL/provider-shaped fixtures and synthetic scan metadata only.' }));
  await db.query('UPDATE virtual_ink.memberships SET active=false WHERE user_id=$1',[actors.vendor.user]);
  await assert.rejects(readDashboard('vendor'),{code:'FORBIDDEN'});checks++;
  check(!(await db.query("SELECT has_function_privilege('authenticated','virtual_ink_workflow.dashboard(jsonb,jsonb)','EXECUTE') AS allowed")).rows[0].allowed,'no direct browser dashboard execution');
  console.log(JSON.stringify({ check: 'postgres_order_proof_qc_workflow', status: 'pass', checks,
    storage: realStorage ? 'Real local S3 and ClamAV engines' : 'Synthetic storage metadata',
    limits: 'Disposable SQL and provider-shaped session fixtures; not hosted Auth or human approval.' }));
} finally { await db.query('ROLLBACK').catch(() => {}); await db.end(); }
