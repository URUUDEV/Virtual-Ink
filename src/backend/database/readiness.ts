import type { SqlDatabase } from './ports.ts';

export type DatabaseGroup = 'virtual_ink_api' | 'virtual_ink_provisioner';
const names = ['users', 'identities', 'user_roles', 'tenants', 'memberships', 'operator_grants', 'access_audits', 'provisioning_audits', 'membership_list_audits'] as const;

// Catalog-only check: no customer rows, Auth records, tokens or private evidence.
export const foundationStatement = `WITH expected(table_name,can_select,can_insert) AS (VALUES
  ('users',true,$1='virtual_ink_provisioner'),
  ('identities',true,$1='virtual_ink_provisioner'),
  ('user_roles',true,$1='virtual_ink_provisioner'),
  ('tenants',true,$1='virtual_ink_provisioner'),
  ('memberships',true,$1='virtual_ink_provisioner'),
  ('operator_grants',$1='virtual_ink_api',false),
  ('access_audits',false,$1='virtual_ink_api'),
  ('provisioning_audits',$1='virtual_ink_provisioner',$1='virtual_ink_provisioner'),
  ('membership_list_audits',false,$1='virtual_ink_api'))
SELECT e.table_name,e.can_select,e.can_insert,c.relkind,c.relrowsecurity,c.relforcerowsecurity,
  has_table_privilege(current_user,c.oid,'SELECT') AS actual_select,
  has_table_privilege(current_user,c.oid,'INSERT') AS actual_insert,
  has_table_privilege(current_user,c.oid,'UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS unsafe_table_rights,
  has_any_column_privilege(current_user,c.oid,'SELECT') AS column_select,
  has_any_column_privilege(current_user,c.oid,'INSERT') AS column_insert,
  has_any_column_privilege(current_user,c.oid,'UPDATE,REFERENCES') AS unsafe_column_rights,
  has_schema_privilege(current_user,'virtual_ink','USAGE') AS schema_usage,
  has_schema_privilege(current_user,'virtual_ink','CREATE') AS schema_create,
  has_schema_privilege(current_user,'public','CREATE') AS public_create,
  EXISTS (SELECT FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
    JOIN pg_namespace pn ON pn.oid=p.pronamespace
    WHERE t.tgrelid=c.oid AND t.tgname='require_provisioning_audit' AND t.tgdeferrable
      AND t.tginitdeferred AND t.tgenabled='O' AND NOT p.prosecdef
      AND pn.nspname='virtual_ink' AND p.proname='require_provisioning_audit') AS audit_constraint,
  EXISTS (SELECT FROM pg_class extra JOIN pg_namespace en ON en.oid=extra.relnamespace
    WHERE en.nspname='virtual_ink' AND extra.relkind IN ('r','p','v','m','f')
      AND NOT EXISTS (SELECT FROM expected x WHERE x.table_name=extra.relname)
      AND (has_table_privilege(current_user,extra.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        OR has_any_column_privilege(current_user,extra.oid,'SELECT,INSERT,UPDATE,REFERENCES'))) AS unexpected_table_access
FROM expected e LEFT JOIN pg_namespace n ON n.nspname='virtual_ink'
LEFT JOIN pg_class c ON c.relnamespace=n.oid AND c.relname=e.table_name`;

export async function assertDatabaseFoundation(database: SqlDatabase, group: DatabaseGroup): Promise<void> {
  const { rows } = await database.query(foundationStatement, [group]);
  if (rows.length !== names.length || new Set(rows.map((row) => row.table_name)).size !== names.length || rows.some((row) => {
    if (!names.includes(row.table_name as typeof names[number])) return true;
    const needsAudit = ['users', 'identities', 'user_roles', 'tenants', 'memberships'].includes(String(row.table_name));
    const select = group === 'virtual_ink_api' ? !['access_audits', 'provisioning_audits', 'membership_list_audits'].includes(String(row.table_name)) :
      !['access_audits', 'operator_grants', 'membership_list_audits'].includes(String(row.table_name));
    const insert = group === 'virtual_ink_api' ? ['access_audits', 'membership_list_audits'].includes(String(row.table_name)) : select;
    return row.relkind !== 'r' || row.relrowsecurity !== true || row.relforcerowsecurity !== true ||
      row.actual_select !== select || row.actual_insert !== insert || row.column_select !== select || row.column_insert !== insert ||
      row.unsafe_table_rights !== false || row.unsafe_column_rights !== false || row.schema_usage !== true || row.schema_create !== false ||
      row.public_create !== false || row.unexpected_table_access !== false || needsAudit && row.audit_constraint !== true;
  })) throw new Error('Database foundation check failed.');
}
