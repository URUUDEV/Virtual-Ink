export function provisioningEnvironment(env: Record<string, string | undefined>) {
  if (env.PROVISIONING_ENABLED !== 'true' || !['development', 'test'].includes(env.NODE_ENV ?? 'development') ||
    !env.PROVISIONING_DATABASE_URL || env.PROVISIONING_DATABASE_URL === env.DATABASE_URL) {
    throw new Error('Provisioning requires explicit development enablement and a separate restricted login.');
  }
  return { ...env, DATABASE_URL: env.PROVISIONING_DATABASE_URL, MIGRATION_DATABASE_URL: undefined };
}
