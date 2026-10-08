import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request as httpRequest } from 'node:http';
import test from 'node:test';
import { createApp } from '../src/app.js';

async function start(t, options) {
  const server = createApp(options);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.closeAllConnections();
    server.close((error) => error ? reject(error) : resolve());
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

test('public health endpoint returns only service status and safe headers', async (t) => {
  const base = await start(t);
  const response = await fetch(`${base}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { service: 'Virtual Ink', status: 'ok' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});

test('HEAD health check has no body', async (t) => {
  const base = await start(t);
  const response = await fetch(`${base}/health`, { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
});

test('Node adapter serves the shared versioned TypeScript health route', async (t) => {
  const base = await start(t);
  const response = await fetch(`${base}/api/v1/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.data, { service: 'Virtual Ink', status: 'ok' });
  assert.equal(body.meta.requestId, response.headers.get('x-request-id'));
});

test('protected Node endpoints reject guests and give unavailable status before configuration', async (t) => {
  const base = await start(t);
  for (const path of ['/api/v1/me', '/api/v1/tenants/22222222-2222-4222-8222-222222222222/access']) {
    assert.equal((await fetch(`${base}${path}`)).status, 401);
    assert.equal((await fetch(`${base}${path}`, { headers: { Authorization: 'Bearer synthetic-token' } })).status, 503);
    assert.equal((await fetch(`${base}${path}`, { method: 'POST' })).status, 405);
  }
});

test('unknown API and private file/proof routes remain unavailable', async (t) => {
  const base = await start(t);
  for (const path of ['/api/v1/unknown', '/api/v1/files/private', '/api/v1/proofs/private']) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, 'NOT_FOUND');
  }
});

test('TRACE to versioned health is rejected without terminating the server', async (t) => {
  const base = await start(t);
  const status = await new Promise((resolve, reject) => {
    const request = httpRequest(`${base}/api/v1/health`, { method: 'TRACE' }, (response) => {
      response.resume();
      response.on('end', () => resolve(response.statusCode));
    });
    request.on('error', reject);
    request.end();
  });
  assert.equal(status, 405);
  assert.equal((await fetch(`${base}/health`)).status, 200);
});

test('unsupported health methods return 405 with permitted methods', async (t) => {
  const base = await start(t);
  const response = await fetch(`${base}/health`, { method: 'POST', body: 'ignored' });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET, HEAD');
  assert.equal((await response.json()).error, 'Method not allowed');
});

test('unknown routes return 404 and a matching request ID without reflecting input', async (t) => {
  const base = await start(t);
  const response = await fetch(`${base}/private-file?token=secret`);
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.error, 'Not found');
  assert.equal(body.requestId, response.headers.get('x-request-id'));
  assert.equal(JSON.stringify(body).includes('secret'), false);
});

test('request logs exclude sensitive inputs and use server-generated unique IDs', async (t) => {
  const events = [];
  const base = await start(t, { logger: (event) => events.push(event) });
  for (let i = 0; i < 2; i++) {
    const response = await fetch(`${base}/health?token=secret-token`, {
      headers: { authorization: 'Bearer secret-auth', cookie: 'secret-cookie', 'x-request-id': 'untrusted-id' },
    });
    await response.text();
  }
  assert.equal(events.length, 2);
  assert.notEqual(events[0].requestId, events[1].requestId);
  assert.deepEqual(Object.keys(events[0]).sort(), ['event', 'requestId', 'statusCode']);
  assert.equal(events[0].statusCode, 200);
  assert.equal(/secret|untrusted/.test(JSON.stringify(events)), false);
});
