import assert from 'node:assert/strict';
import test from 'node:test';
import { connectionEnvironment } from '../scripts/database.ts';

test('database commands are restricted to dedicated local databases', () => {
  const env = connectionEnvironment('postgresql://test_user:demo%2Dsecret@127.0.0.1:55439/virtual_ink_test', true);
  assert.equal(env.PGHOST, '127.0.0.1');
  assert.equal(env.PGDATABASE, 'virtual_ink_test');
  assert.equal(env.PGUSER, 'test_user');
  assert.equal(env.PGPASSWORD, 'demo-secret');
  assert.equal(env.PGPORT, '55439');
  for (const value of [
    'postgresql://test_user@remote.example.invalid/virtual_ink_test',
    'postgresql://test_user@127.0.0.1/customer_database',
    'postgresql://test_user@127.0.0.1/virtual_ink_test?options=-csearch_path%3Dpublic',
    'postgresql://test_user@127.0.0.1/virtual_ink_development',
  ]) {
    assert.throws(() => connectionEnvironment(value, true), /dedicated local/);
  }
});
