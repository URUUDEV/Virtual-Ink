import { ApiError } from '../api/errors.ts';
import { strictObject, uuid } from '../api/validation.ts';
import { recordAudit } from '../audit/events.ts';
import type { SqlDatabase } from '../database/ports.ts';
import { vendorRoles, type VendorRole } from '../permissions/policy.ts';
import { identify } from './service.ts';
import type { VerifiedIdentity } from './supabase.ts';

export type MembershipPagination = Readonly<{ limit: number; cursor: string | null }>;
type MembershipRow = Record<string, unknown> & { tenant_id: string; role: VendorRole };

export function parseMembershipPagination(query: URLSearchParams): MembershipPagination {
  if ([...query.keys()].some((key) => !['limit', 'cursor'].includes(key)) ||
    query.getAll('limit').length > 1 || query.getAll('cursor').length > 1) throw new ApiError('VALIDATION_FAILED', ['query']);
  const limit = query.get('limit') ?? '20';
  if (!/^\d{1,3}$/.test(limit) || Number(limit) < 1 || Number(limit) > 100) throw new ApiError('VALIDATION_FAILED', ['limit']);
  const cursor = query.get('cursor');
  if (cursor !== null && (!/^[A-Za-z0-9_-]{1,256}$/.test(cursor))) throw new ApiError('VALIDATION_FAILED', ['cursor']);
  return Object.freeze({ limit: Number(limit), cursor });
}

export function membershipCursor(userId: string, after: string): string {
  return Buffer.from(JSON.stringify({ v: 1, userId: uuid(userId), after: uuid(after) })).toString('base64url');
}

function cursorTenant(cursor: string | null, userId: string): string | null {
  if (cursor === null) return null;
  try {
    if (!/^[A-Za-z0-9_-]{1,256}$/.test(cursor)) throw new Error();
    const raw = Buffer.from(cursor, 'base64url');
    if (raw.toString('base64url') !== cursor) throw new Error();
    const decoded = strictObject(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw)), ['v', 'userId', 'after']);
    if (decoded.v !== 1 || decoded.userId !== userId) throw new Error();
    return uuid(decoded.after);
  } catch { throw new ApiError('VALIDATION_FAILED', ['cursor']); }
}

// One extra eligible row determines continuation; no unscoped count or lookup.
export const membershipsStatement = `SELECT m.tenant_id, m.role
  FROM virtual_ink.memberships m JOIN virtual_ink.tenants t ON t.id=m.tenant_id
  WHERE m.user_id=$1 AND m.active AND t.active AND t.kind='vendor'
    AND ($2::uuid IS NULL OR m.tenant_id > $2::uuid)
  ORDER BY m.tenant_id LIMIT $3`;
export const membershipCursorStatement = `SELECT m.tenant_id, m.role
  FROM virtual_ink.memberships m JOIN virtual_ink.tenants t ON t.id=m.tenant_id
  WHERE m.user_id=$1 AND m.tenant_id=$2 AND m.active AND t.active AND t.kind='vendor'`;

export function createMembershipService(database: SqlDatabase) {
  return Object.freeze({
    async list(identity: VerifiedIdentity, pagination: MembershipPagination, requestId: string) {
      uuid(requestId, 'requestId');
      if (!Number.isInteger(pagination.limit) || pagination.limit < 1 || pagination.limit > 100) {
        throw new ApiError('VALIDATION_FAILED', ['limit']);
      }
      return database.transaction(async (tx) => {
        const user = await identify(tx, identity);
        const after = cursorTenant(pagination.cursor, user.userId);
        await tx.query("SELECT set_config('app.access_mode', 'memberships.list', true), set_config('app.tenant_id', '', true), set_config('app.request_id', $1, true)", [requestId]);
        const delivery = user.roles.includes('DeliveryPartner');
        if (after !== null) {
          if (delivery) throw new ApiError('VALIDATION_FAILED', ['cursor']);
          const previous = await tx.query<MembershipRow>(membershipCursorStatement, [user.userId, after]);
          if (previous.rows.length !== 1 || previous.rows[0].tenant_id !== after || !vendorRoles.includes(previous.rows[0].role)) {
            throw new ApiError('VALIDATION_FAILED', ['cursor']);
          }
        }
        const result = delivery ? { rows: [] as MembershipRow[] } :
          await tx.query<MembershipRow>(membershipsStatement, [user.userId, after, pagination.limit + 1]);
        if (result.rows.length > pagination.limit + 1) throw new ApiError('FORBIDDEN');
        let previousId = after ?? '';
        const all = result.rows.map((row) => {
          const tenantId = uuid(row.tenant_id, 'tenantId');
          if (row.tenant_id !== tenantId || tenantId <= previousId || !vendorRoles.includes(row.role)) throw new ApiError('FORBIDDEN');
          previousId = tenantId;
          return Object.freeze({ tenantId, role: row.role });
        });
        const data = Object.freeze(all.slice(0, pagination.limit));
        const nextCursor = all.length > pagination.limit ? membershipCursor(user.userId, data.at(-1)!.tenantId) : null;
        await recordAudit({ action: 'memberships.listed', actorType: 'user', actorId: user.userId,
          tenantId: null, resourceId: user.userId, requestId, outcome: 'allowed' }, {
          async append(event) {
            const persisted = await tx.query(`INSERT INTO virtual_ink.membership_list_audits
              (id,occurred_at,actor_id,action,resource_id,request_id,outcome) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [event.id, event.occurredAt, event.actorId, event.action, event.resourceId, event.requestId, event.outcome]);
            if (persisted.rowCount !== 1) throw new Error('Audit not persisted');
          },
        });
        return Object.freeze({ data, pagination: Object.freeze({ limit: pagination.limit, nextCursor }) });
      });
    },
  });
}
