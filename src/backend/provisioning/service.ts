import { createHash, randomUUID } from 'node:crypto';
import { strictObject, uuid } from '../api/validation.ts';
import type { SqlDatabase, SqlExecutor } from '../database/ports.ts';
import type { IdentityVerifier, VerifiedIdentity } from '../identity/supabase.ts';

export type ProvisioningCommand = Readonly<{ action: 'create_account' | 'create_vendor' | 'add_staff';
  operationId: string; approvalId: string; reviewerId: string; tenantId: string | null }>;
export type ProvisioningReceipt = Readonly<{ operationId: string; userId: string; tenantId: string | null;
  outcome: 'created' | 'existing'; historicalReplay: boolean }>;
export class ProvisioningError extends Error {
  readonly code: 'INVALID_COMMAND' | 'CONFLICT' | 'NOT_ELIGIBLE' | 'AUDIT_FAILED';
  constructor(code: ProvisioningError['code']) { super('Provisioning did not complete.'); this.code = code; }
}

export function parseProvisioningCommand(value: unknown): ProvisioningCommand {
  try {
    const record = strictObject(value, ['action', 'operationId', 'approvalId', 'reviewerId', 'tenantId']);
    if (!['create_account', 'create_vendor', 'add_staff'].includes(String(record.action))) throw new Error();
    const action = record.action as ProvisioningCommand['action'];
    if (action === 'create_account' && record.tenantId !== undefined && record.tenantId !== null) throw new Error();
    return Object.freeze({ action, operationId: uuid(record.operationId), approvalId: uuid(record.approvalId),
      reviewerId: uuid(record.reviewerId), tenantId: action === 'create_account' ? null : uuid(record.tenantId) });
  } catch { throw new ProvisioningError('INVALID_COMMAND'); }
}

async function insert(tx: SqlExecutor, sql: string, parameters: readonly (string | null)[]) {
  if ((await tx.query(sql, parameters)).rowCount !== 1) throw new ProvisioningError('CONFLICT');
}
async function account(tx: SqlExecutor, identity: VerifiedIdentity, create: boolean): Promise<{ userId: string; created: boolean }> {
  const result = await tx.query(`SELECT i.user_id, i.active AS identity_active, u.active AS user_active
    FROM virtual_ink.identities i JOIN virtual_ink.users u ON u.id=i.user_id
    WHERE i.provider=$1 AND i.issuer=$2 AND i.subject=$3`, [identity.provider, identity.issuer, identity.subject]);
  if (result.rows.length) {
    const row = result.rows[0];
    if (row.identity_active !== true || row.user_active !== true) throw new ProvisioningError('NOT_ELIGIBLE');
    return { userId: uuid(row.user_id), created: false };
  }
  if (!create) throw new ProvisioningError('NOT_ELIGIBLE');
  const userId = randomUUID();
  await insert(tx, 'INSERT INTO virtual_ink.users (id) VALUES ($1)', [userId]);
  await insert(tx, 'INSERT INTO virtual_ink.identities (provider,issuer,subject,user_id) VALUES ($1,$2,$3,$4)',
    [identity.provider, identity.issuer, identity.subject, userId]);
  return { userId, created: true };
}

// Private administrator tool only. Never wire this service or credential into HTTP.
// Approval/reviewer UUIDs reference externally verified records; they are not proof
// of approval themselves. The trusted operator must review those records first.
export function createProvisioningService(database: SqlDatabase, verifier: IdentityVerifier) {
  return Object.freeze({
    async execute(value: unknown, token: string): Promise<ProvisioningReceipt> {
      const command = parseProvisioningCommand(value);
      const identity = await verifier.verify(token); // Before any SQL; never decode metadata for authority.
      const fingerprint = createHash('sha256').update(JSON.stringify({ ...command, identity })).digest('hex');
      return database.transaction(async (tx) => {
        // Fixed lock namespace. Concurrent duplicate/conflicting transactions may
        // still require an explicit retry after PostgreSQL serialization failure.
        await tx.query('SELECT pg_advisory_xact_lock(74001, hashtext($1))', [command.operationId]);
        const previous = await tx.query(`SELECT request_fingerprint, user_id, tenant_id, outcome
          FROM virtual_ink.provisioning_audits WHERE operation_id=$1`, [command.operationId]);
        if (previous.rows.length) {
          const row = previous.rows[0];
          if (row.request_fingerprint !== fingerprint) throw new ProvisioningError('CONFLICT');
          if (!['created', 'existing'].includes(String(row.outcome))) throw new ProvisioningError('AUDIT_FAILED');
          return Object.freeze({ operationId: command.operationId, userId: uuid(row.user_id),
            tenantId: row.tenant_id === null ? null : uuid(row.tenant_id),
            outcome: row.outcome as 'created' | 'existing', historicalReplay: true });
        }
        const target = await account(tx, identity, command.action === 'create_account');
        let outcome: 'created' | 'existing' = target.created ? 'created' : 'existing';
        const roles = await tx.query('SELECT role, active FROM virtual_ink.user_roles WHERE user_id=$1', [target.userId]);
        if (command.action === 'create_account') {
          const customer = roles.rows.find((row) => row.role === 'Customer');
          if (customer && customer.active !== true) throw new ProvisioningError('NOT_ELIGIBLE');
          if (!customer) {
            await insert(tx, "INSERT INTO virtual_ink.user_roles (user_id,role) VALUES ($1,'Customer')", [target.userId]);
            outcome = 'created';
          }
        } else {
          if (roles.rows.some((row) => row.role === 'DeliveryPartner' && row.active === true)) throw new ProvisioningError('NOT_ELIGIBLE');
          const tenant = await tx.query('SELECT id, active FROM virtual_ink.tenants WHERE id=$1', [command.tenantId]);
          if (command.action === 'create_vendor') {
            if (tenant.rows.length) throw new ProvisioningError('CONFLICT'); // No taking over existing tenants.
            await insert(tx, "INSERT INTO virtual_ink.tenants (id,kind) VALUES ($1,'vendor')", [command.tenantId]);
            await insert(tx, "INSERT INTO virtual_ink.memberships (tenant_id,user_id,role) VALUES ($1,$2,'VendorOwner')",
              [command.tenantId, target.userId]);
            outcome = 'created';
          } else {
            if (tenant.rows[0]?.active !== true) throw new ProvisioningError('NOT_ELIGIBLE');
            const owners = await tx.query(`SELECT m.user_id FROM virtual_ink.memberships m JOIN virtual_ink.users u ON u.id=m.user_id
              WHERE m.tenant_id=$1 AND m.role='VendorOwner' AND m.active AND u.active`, [command.tenantId]);
            if (!owners.rows.length) throw new ProvisioningError('NOT_ELIGIBLE');
            const member = await tx.query('SELECT role, active FROM virtual_ink.memberships WHERE tenant_id=$1 AND user_id=$2',
              [command.tenantId, target.userId]);
            if (member.rows.length && (member.rows[0].role !== 'VendorStaff' || member.rows[0].active !== true)) {
              throw new ProvisioningError('NOT_ELIGIBLE'); // No downgrades, promotions or reactivation.
            }
            if (!member.rows.length) {
              await insert(tx, "INSERT INTO virtual_ink.memberships (tenant_id,user_id,role) VALUES ($1,$2,'VendorStaff')",
                [command.tenantId, target.userId]);
              outcome = 'created';
            }
          }
        }
        const audit = await tx.query(`INSERT INTO virtual_ink.provisioning_audits
          (operation_id,approval_id,reviewer_id,db_actor,action,request_fingerprint,user_id,tenant_id,outcome)
          VALUES ($1,$2,$3,session_user,$4,$5,$6,$7,$8)`,
        [command.operationId, command.approvalId, command.reviewerId, command.action, fingerprint, target.userId, command.tenantId, outcome]);
        if (audit.rowCount !== 1) throw new ProvisioningError('AUDIT_FAILED');
        return Object.freeze({ operationId: command.operationId, userId: target.userId, tenantId: command.tenantId,
          outcome, historicalReplay: false });
      }); // Receipt becomes visible only after the atomic changes and audit commit.
    },
  });
}
