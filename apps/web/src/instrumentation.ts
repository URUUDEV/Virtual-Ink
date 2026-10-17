export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { assertEnvironmentIsolation } = await import('@backend/setup/environment-isolation.ts');
    assertEnvironmentIsolation();
    const { loadInfrastructureConfig } = await import('@backend/config.ts');
    loadInfrastructureConfig();
    const { loadDatabaseConfig } = await import('@backend/database/config.ts');
    loadDatabaseConfig();
  }
}
