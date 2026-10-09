import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { loadDatabaseConfig } from './config.ts';
import { createPooledDatabase, type ConnectionPool } from './pool.ts';
import type { SqlDatabase } from './ports.ts';

type Environment = Record<string, string | undefined>;
type DatabaseGroup = 'virtual_ink_api' | 'virtual_ink_provisioner';
type PoolConstructor = new (config: Record<string, unknown>) => ConnectionPool & { on(event: string, handler: () => void): void };

export async function assertDatabaseRole(database: SqlDatabase, group: DatabaseGroup): Promise<void> {
  const result = await database.query<Record<string, unknown>>(`SELECT r.rolsuper, r.rolbypassrls, r.rolcreaterole, r.rolcreatedb, r.rolreplication,
    pg_has_role(current_user, $1, 'MEMBER') AS group_member,
    pg_has_role(current_user, $1, 'USAGE') AS group_usable,
    EXISTS (SELECT 1 FROM pg_auth_members am JOIN pg_roles member_role ON member_role.oid=am.member
      WHERE member_role.rolname=current_user AND (am.roleid <> $1::regrole OR am.admin_option)) AS unsafe_memberships,
    EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='virtual_ink' AND pg_has_role(current_user,c.relowner,'MEMBER')) AS owns_app_tables
    FROM pg_roles r WHERE r.rolname=current_user`, [group]);
  const flags = result.rows[0];
  if (!flags || flags.group_member !== true || flags.group_usable !== true ||
    [flags.rolsuper, flags.rolbypassrls, flags.rolcreaterole, flags.rolcreatedb, flags.rolreplication,
      flags.owns_app_tables, flags.unsafe_memberships].some((flag) => flag !== false)) {
    throw new Error('Database startup requires a restricted non-owner login in the selected group only.');
  }
}

export async function openRestrictedDatabase(env: Environment, group: DatabaseGroup): Promise<SqlDatabase> {
  if (!loadDatabaseConfig(env).configured) throw new Error('A restricted database connection is required.');
  const url = new URL(env.DATABASE_URL!);
  const sslRequired = env.DATABASE_SSL_ROOT_CERT !== undefined;
  url.searchParams.delete('sslmode'); // Preserve our verified CA instead of pg URL SSL overrides.
  let Pool: PoolConstructor;
  let ca: string | undefined;
  try {
    Pool = (createRequire(import.meta.url)('pg') as { Pool: PoolConstructor }).Pool;
    ca = sslRequired ? await readFile(env.DATABASE_SSL_ROOT_CERT!, 'utf8') : undefined;
    if (sslRequired && !ca?.includes('-----BEGIN CERTIFICATE-----')) throw new Error();
  } catch { throw new Error('Database startup requires pg and a readable configured CA certificate.'); }
  const pool = new Pool({ connectionString: url.toString(), max: group === 'virtual_ink_api' ? 4 : 1,
    connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000,
    ssl: sslRequired ? { ca, rejectUnauthorized: true } : false });
  pool.on('error', () => { /* Raw driver messages can include secrets. */ });
  const database = createPooledDatabase(pool);
  try { await assertDatabaseRole(database, group); }
  catch { await database.close(); throw new Error('Database startup rejected the configured login.'); }
  return database;
}
