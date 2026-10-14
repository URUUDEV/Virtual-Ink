import { X509Certificate } from 'node:crypto';
import { hasPublicSecret } from '../config.ts';
import { loadDatabaseConfig } from '../database/config.ts';
import { loadSupabaseRestConfig } from '../database/supabase-rest.ts';
import { createSupabaseIdentityVerifier } from '../identity/supabase.ts';
import { provisioningEnvironment } from '../provisioning/config.ts';
import { smokeSettings } from './smoke-config.ts';

type Environment = Record<string, string | undefined>;
export type SetupCheck = Readonly<{ id: string; status: 'pass' | 'blocked' }>;
export function certificateIsUsable(contents: string, now = Date.now()): boolean {
  try {
    if (contents.length > 65536 || contents.includes('PRIVATE KEY')) return false;
    const certificate = new X509Certificate(contents);
    return certificate.ca && Date.parse(certificate.validFrom) <= now && Date.parse(certificate.validTo) > now;
  } catch { return false; }
}

function settingsValid(env: Environment, provisioning = false) {
  try {
    const selected = provisioning ? provisioningEnvironment(env) : env;
    if (!loadDatabaseConfig(selected).configured) return false;
    createSupabaseIdentityVerifier(loadSupabaseRestConfig(selected));
    return true;
  } catch { return false; }
}

export function checkSetup(api: Environment, provisioning: Environment,
  facts: Readonly<{ nodeMajor: number; driverInstalled: boolean; apiFilePresent: boolean;
    provisioningFilePresent: boolean; apiCertificateUsable: boolean; provisioningCertificateUsable: boolean }>): readonly SetupCheck[] {
  const checks: SetupCheck[] = [];
  const add = (id: string, passes: boolean) => checks.push(Object.freeze({ id, status: passes ? 'pass' : 'blocked' }));
  add('NODE_24', facts.nodeMajor === 24);
  add('PG_DRIVER', facts.driverInstalled);
  add('API_ENV_FILE', facts.apiFilePresent);
  add('PROVISIONING_ENV_FILE', facts.provisioningFilePresent);
  add('API_ENV_SEPARATION', !['PROVISIONING_DATABASE_URL', 'PROVISIONING_ENABLED', 'MIGRATION_DATABASE_URL', 'TEST_DATABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY'].some((key) => Boolean(api[key])));
  add('PUBLIC_SECRET_BOUNDARY', ![api, provisioning].some(hasPublicSecret));
  add('API_CONFIGURATION', settingsValid(api));
  add('PROVISIONING_CONFIGURATION', settingsValid(provisioning, true));
  add('AUTH_ENABLED', api.AUTH_ENABLED === 'true');
  add('PROVISIONING_ENABLED', provisioning.PROVISIONING_ENABLED === 'true');
  add('API_CA', facts.apiCertificateUsable);
  add('PROVISIONING_CA', facts.provisioningCertificateUsable);
  let sameTarget = false;
  let separateLogin = false;
  try {
    const left = new URL(api.DATABASE_URL!);
    const right = new URL(provisioning.PROVISIONING_DATABASE_URL!);
    const leftUser = decodeURIComponent(left.username);
    const rightUser = decodeURIComponent(right.username);
    const supabase = api.DATABASE_PROVIDER === 'supabase' && provisioning.DATABASE_PROVIDER === 'supabase';
    const normalUser = (user: string) => supabase ? user.split('.')[0] : user;
    separateLogin = Boolean(leftUser && rightUser && normalUser(leftUser) !== normalUser(rightUser));
    sameTarget = api.DATABASE_PROVIDER === provisioning.DATABASE_PROVIDER &&
      new URL(api.SUPABASE_URL!).origin === new URL(provisioning.SUPABASE_URL!).origin &&
      (supabase ? Boolean(api.SUPABASE_PROJECT_REF && api.SUPABASE_PROJECT_REF === provisioning.SUPABASE_PROJECT_REF) :
        left.hostname === right.hostname && (left.port || '5432') === (right.port || '5432') && left.pathname === right.pathname);
  } catch { /* Only fixed check IDs are exposed. */ }
  add('SAME_PROJECT_DATABASE', sameTarget);
  add('DISTINCT_DATABASE_LOGINS', separateLogin);
  let smokeValid = false;
  try { smokeSettings(api); smokeValid = true; } catch { /* No supplied values in output. */ }
  add('SMOKE_CONFIGURATION', smokeValid);
  return Object.freeze(checks);
}
