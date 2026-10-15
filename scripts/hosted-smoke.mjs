import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { readUpstreamJson } from '../src/backend/api/upstream-json.ts';

// Read-only smoke checks for this project's reviewed Vercel origins. No cookies,
// bearer tokens, bypass parameters, private records, provider writes or Auth POSTs.
const root = fileURLToPath(new URL('../', import.meta.url));
const target = new URL(process.env.HOSTED_CHECK_URL ?? 'https://virtual-ink.vercel.app');
if (target.protocol !== 'https:' || target.username || target.password || target.port || target.search || target.hash || target.pathname !== '/' ||
  !(target.hostname === 'virtual-ink.vercel.app' || /^virtual(?:-ink)?-[a-z0-9-]+-shadowrootsec-5679\.vercel\.app$/.test(target.hostname))) {
  throw new Error('Use an HTTPS Virtual Ink deployment URL copied from the approved Vercel project.');
}
const results = [];
async function check(path, expected, inspect, method = 'GET') {
  let status = null, passed = false;
  try {
    const response = await fetch(new URL(path, target), { method, redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(15000) });
    status = response.status;
    passed = status === expected && await inspect(response);
    // Page content, redirect queries, response headers and errors are not logged.
    await response.body?.cancel().catch(() => {});
  } catch { /* Fixed safe result only. Never print upstream text or private data. */ }
  results.push({ path, method, expected, actual: status, status: passed ? 'pass' : 'failed' });
}
for (const path of ['/', '/shop', '/login', '/register', '/vendors/join']) {
  await check(path, 200, response => response.headers.get('content-type')?.startsWith('text/html'));
}
for (const path of ['/health', '/api/v1/health']) {
  await check(path, 200, async response => {
    const body = await readUpstreamJson(response);
    return (body.data ?? body).service === 'Virtual Ink' && response.headers.get('cache-control')?.includes('no-store');
  });
  await check(path, 200, async response => await response.text() === '', 'HEAD');
}
for (const path of ['/api/v1/me', '/api/v1/memberships']) {
  await check(path, 401, async response => (await readUpstreamJson(response)).error?.code === 'UNAUTHENTICATED');
}
await check('/account', 307, response => {
  const location = response.headers.get('location');
  if (!location) return false;
  const redirect = new URL(location, target);
  return redirect.origin === target.origin && redirect.pathname === '/login';
});
await check('/api/v1/unimplemented-smoke-route', 404, async response => (await readUpstreamJson(response)).error?.code === 'NOT_FOUND');
const report = { check: 'hosted_read_only_smoke', date: new Date().toISOString(), origin: target.origin,
  status: results.every(result => result.status === 'pass') ? 'pass' : 'failed', results,
  limits: ['Guest reads only', 'Not genuine Auth/database/storage evidence', 'Not phase completion', 'No protection bypass'] };
await mkdir(resolve(root, 'coverage'), { recursive: true });
await writeFile(resolve(root, 'coverage/hosted-smoke.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === 'pass' ? 0 : 1;
