import { ApiError } from '../api/errors.ts';
import type { SqlExecutor } from '../database/ports.ts';
import type { Phase1Actor, Phase1Role } from '../permissions/phase1.ts';
import { identify } from './service.ts';
import type { VerifiedIdentity } from './supabase.ts';

/**
 * Initial bridge from the existing server-owned role model. Call after provider
 * verification, inside the eventual resource/action/audit transaction, before
 * selecting its tenant. This loader grants no resource assignment or MFA claim.
 * The remaining six roles need their own reviewed schema/lifecycle integration.
 */
export async function loadPhase1Actor(tx: SqlExecutor, identity: VerifiedIdentity): Promise<Phase1Actor> {
  await tx.query(`SELECT set_config('app.user_id', '', true),
    set_config('app.tenant_id', '', true), set_config('app.access_mode', '', true)`, []);
  const user = await identify(tx, identity);
  if (user.roles.length !== 1) throw new ApiError('FORBIDDEN');
  let role: Phase1Role;
  if (user.roles[0] === 'Customer') role = 'CUSTOMER';
  else if (user.roles[0] === 'DeliveryPartner') role = 'DELIVERY_PARTNER';
  else throw new ApiError('FORBIDDEN'); // PlatformOperator is never an ADMIN alias.

  if (role === 'CUSTOMER') {
    // Legacy vendor membership is a second role source, not customer authority.
    // Bound the read; don't enumerate tenant IDs or convert ownership to VENDOR.
    await tx.query("SELECT set_config('app.access_mode', 'memberships.list', true)", []);
    const memberships = await tx.query(
      'SELECT user_id FROM virtual_ink.memberships WHERE user_id = $1 AND active LIMIT 1', [user.userId]);
    await tx.query("SELECT set_config('app.access_mode', '', true)", []);
    if (memberships.rows.length !== 0) throw new ApiError('FORBIDDEN');
  }

  return Object.freeze({ userId: user.userId, active: true, roles: Object.freeze([role]),
    organizationIds: Object.freeze([]), activeVendorAssignment: false,
    activeDesignerAssignment: false, assignedDeliveryPartner: false,
    aal: 'aal1', grants: Object.freeze([]) });
}
