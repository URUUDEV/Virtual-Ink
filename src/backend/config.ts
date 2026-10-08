import { isIP } from 'node:net';

type Environment = Record<string, string | undefined>;
export type RuntimeConfig = Readonly<{
  nodeEnv: 'development' | 'test' | 'production'; host: string; port: number;
}>;

// Error messages never reflect values or secret connection URLs.
export function loadConfig(env: Environment = process.env): RuntimeConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const host = env.HOST ?? '127.0.0.1';
  const portText = env.PORT ?? '3000';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production.');
  }
  if (isIP(host) === 0) throw new Error('HOST must be an IPv4 or IPv6 address.');
  if (!/^\d{1,5}$/.test(portText) || Number(portText) < 1 || Number(portText) > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535.');
  }
  return Object.freeze({ nodeEnv: nodeEnv as RuntimeConfig['nodeEnv'], host, port: Number(portText) });
}

function flag(env: Environment, key: string): boolean {
  const value = env[key] ?? 'false';
  if (value !== 'true' && value !== 'false') throw new Error(`${key} must be true or false.`);
  return value === 'true';
}

export function validateDatabaseUrl(value: string): URL {
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname ||
      !url.username || url.pathname.length < 2 || url.hash) throw new Error();
    decodeURIComponent(url.username);
    decodeURIComponent(url.password);
    return url;
  } catch { throw new Error('Database connection URL is invalid.'); }
}

export function loadInfrastructureConfig(env: Environment = process.env) {
  if (Object.entries(env).some(([key, value]) => key.startsWith('NEXT_PUBLIC_') && (
    /^NEXT_PUBLIC_(DATABASE|MIGRATION|TEST_DATABASE|S3_|STORAGE_|AUTH_|AUDIT_|JOB)/.test(key) ||
    /^NEXT_PUBLIC_SUPABASE_(SECRET|SERVICE_ROLE|ACCESS_TOKEN|DB_PASSWORD|JWT_SECRET)/.test(key) ||
    value?.startsWith('sb_secret_')))) {
    throw new Error('Sensitive configuration must remain server-side.');
  }
  const runtime = loadConfig(env);
  const jobsEnabled = flag(env, 'JOBS_ENABLED');
  const storageEnabled = flag(env, 'STORAGE_ENABLED');
  if (env.DATABASE_URL !== undefined) validateDatabaseUrl(env.DATABASE_URL);
  if (jobsEnabled && !env.DATABASE_URL) throw new Error('JOBS_ENABLED requires DATABASE_URL.');
  const keys = ['S3_ENDPOINT', 'S3_REGION', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];
  if (storageEnabled) {
    if (keys.some((key) => !env[key]?.trim())) throw new Error('STORAGE_ENABLED requires all S3 settings.');
    try {
      const endpoint = new URL(env.S3_ENDPOINT!);
      const local = ['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname);
      if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash ||
        (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && local && runtime.nodeEnv !== 'production'))) {
        throw new Error();
      }
    } catch { throw new Error('S3_ENDPOINT must use HTTPS, except local development HTTP.'); }
  }
  return Object.freeze({ ...runtime, jobsEnabled, storageEnabled, databaseConfigured: Boolean(env.DATABASE_URL) });
}
