// Runs inside the genuine local Auth harness; no simulated session/MFA claims.
import { randomUUID } from 'node:crypto';
export async function checkGenuineWorkflowAuth({ database, applicationDatabase, createActor, core, check, privateValues, totp, config }) {
  await database.query('UPDATE virtual_ink_workflow.configuration SET enabled=true');
  const owner = await createActor('workflow-owner', 'CUSTOMER');
  const other = await createActor('workflow-other', 'CUSTOMER');
  const admin = await createActor('workflow-admin', 'SUPER_ADMIN');
  const commands = core.createWorkflowCommands(applicationDatabase, 'local'), orderId = randomUUID();
  const input = { orderId, operationId: randomUUID(), expectedVersion: 0,
    spec: { productCode: 'synthetic', quantity: 1, widthMm: 100, heightMm: 100 } };
  const request = async (actor, action, body) => core.workflowResponse(new Request(`${config.origin}/api/workflow/${action}`, {
    method: 'POST', headers: { origin: config.origin, 'content-type': 'application/json' }, body: JSON.stringify(body),
  }), action, { origin: config.origin, identity: () => actor.auth.identity(), commands });
  const created = await request(owner, 'order.create', input);
  check(created.status === 200 && (await created.json()).data.state === 'DRAFT', 'workflow_genuine_primary_session_creates_draft');
  check((await request(other, 'order.read', { orderId, operationId: randomUUID() })).status === 404, 'workflow_genuine_other_customer_denied');
  check((await request(owner, 'order.create', { ...input, role: 'SUPER_ADMIN' })).status === 400, 'workflow_genuine_session_cannot_inject_authority');
  const assignment = { orderId, operationId: randomUUID(), expectedVersion: 1, vendorId: randomUUID() };
  check((await request(admin, 'order.assign', assignment)).status === 401, 'workflow_genuine_aal1_admin_denied');
  await database.query("INSERT INTO virtual_ink_workflow.grants VALUES(gen_random_uuid(),$1,$2,'order.assign','synthetic_software_fixture',gen_random_uuid(),clock_timestamp()+interval '1 hour',clock_timestamp())", [admin.id, orderId]);
  // Enroll a new synthetic native factor, then verify via the actual application
  // challenge route so both native receipt and signed application proof exist.
  const factor = await admin.sdk.auth.mfa.enroll({ factorType: 'totp' });
  check(!factor.error, 'workflow_native_factor_enrollment');
  privateValues.push(factor.data.totp.secret);
  const challenge = await admin.request('challenge', { factorId: factor.data.id });
  check(challenge.status === 200, 'workflow_genuine_application_challenge');
  const verified = await admin.request('verify', { factorId: factor.data.id, challengeId: challenge.body.data.challengeId, code: totp(factor.data.totp.secret) });
  check(verified.status === 200, 'workflow_genuine_application_mfa');
  // DRAFT has no assignment transition. CONFLICT proves current genuine AAL2,
  // native receipt, application proof, role and scoped grant passed first.
  check((await request(admin, 'order.assign', assignment)).status === 409, 'workflow_genuine_mfa_reaches_state_guard');
  admin.cookies.clear();
  check((await request(admin, 'order.assign', assignment)).status === 401, 'workflow_native_aal2_without_app_proof_denied');
  const oldIdentity = await owner.auth.identity();
  const logout = await owner.sdk.auth.signOut({ scope: 'local' });
  check(!logout.error, 'workflow_native_session_logout');
  let denied = false;
  try { await commands.run('order.read', { orderId, operationId: randomUUID() }, oldIdentity, randomUUID()); }
  catch (error) { denied = error.code === 'UNAUTHENTICATED'; }
  check(denied, 'workflow_database_rechecks_actual_provider_session_revocation');
}
