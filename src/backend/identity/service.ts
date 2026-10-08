import { ApiError } from '../api/errors.ts';
import { uuid } from '../api/validation.ts';
import { recordAudit } from '../audit/events.ts';
import type { SqlDatabase, SqlExecutor } from '../database/ports.ts';
import { permits, globalRoles, vendorRoles, type GlobalRole, type VendorRole } from '../permissions/policy.ts';
import type { VerifiedIdentity } from './supabase.ts';

type UserRow = Record<string, unknown> & { id: string; active: boolean };
type RoleRow = Record<string, unknown> & { role: GlobalRole };
type MembershipRow = Record<string, unknown> & { role: VendorRole };
type TenantRow = Record<string, unknown> & { id: string; active: boolean };

async function identify(tx: SqlExecutor, identity: VerifiedIdentity): Promise<{ userId: string; roles: readonly GlobalRole[] }> {
  // Context is server-verified and transaction-local, never a public header.
  await tx.query("SELECT set_config('app.identity_provider', $1, true), set_config('app.identity_issuer', $2, true), set_config('app.identity_subject', $3, true)",
    [identity.provider, identity.issuer, uuid(identity.subject)]);
  const mapped = await tx.query<Record<string, unknown> & { user_id: string }>(
    'SELECT user_id FROM virtual_ink.identities WHERE provider = $1 AND issuer = $2 AND subject = $3 AND active',
    [identity.provider, identity.issuer, identity.subject]);
  if (mapped.rows.length !== 1) throw new ApiError('FORBIDDEN');
  const userId = uuid(mapped.rows[0].user_id);
  await tx.query("SELECT set_config('app.user_id', $1, true)", [userId]);
  const users = await tx.query<UserRow>('SELECT id, active FROM virtual_ink.users WHERE id = $1 AND active', [userId]);
  if (users.rows.length !== 1 || users.rows[0].id !== userId || users.rows[0].active !== true) throw new ApiError('FORBIDDEN');
  const roles = await tx.query<RoleRow>('SELECT role FROM virtual_ink.user_roles WHERE user_id = $1 AND active ORDER BY role', [userId]);
  if (roles.rows.some((row) => !globalRoles.includes(row.role))) throw new ApiError('FORBIDDEN');
  return { userId, roles: Object.freeze(roles.rows.map((row) => row.role)) };
}

export function createIdentityService(database: SqlDatabase) {
  return Object.freeze({
    async me(identity: VerifiedIdentity) {
      return database.transaction(async (tx) => {
        const user = await identify(tx, identity);
        return Object.freeze({ userId: user.userId, roles: user.roles });
      });
    },
    async tenantAccess(identity: VerifiedIdentity, requestedTenantId: string, requestId: string) {
      const tenantId = uuid(requestedTenantId, 'tenantId');
      uuid(requestId, 'requestId');
      return database.transaction(async (tx) => {
        const user = await identify(tx, identity);
        await tx.query("SELECT set_config('app.tenant_id', $1, true), set_config('app.request_id', $2, true)", [tenantId, requestId]);
        const tenant = await tx.query<TenantRow>('SELECT id, active FROM virtual_ink.tenants WHERE id = $1 AND active', [tenantId]);
        if (tenant.rows.length !== 1 || tenant.rows[0].id !== tenantId || tenant.rows[0].active !== true) throw new ApiError('NOT_FOUND');
        const members = await tx.query<MembershipRow>(
          'SELECT role FROM virtual_ink.memberships WHERE user_id = $1 AND tenant_id = $2 AND active', [user.userId, tenantId]);
        const membership = members.rows[0]?.role ?? null;
        if (membership !== null && !vendorRoles.includes(membership)) throw new ApiError('NOT_FOUND');
        const grants = await tx.query<Record<string, unknown> & { capability: string }>(
          "SELECT capability FROM virtual_ink.operator_grants WHERE user_id = $1 AND tenant_id = $2 AND active AND capability = 'tenant.review' AND expires_at > now()", [user.userId, tenantId]);
        const operatorTenantReview = grants.rows.some((row) => row.capability === 'tenant.review');
        if (!permits('tenant.read', { activeUser: true, activeTenant: true, roles: user.roles, membership, operatorTenantReview })) {
          throw new ApiError('NOT_FOUND');
        }
        // The read and durable audit share the transaction. No response before COMMIT.
        await recordAudit({ action: 'tenant.accessed', actorType: 'user', actorId: user.userId,
          tenantId, resourceId: tenantId, requestId, outcome: 'allowed' }, {
          async append(event) {
            const result = await tx.query(
              `INSERT INTO virtual_ink.access_audits (id, occurred_at, actor_id, tenant_id, action, resource_id, request_id, outcome)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
              [event.id, event.occurredAt, event.actorId, event.tenantId, event.action, event.resourceId, event.requestId, event.outcome]);
            if (result.rowCount !== 1) throw new Error('Audit not persisted');
          },
        });
        return Object.freeze({ tenantId, capability: 'tenant.read', membership,
          accessBasis: membership ? 'active_membership' : 'explicit_operator_grant' });
      });
    },
  });
}
