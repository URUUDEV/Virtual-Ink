import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../src/config.js';

test('configuration uses local defaults and is immutable', () => {
  const config = loadConfig({});
  assert.deepEqual(config, { nodeEnv: 'development', host: '127.0.0.1', port: 3000 });
  assert.equal(Object.isFrozen(config), true);
});

test('configuration accepts explicit settings including IPv6', () => {
  assert.deepEqual(loadConfig({ NODE_ENV: 'test', HOST: '::1', PORT: '65535' }), {
    nodeEnv: 'test', host: '::1', port: 65535,
  });
});

test('configuration rejects invalid ports without echoing supplied values', () => {
  for (const value of ['', '0', '-1', '65536', '3.5', '3000secret', ' 3000 ', '1e3']) {
    assert.throws(() => loadConfig({ PORT: value }), {
      message: 'PORT must be an integer from 1 to 65535.',
    });
  }
});

test('configuration rejects invalid environment and host', () => {
  for (const value of ['', 'staging', 'secret-value']) {
    assert.throws(() => loadConfig({ NODE_ENV: value }), /NODE_ENV must be/);
  }
  for (const value of ['', 'https://example.invalid', 'secret-value']) {
    assert.throws(() => loadConfig({ HOST: value }), /HOST must be/);
  }
});
