import test from 'node:test';
import assert from 'node:assert/strict';
import { createPooledDatabase } from '../src/backend/database/pool.ts';
import { loadDatabaseConfig } from '../src/backend/database/config.ts';
import { openRestrictedDatabase } from '../src/backend/database/runtime.ts';
import { loadAccessDependencies } from '../src/backend/identity/runtime.ts';

test('standalone database reads release connections after success or failure and close the pool', async () => {
  let releases = 0, closes = 0, reject = false;
  const db = createPooledDatabase({
    async connect() { return { async query(sql, parameters) {
      assert.equal(sql, 'SELECT synthetic WHERE id=$1');
      assert.deepEqual(parameters, ['synthetic']);
      if (reject) throw new Error('synthetic query failure');
      return { rows: [{ safe: true }], rowCount: null };
    }, release() { releases++; } }; },
    async end() { closes++; },
  });
  assert.deepEqual(await db.query('SELECT synthetic WHERE id=$1', ['synthetic']), { rows: [{ safe: true }], rowCount: 0 });
  reject = true;
  await assert.rejects(db.query('SELECT synthetic WHERE id=$1', ['synthetic']), /query failure/);
  assert.equal(releases, 2);
  await db.close();
  assert.equal(closes, 1);
});

test('transaction reads normalize absent row counts without losing the transaction boundary', async () => {
  let released = false;
  const db = createPooledDatabase({ async connect() { return {
    async query() { return { rows: [], rowCount: null }; }, release() { released = true; },
  }; }, async end() {} });
  assert.deepEqual(await db.transaction(tx => tx.query('SELECT synthetic', [])), { rows: [], rowCount: 0 });
  assert.equal(released, true);
});

test('a failed database commit rolls back and never returns its tentative result', async () => {
  const statements: string[] = [];
  let released = false;
  const db = createPooledDatabase({ async connect() { return {
    async query(sql) {
      statements.push(sql);
      if (sql === 'COMMIT') throw new Error('synthetic commit failure');
      return { rows: [], rowCount: 0 };
    }, release() { released = true; },
  }; }, async end() {} });
  await assert.rejects(db.transaction(async () => ({ tentative: true })), /commit failure/);
  assert.equal(statements.at(-1), 'ROLLBACK');
  assert.equal(released, true);
});

test('migration configuration rejects invalid modes and validates session fallback separately', () => {
  const common = { DATABASE_PROVIDER: 'supabase', SUPABASE_PROJECT_REF: 'aaaaaaaaaaaaaaaaaaaa', DATABASE_SSL_ROOT_CERT: 'synthetic-ca.pem',
    MIGRATION_DATABASE_URL: 'postgresql://postgres.aaaaaaaaaaaaaaaaaaaa:synthetic@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=verify-full' };
  assert.throws(() => loadDatabaseConfig({ ...common, MIGRATION_CONNECTION_MODE: 'transaction' }), /MIGRATION_CONNECTION_MODE/);
  assert.equal(loadDatabaseConfig({ ...common, MIGRATION_CONNECTION_MODE: 'session' }).migrationsConfigured, true);
});

test('restricted startup denies missing configuration and unreadable CA before network use', async () => {
  await assert.rejects(openRestrictedDatabase({}, 'virtual_ink_api'), /connection is required/);
  const env = { DATABASE_PROVIDER: 'supabase', SUPABASE_PROJECT_REF: 'aaaaaaaaaaaaaaaaaaaa',
    DATABASE_URL: 'postgresql://synthetic:synthetic@db.aaaaaaaaaaaaaaaaaaaa.supabase.co:5432/postgres?sslmode=verify-full',
    DATABASE_SSL_ROOT_CERT: 'synthetic-missing-ca-file.pem' };
  await assert.rejects(openRestrictedDatabase(env, 'virtual_ink_api'), /readable configured CA/);
  await assert.rejects(loadAccessDependencies({ ...env, AUTH_ENABLED: 'true', SUPABASE_URL: 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic' }), /readable configured CA/);
});
