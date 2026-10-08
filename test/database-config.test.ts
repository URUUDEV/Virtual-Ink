import assert from 'node:assert/strict';
import test from 'node:test';
import { loadDatabaseConfig } from '../src/backend/database/config.ts';
import { loadInfrastructureConfig } from '../src/backend/config.ts';

// Synthetic config-only fixtures; no database/network call is made.
const ref = 'aaaaaaaaaaaaaaaaaaaa';
const base = { DATABASE_PROVIDER: 'supabase', SUPABASE_PROJECT_REF: ref,
  DATABASE_SSL_ROOT_CERT: 'D:/synthetic-test-ca.crt' };
const direct = `postgresql://virtual_ink_app:synthetic-secret@db.${ref}.supabase.co:5432/postgres?sslmode=verify-full`;
const session = `postgresql://virtual_ink_app.${ref}:synthetic-secret@aws-0-test.pooler.supabase.com:5432/postgres?sslmode=verify-full`;

test('provider can be selected before credentials without claiming a connection', () => {
  assert.deepEqual(loadDatabaseConfig({}), { provider: 'postgres', connectionMode: 'direct', configured: false, migrationsConfigured: false });
  assert.equal(loadDatabaseConfig({ DATABASE_PROVIDER: 'supabase' }).configured, false);
  assert.throws(() => loadDatabaseConfig({ DATABASE_PROVIDER: 'unknown' }), /postgres or supabase/);
});
test('Supabase direct and session settings are bound to a specific project', () => {
  assert.equal(loadDatabaseConfig({ ...base, DATABASE_URL: direct }).configured, true);
  const config = loadDatabaseConfig({ ...base, DATABASE_CONNECTION_MODE: 'session', DATABASE_URL: session });
  assert.equal(config.connectionMode, 'session');
  assert.equal(/secret|supabase\.co|synthetic-test/.test(JSON.stringify(config)), false);
  assert.throws(() => loadDatabaseConfig({ ...base, DATABASE_URL: direct.replace(ref, 'bbbbbbbbbbbbbbbbbbbb') }), /selected project/);
  assert.throws(() => loadDatabaseConfig({ ...base, DATABASE_CONNECTION_MODE: 'session', DATABASE_URL: session.replace(ref, 'bbbbbbbbbbbbbbbbbbbb') }), /selected project/);
});
test('hosted configuration requires verified TLS and a CA path', () => {
  assert.throws(() => loadDatabaseConfig({ ...base, DATABASE_URL: direct.replace('verify-full', 'require') }), /verify-full/);
  assert.throws(() => loadDatabaseConfig({ ...base, DATABASE_SSL_ROOT_CERT: '', DATABASE_URL: direct }), /ROOT_CERT/);
  assert.throws(() => loadDatabaseConfig({ ...base, DATABASE_URL: `${direct}&options=unsafe` }), /verify-full/);
  assert.throws(() => loadDatabaseConfig({ ...base, SUPABASE_PROJECT_REF: undefined, DATABASE_URL: direct }), /PROJECT_REF/);
});
test('application connections reject elevated Supabase database logins', () => {
  for (const user of ['postgres', 'supabase_admin', 'service_role']) {
    assert.throws(() => loadDatabaseConfig({ ...base, DATABASE_URL: direct.replace('virtual_ink_app:', `${user}:`) }), /least-privilege/);
  }
  assert.equal(loadDatabaseConfig({ ...base, MIGRATION_DATABASE_URL: direct.replace('virtual_ink_app:', 'postgres:') }).migrationsConfigured, true);
});
test('transaction pooling is application-only and validates its port', () => {
  const transaction = session.replace(':5432/', ':6543/');
  assert.equal(loadDatabaseConfig({ ...base, DATABASE_CONNECTION_MODE: 'transaction', DATABASE_URL: transaction }).configured, true);
  assert.throws(() => loadDatabaseConfig({ ...base, DATABASE_CONNECTION_MODE: 'transaction', DATABASE_URL: session }), /connection mode/);
  assert.throws(() => loadDatabaseConfig({ ...base, MIGRATION_CONNECTION_MODE: 'transaction', MIGRATION_DATABASE_URL: transaction }), /direct or session/);
});
test('project API URL validation rejects mismatches and non-HTTPS endpoints', () => {
  assert.equal(loadDatabaseConfig({ ...base, SUPABASE_URL: `https://${ref}.supabase.co` }).configured, false);
  assert.throws(() => loadDatabaseConfig({ ...base, SUPABASE_URL: `http://${ref}.supabase.co` }), /HTTPS/);
  assert.throws(() => loadDatabaseConfig({ ...base, SUPABASE_URL: 'https://bbbbbbbbbbbbbbbbbbbb.supabase.co' }), /selected project/);
});
test('owned PostgreSQL remains available and hosted destinations require TLS', () => {
  assert.equal(loadDatabaseConfig({ DATABASE_URL: 'postgresql://local_test@127.0.0.1/virtual_ink_test' }).provider, 'postgres');
  assert.throws(() => loadDatabaseConfig({ DATABASE_URL: 'postgresql://app@database.example.invalid/virtual_ink' }), /verify-full/);
  assert.equal(loadDatabaseConfig({ DATABASE_URL: 'postgresql://app@database.example.invalid/virtual_ink?sslmode=verify-full', DATABASE_SSL_ROOT_CERT: 'synthetic-ca.crt' }).configured, true);
});
test('public Supabase secrets are rejected while publishable configuration is allowed', () => {
  for (const key of ['NEXT_PUBLIC_SUPABASE_SECRET_KEY', 'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_ACCESS_TOKEN']) {
    assert.throws(() => loadInfrastructureConfig({ [key]: 'synthetic-private-value' }), /server-side/);
  }
  assert.throws(() => loadInfrastructureConfig({ NEXT_PUBLIC_CUSTOM_KEY: 'sb_secret_synthetic' }), /server-side/);
  assert.equal(loadInfrastructureConfig({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic' }).databaseConfigured, false);
});
