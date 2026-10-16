import { ApiError } from '../api/errors.ts';
import type { SqlExecutor } from '../database/ports.ts';
import { phase1Roles, type Phase1Role, type Phase1Actor } from '../permissions/phase1.ts';
import { identify } from './service.ts';
import type { VerifiedIdentity } from './supabase.ts';

export const assignedRoleStatement = `SELECT user_id, role, active, version
  FROM virtual_ink_phase1.role_assignments WHERE user_id=$1 AND active LIMIT 2`;

/** Explicit assignments only. No legacy fallback, MFA or resource authority. */
export async function loadAssignedPhase1Actor(tx: SqlExecutor, identity: VerifiedIdentity): Promise<Phase1Actor> {
  await tx.query(`SELECT set_config('app.user_id', '', true),
    set_config('app.tenant_id', '', true), set_config('app.access_mode', '', true)`, []);
  const user = await identify(tx, identity);
  await tx.query("SELECT set_config('app.access_mode', 'phase1.actor', true)", []);
  const result = await tx.query(assignedRoleStatement, [user.userId]);
  await tx.query("SELECT set_config('app.access_mode', '', true)", []);
  if (result.rows.length !== 1) throw new ApiError('FORBIDDEN');
  const row = result.rows[0];
  if (row.user_id !== user.userId || row.active !== true || row.version !== 1 ||
    typeof row.role !== 'string' || !(phase1Roles as readonly string[]).includes(row.role)) throw new ApiError('FORBIDDEN');
  return Object.freeze({ userId: user.userId, active: true, roles: Object.freeze([row.role as Phase1Role]),
    organizationIds: Object.freeze([]), activeVendorAssignment: false,
    activeDesignerAssignment: false, assignedDeliveryPartner: false,
    aal: 'aal1', grants: Object.freeze([]) });
}
