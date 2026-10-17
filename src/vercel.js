import { createRequestHandler } from './app.js';
import { loadAccessDependencies } from './backend/identity/runtime.ts';
import { loadInfrastructureConfig } from './backend/config.ts';
import { loadDatabaseConfig } from './backend/database/config.ts';
import { randomUUID } from 'node:crypto';
import { assertEnvironmentIsolation } from './backend/setup/environment-isolation.ts';

// Vercel owns the listener/lifecycle. Initialize the restricted pool at runtime,
// never while importing the entrypoint during a build.
let handler;
function runtimeHandler() {
  return handler ??= (async () => {
    assertEnvironmentIsolation();
    loadInfrastructureConfig();
    loadDatabaseConfig();
    const access = await loadAccessDependencies();
    return createRequestHandler({ access, logger(event) {
      process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}\n`);
    } });
  })();
}
export default async function vercelHandler(request, response) {
  try { await (await runtimeHandler())(request, response); }
  catch {
    if (response.headersSent) { response.end(); return; }
    const requestId = randomUUID();
    response.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Request-Id': requestId });
    response.end(JSON.stringify({ error: { code: 'IDENTITY_UNAVAILABLE', message: 'Identity service is unavailable.' }, meta: { requestId } }));
  }
}
