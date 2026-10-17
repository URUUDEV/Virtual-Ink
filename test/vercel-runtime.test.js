import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import vercelHandler from '../src/vercel.js';

test('Vercel native handler serves actual Node routes without starting a listener on import', async (t) => {
  const previousEnvironment=process.env.APPLICATION_ENVIRONMENT;
  process.env.APPLICATION_ENVIRONMENT='test';
  t.after(()=>{previousEnvironment===undefined?delete process.env.APPLICATION_ENVIRONMENT:process.env.APPLICATION_ENVIRONMENT=previousEnvironment;});
  const server = createServer(vercelHandler);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(() => resolve()); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(`${base}/health`)).status, 200);
  assert.equal((await fetch(`${base}/api/v1/me`, { headers: { 'X-Role': 'PlatformOperator' } })).status, 401);
  assert.equal((await fetch(`${base}/api/auth/login`, { method: 'POST' })).status, 404);
});

test('Vercel startup failure returns safe 503 without exposing configuration or exiting the process', async (t) => {
  const previous = process.env.AUTH_ENABLED;
  process.env.AUTH_ENABLED = 'synthetic-invalid-setting';
  t.after(() => { previous === undefined ? delete process.env.AUTH_ENABLED : process.env.AUTH_ENABLED = previous; });
  const { default: broken } = await import('../src/vercel.js?unavailable-fixture');
  const server = createServer(broken);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(() => resolve()); }));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/me`);
  assert.equal(response.status, 503);
  const body = await response.text();
  assert.equal(JSON.parse(body).error.code, 'IDENTITY_UNAVAILABLE');
  assert.ok(!body.includes('synthetic-invalid-setting') && !body.includes('AUTH_ENABLED'));
});
