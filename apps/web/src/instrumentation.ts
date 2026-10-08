export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { loadInfrastructureConfig } = await import('@backend/config.ts');
    loadInfrastructureConfig();
    const { loadDatabaseConfig } = await import('@backend/database/config.ts');
    loadDatabaseConfig();
  }
}
