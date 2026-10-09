import { openRestrictedDatabase } from '../database/runtime.ts';
import { loadSupabaseRestConfig } from '../database/supabase-rest.ts';
import { createSupabaseIdentityVerifier } from './supabase.ts';
import type { AccessDependencies } from './routes.ts';

type Environment = Record<string, string | undefined>;

// Optional driver loading preserves the no-install health/test workflow.
// No impersonation/demo identity is substituted when infrastructure is absent.
export async function loadAccessDependencies(env: Environment = process.env): Promise<AccessDependencies | undefined> {
  if (!['true', 'false'].includes(env.AUTH_ENABLED ?? 'false')) throw new Error('AUTH_ENABLED must be true or false.');
  if (env.AUTH_ENABLED !== 'true') return undefined;
  const auth = loadSupabaseRestConfig(env);
  const verifier = createSupabaseIdentityVerifier(auth);
  const database = await openRestrictedDatabase(env, 'virtual_ink_api');
  return Object.freeze({ verifier, database });
}
