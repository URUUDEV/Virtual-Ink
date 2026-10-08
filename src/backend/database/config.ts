import { validateDatabaseUrl } from '../config.ts';

type Environment = Record<string, string | undefined>;
export type DatabaseProvider = 'postgres' | 'supabase';
export type ConnectionMode = 'direct' | 'session' | 'transaction';
export type DatabaseConfig = Readonly<{
  provider: DatabaseProvider;
  connectionMode: ConnectionMode;
  configured: boolean;
  migrationsConfigured: boolean;
}>;

function checkConnection(value: string, env: Environment, provider: DatabaseProvider,
  mode: ConnectionMode, application: boolean) {
  const url = validateDatabaseUrl(value);
  const user = decodeURIComponent(url.username);
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (provider === 'supabase') {
    const ref = env.SUPABASE_PROJECT_REF;
    if (!ref || !/^[a-z0-9]{20}$/.test(ref)) {
      throw new Error('Supabase database configuration requires SUPABASE_PROJECT_REF.');
    }
    const direct = url.hostname === `db.${ref}.supabase.co`;
    const sharedPooler = /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname) && user.endsWith(`.${ref}`);
    const expectedPort = mode === 'transaction' ? '6543' : '5432';
    if ((mode === 'direct' ? !direct : !sharedPooler) ||
      (url.port || '5432') !== expectedPort || decodeURIComponent(url.pathname.slice(1)) !== 'postgres') {
      throw new Error('Supabase database endpoint does not match the selected project and connection mode.');
    }
    if (application && ['postgres', 'supabase_admin', 'service_role'].includes(user.split('.')[0])) {
      throw new Error('Application database access requires a dedicated least-privilege login.');
    }
  }
  if (provider === 'supabase' || !local) {
    if (url.searchParams.getAll('sslmode').length !== 1 || url.searchParams.get('sslmode') !== 'verify-full' ||
      [...url.searchParams.keys()].some((key) => key !== 'sslmode') || !env.DATABASE_SSL_ROOT_CERT?.trim()) {
      throw new Error('Hosted database connections require sslmode=verify-full and DATABASE_SSL_ROOT_CERT.');
    }
  }
}

// A validated configuration contract, not a connected driver or readiness test.
// The returned summary intentionally contains no URL, password or certificate path.
export function loadDatabaseConfig(env: Environment = process.env): DatabaseConfig {
  const provider = env.DATABASE_PROVIDER ?? 'postgres';
  const connectionMode = env.DATABASE_CONNECTION_MODE ?? 'direct';
  if (!['postgres', 'supabase'].includes(provider)) throw new Error('DATABASE_PROVIDER must be postgres or supabase.');
  if (!['direct', 'session', 'transaction'].includes(connectionMode)) {
    throw new Error('DATABASE_CONNECTION_MODE must be direct, session, or transaction.');
  }
  if (env.SUPABASE_PROJECT_REF !== undefined && !/^[a-z0-9]{20}$/.test(env.SUPABASE_PROJECT_REF)) {
    throw new Error('SUPABASE_PROJECT_REF must be a valid project reference.');
  }
  if (env.SUPABASE_URL !== undefined) {
    try {
      const url = new URL(env.SUPABASE_URL);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.port ||
        !/^[a-z0-9]{20}\.supabase\.co$/.test(url.hostname) || url.pathname !== '/' ||
        (env.SUPABASE_PROJECT_REF && url.hostname !== `${env.SUPABASE_PROJECT_REF}.supabase.co`)) throw new Error();
    } catch { throw new Error('SUPABASE_URL must be the HTTPS URL of the selected project.'); }
  }
  if (env.DATABASE_URL !== undefined) {
    checkConnection(env.DATABASE_URL, env, provider as DatabaseProvider, connectionMode as ConnectionMode, true);
  }
  if (env.MIGRATION_DATABASE_URL !== undefined) {
    // Migrations use direct connections. IPv4 session fallback is a separate,
    // explicitly configured mode; transaction pooling is never used for DDL.
    const migrationMode = env.MIGRATION_CONNECTION_MODE ?? 'direct';
    if (!['direct', 'session'].includes(migrationMode)) {
      throw new Error('MIGRATION_CONNECTION_MODE must be direct or session.');
    }
    checkConnection(env.MIGRATION_DATABASE_URL, env, provider as DatabaseProvider, migrationMode as ConnectionMode, false);
  }
  return Object.freeze({ provider: provider as DatabaseProvider, connectionMode: connectionMode as ConnectionMode,
    configured: Boolean(env.DATABASE_URL), migrationsConfigured: Boolean(env.MIGRATION_DATABASE_URL) });
}
