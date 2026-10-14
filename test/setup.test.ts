import assert from 'node:assert/strict';
import test from 'node:test';
import { rootCertificates } from 'node:tls';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { certificateIsUsable, checkSetup } from '../src/backend/setup/checks.ts';
import { assertDatabaseFoundation, type DatabaseGroup } from '../src/backend/database/readiness.ts';
import type { SqlDatabase, SqlParameter } from '../src/backend/database/ports.ts';
import { initializeSettings } from '../scripts/setup-init.ts';

const project = 'odgxcuwueessxfsoveza';
const common = { DATABASE_PROVIDER: 'supabase', DATABASE_CONNECTION_MODE: 'direct', SUPABASE_PROJECT_REF: project,
  SUPABASE_URL: `https://${project}.supabase.co`, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic', DATABASE_SSL_ROOT_CERT: 'synthetic-ca.crt' };
const api = { ...common, AUTH_ENABLED: 'true', DATABASE_URL: `postgresql://virtual_ink_api_login:SYNTHETIC_PRIVATE_PASSWORD@db.${project}.supabase.co/postgres?sslmode=verify-full`,
  SMOKE_TENANT_ID: '11111111-1111-4111-8111-111111111111', SMOKE_DENIED_TENANT_ID: '22222222-2222-4222-8222-222222222222' };
const provisioning = { ...common, PROVISIONING_ENABLED: 'true', NODE_ENV: 'development',
  PROVISIONING_DATABASE_URL: `postgresql://virtual_ink_provisioner_login:SYNTHETIC_PRIVATE_PASSWORD@db.${project}.supabase.co/postgres?sslmode=verify-full` };
const facts = { nodeMajor: 24, driverInstalled: true, apiFilePresent: true, provisioningFilePresent: true,
  apiCertificateUsable: true, provisioningCertificateUsable: true };

test('configured setup emits only fixed check IDs and statuses; no login or password data', () => {
  const checks = checkSetup(api, provisioning, facts);
  assert.equal(checks.length, 15);
  assert.ok(checks.every((check) => check.status === 'pass'));
  const output = JSON.stringify(checks);
  for (const privateValue of ['SYNTHETIC_PRIVATE_PASSWORD', 'sb_publishable_synthetic', project, 'virtual_ink_api_login', 'synthetic-ca.crt']) {
    assert.equal(output.includes(privateValue), false);
  }
});

test('missing dependencies, environment files, enablement and certificates are separate blockers', () => {
  const checks = checkSetup({}, {}, { ...facts, nodeMajor: 23, driverInstalled: false, apiFilePresent: false,
    provisioningFilePresent: false, apiCertificateUsable: false, provisioningCertificateUsable: false });
  for (const id of ['NODE_24', 'PG_DRIVER', 'API_ENV_FILE', 'PROVISIONING_ENV_FILE', 'AUTH_ENABLED', 'API_CA']) {
    assert.equal(checks.find((check) => check.id === id)?.status, 'blocked');
  }
});

test('API environments containing administrative credentials are rejected without disclosure', () => {
  for (const key of ['PROVISIONING_DATABASE_URL', 'MIGRATION_DATABASE_URL', 'TEST_DATABASE_URL', 'SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
    const checks = checkSetup({ ...api, [key]: 'SYNTHETIC_PRIVATE_ADMIN_SECRET' }, provisioning, facts);
    assert.equal(checks.find((check) => check.id === 'API_ENV_SEPARATION')?.status, 'blocked');
    assert.equal(JSON.stringify(checks).includes('SYNTHETIC_PRIVATE_ADMIN_SECRET'), false);
  }
});

test('public variables cannot contain server credentials even under a generic key name', () => {
  for (const [key, value] of [['NEXT_PUBLIC_DATABASE_URL', 'private'], ['NEXT_PUBLIC_KEY', 'sb_secret_synthetic'],
    ['NEXT_PUBLIC_CONFIGURATION', 'postgresql://private:private@localhost/test'], ['NEXT_PUBLIC_KEY', 'eyJsynthetic']]) {
    const checks = checkSetup({ ...api, [key]: value }, provisioning, facts);
    assert.equal(checks.find((check) => check.id === 'PUBLIC_SECRET_BOUNDARY')?.status, 'blocked');
  }
});

test('different URL strings or passwords cannot disguise reuse of the same database login', () => {
  const sameLogin = { ...provisioning, PROVISIONING_DATABASE_URL: api.DATABASE_URL.replace('SYNTHETIC_PRIVATE_PASSWORD', 'OTHER_SYNTHETIC_PASSWORD') };
  assert.equal(checkSetup(api, sameLogin, facts).find((check) => check.id === 'DISTINCT_DATABASE_LOGINS')?.status, 'blocked');
});

test('cross-project environments and wrong smoke tenant selectors are rejected', () => {
  const otherProject = { ...provisioning, SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst', SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co' };
  assert.equal(checkSetup(api, otherProject, facts).find((check) => check.id === 'SAME_PROJECT_DATABASE')?.status, 'blocked');
  const invalidSmoke = { ...api, SMOKE_DENIED_TENANT_ID: api.SMOKE_TENANT_ID };
  assert.equal(checkSetup(invalidSmoke, provisioning, facts).find((check) => check.id === 'SMOKE_CONFIGURATION')?.status, 'blocked');
});

test('owned PostgreSQL setup remains available but cannot combine different database targets', () => {
  const local = { ...common, DATABASE_PROVIDER: 'postgres', DATABASE_CONNECTION_MODE: 'direct' };
  const left = { ...api, ...local, DATABASE_URL: 'postgresql://api:synthetic@localhost:55432/virtual_ink_development' };
  const right = { ...provisioning, ...local, PROVISIONING_DATABASE_URL: 'postgresql://provisioner:synthetic@localhost:55432/virtual_ink_development' };
  assert.ok(checkSetup(left, right, facts).every((check) => check.status === 'pass'));
  assert.equal(checkSetup(left, { ...right, PROVISIONING_DATABASE_URL: right.PROVISIONING_DATABASE_URL.replace('development', 'test') }, facts)
    .find((check) => check.id === 'SAME_PROJECT_DATABASE')?.status, 'blocked');
});

test('certificate checks parse public CA material and reject missing, expired or private-key content', () => {
  const certificate = rootCertificates.find((value) => certificateIsUsable(value));
  assert.ok(certificate, 'Node trust bundle has a currently valid public certificate');
  assert.equal(certificateIsUsable(certificate, 0), false);
  assert.equal(certificateIsUsable(certificate, Date.parse('2999-01-01')), false);
  assert.equal(certificateIsUsable(`${certificate}\n-----BEGIN PRIVATE KEY-----\nsynthetic`), false);
  assert.equal(certificateIsUsable('-----BEGIN CERTIFICATE-----\ninvalid'), false);
});

function foundationRows(group: DatabaseGroup): Record<string, unknown>[] {
  return ['users', 'identities', 'user_roles', 'tenants', 'memberships', 'operator_grants', 'access_audits', 'provisioning_audits', 'membership_list_audits'].map((table_name) => {
    const select = group === 'virtual_ink_api' ? !['access_audits', 'provisioning_audits', 'membership_list_audits'].includes(table_name) : !['access_audits', 'operator_grants', 'membership_list_audits'].includes(table_name);
    const insert = group === 'virtual_ink_api' ? ['access_audits', 'membership_list_audits'].includes(table_name) : select;
    return { table_name, relkind: 'r', relrowsecurity: true, relforcerowsecurity: true,
      actual_select: select, actual_insert: insert, column_select: select, column_insert: insert,
      unsafe_table_rights: false, unsafe_column_rights: false, schema_usage: true, schema_create: false,
      public_create: false, unexpected_table_access: false, audit_constraint: true };
  });
}
function catalogDatabase(rows: Record<string, unknown>[]): SqlDatabase {
  return { async query<Row extends Record<string, unknown>>(_sql: string, parameters: readonly SqlParameter[]) {
    assert.ok(['virtual_ink_api', 'virtual_ink_provisioner'].includes(String(parameters[0])));
    return { rows: rows as Row[], rowCount: rows.length };
  }, async close() {}, async transaction() { throw new Error('Catalog checks do not create business transactions.'); } };
}

test('foundation check accepts only the current nine tables and exact group permissions', async () => {
  for (const group of ['virtual_ink_api', 'virtual_ink_provisioner'] as const) {
    await assertDatabaseFoundation(catalogDatabase(foundationRows(group)), group);
  }
});

test('missing/duplicate tables, views, RLS drift, disabled commit checks and DDL rights fail closed', async () => {
  for (const group of ['virtual_ink_api', 'virtual_ink_provisioner'] as const) {
    for (const change of [{ relkind: 'v' }, { relrowsecurity: false }, { relforcerowsecurity: false },
      { audit_constraint: false }, { schema_usage: false }, { schema_create: true }, { public_create: true },
      { unsafe_table_rights: true }, { unsafe_column_rights: true }, { unexpected_table_access: true }]) {
      const rows = foundationRows(group); Object.assign(rows[0], change);
      await assert.rejects(assertDatabaseFoundation(catalogDatabase(rows), group));
    }
    const rows = foundationRows(group);
    await assert.rejects(assertDatabaseFoundation(catalogDatabase(rows.slice(1)), group));
    await assert.rejects(assertDatabaseFoundation(catalogDatabase([...rows.slice(1), rows[1]]), group));
  }
});

test('column-only audit access and missing required privileges cannot pass the foundation check', async () => {
  const rows = foundationRows('virtual_ink_api');
  rows[7].column_select = true;
  await assert.rejects(assertDatabaseFoundation(catalogDatabase(rows), 'virtual_ink_api'));
  rows[7].column_select = false; delete rows[0].actual_select;
  await assert.rejects(assertDatabaseFoundation(catalogDatabase(rows), 'virtual_ink_api'));
});

test('setup initialization creates disabled templates and never overwrites existing settings', async () => {
  const root = resolve('.private', `setup-fixture-${randomUUID()}`);
  await mkdir(resolve(root, 'examples/provisioning'), { recursive: true });
  await writeFile(resolve(root, '.env.example'), 'AUTH_ENABLED=false\n');
  await writeFile(resolve(root, 'examples/provisioning/provisioning.env.example'), 'PROVISIONING_ENABLED=false\n');
  assert.ok((await initializeSettings(root)).every((file) => file.status === 'created_disabled'));
  await writeFile(resolve(root, '.env'), 'SYNTHETIC_PRIVATE_SETTING=keep\n');
  assert.ok((await initializeSettings(root)).every((file) => file.status === 'preserved'));
  assert.equal(await readFile(resolve(root, '.env'), 'utf8'), 'SYNTHETIC_PRIVATE_SETTING=keep\n');
});
