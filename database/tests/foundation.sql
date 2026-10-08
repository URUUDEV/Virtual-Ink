-- Run against virtual_ink_test after migration. Every data change rolls back.
BEGIN;
DO $$ BEGIN
  IF current_database() <> 'virtual_ink_test' THEN RAISE EXCEPTION 'Test database required'; END IF;
  IF NOT EXISTS (SELECT FROM virtual_ink.schema_migrations WHERE version = '001_foundation') THEN
    RAISE EXCEPTION 'Migration missing';
  END IF;
  IF has_table_privilege('virtual_ink_api', 'virtual_ink.background_jobs', 'SELECT') OR
     has_table_privilege('virtual_ink_api', 'virtual_ink.audit_events', 'SELECT') OR
     has_table_privilege('virtual_ink_worker', 'virtual_ink.audit_events', 'SELECT') THEN
    RAISE EXCEPTION 'Unexpected role access';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_class WHERE oid = 'virtual_ink.audit_events'::regclass AND relrowsecurity AND relforcerowsecurity) THEN
    RAISE EXCEPTION 'Audit deny-by-default protection missing';
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname IN ('virtual_ink_api', 'virtual_ink_worker', 'virtual_ink_auditor')
     AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls OR rolcanlogin)) THEN
    RAISE EXCEPTION 'Unsafe infrastructure role';
  END IF;
END $$;
DO $$ BEGIN
  BEGIN
    INSERT INTO virtual_ink.background_jobs(id, kind, payload)
    VALUES ('22222222-2222-4222-8222-222222222222', 'system.probe', '{"demo":true,"file":"private"}');
    RAISE EXCEPTION 'Private job payload accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO virtual_ink.audit_events(id, occurred_at, actor_type, action, resource_id, request_id, outcome)
    VALUES ('33333333-3333-4333-8333-333333333333', now(), 'user', 'file.accessed',
      '33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'allowed');
    RAISE EXCEPTION 'Unscoped user audit accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;
INSERT INTO virtual_ink.background_jobs(id, kind, payload)
VALUES ('44444444-4444-4444-8444-444444444444', 'system.probe', '{"demo":true}');
SET LOCAL ROLE virtual_ink_api;
DO $$ BEGIN
  BEGIN
    PERFORM id FROM virtual_ink.background_jobs;
    RAISE EXCEPTION 'API read jobs';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;
SET LOCAL ROLE virtual_ink_worker;
UPDATE virtual_ink.background_jobs SET state = 'completed', attempts = 1, completed_at = now()
WHERE id = '44444444-4444-4444-8444-444444444444';
RESET ROLE;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM virtual_ink.background_jobs WHERE id = '44444444-4444-4444-8444-444444444444' AND state = 'completed') THEN
    RAISE EXCEPTION 'Worker could not complete demo probe';
  END IF;
END $$;
ROLLBACK;
SELECT 'Virtual Ink foundation SQL assertions passed' AS result;
