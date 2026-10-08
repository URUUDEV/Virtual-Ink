import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { loadDatabaseConfig } from '../database/config.ts';
import { createPooledDatabase, type ConnectionPool } from '../database/pool.ts';
import { loadSupabaseRestConfig } from '../database/supabase-rest.ts';
import { createSupabaseIdentityVerifier } from './supabase.ts';
import type { AccessDependencies } from './routes.ts';

type Environment = Record<string, string | undefined>;
type PoolConstructor = new (config: Record<string, unknown>) => ConnectionPool & { on(event: string, handler: () => void): void };

// Optional driver loading preserves the no-install health/test workflow.
// No impersonation/demo identity is substituted when infrastructure is absent.
export async function loadAccessDependencies(env: Environment = process.env): Promise<AccessDependencies | undefined> {
  if (!['true', 'false'].includes(env.AUTH_ENABLED ?? 'false')) throw new Error('AUTH_ENABLED must be true or false.');
  if (env.AUTH_ENABLED !== 'true') return undefined;
  const summary = loadDatabaseConfig(env);
  const auth = loadSupabaseRestConfig(env);
  const verifier = createSupabaseIdentityVerifier(auth);
  if (!summary.configured) throw new Error('Enabled identity requires a restricted DATABASE_URL.');
  const url = new URL(env.DATABASE_URL!);
  const sslRequired = env.DATABASE_SSL_ROOT_CERT !== undefined;
  // pg connection-string SSL options must not overwrite the explicit verified CA.
  url.searchParams.delete('sslmode');
  let Pool: PoolConstructor;
  let ca: string | undefined;
  try {
    const module = createRequire(import.meta.url)('pg') as { Pool: PoolConstructor };
    Pool = module.Pool;
    ca = sslRequired ? await readFile(env.DATABASE_SSL_ROOT_CERT!, 'utf8') : undefined;
    if (sslRequired && !ca?.includes('-----BEGIN CERTIFICATE-----')) throw new Error();
  } catch { throw new Error('Identity startup requires the pg driver and a readable configured CA certificate.'); }
  const pool = new Pool({ connectionString: url.toString(), max: 4,
    connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000,
    ssl: sslRequired ? { ca, rejectUnauthorized: true } : false });
  pool.on('error', () => { /* No raw driver messages or URLs in logs. */ });
  const database = createPooledDatabase(pool);
  try {
    const roles = await database.query<Record<string, unknown>>(`SELECT r.rolsuper, r.rolbypassrls, r.rolcreaterole, r.rolcreatedb,
      pg_has_role(current_user, 'virtual_ink_api', 'MEMBER') AS api_member,
      pg_has_role(current_user, 'virtual_ink_api', 'USAGE') AS api_usable,
      EXISTS (SELECT 1 FROM pg_auth_members am JOIN pg_roles member_role ON member_role.oid=am.member
        WHERE member_role.rolname=current_user AND am.roleid <> 'virtual_ink_api'::regrole) AS extra_memberships,
      EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='virtual_ink' AND pg_has_role(current_user,c.relowner,'MEMBER')) AS owns_app_tables
      FROM pg_roles r WHERE r.rolname=current_user`, []);
    const flags = roles.rows[0];
    if (!flags || flags.api_member !== true || flags.api_usable !== true || [flags.rolsuper, flags.rolbypassrls, flags.rolcreaterole, flags.rolcreatedb,
      flags.owns_app_tables, flags.extra_memberships].some((flag) => flag !== false)) throw new Error();
  } catch {
    await database.close();
    throw new Error('Identity startup requires a non-owner, non-privileged API-group database login.');
  }
  return Object.freeze({ verifier, database });
}
