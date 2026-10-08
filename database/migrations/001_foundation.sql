-- Virtual Ink infrastructure only. Apply with the dedicated migration owner.
BEGIN;
DO $$ BEGIN
  IF current_database() NOT IN ('virtual_ink_development', 'virtual_ink_test') THEN
    RAISE EXCEPTION 'Foundation migration requires a dedicated development/test database';
  END IF;
END $$;
SELECT pg_advisory_xact_lock(78210341);
CREATE SCHEMA IF NOT EXISTS virtual_ink;
REVOKE ALL ON SCHEMA virtual_ink FROM PUBLIC;

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'virtual_ink_api') THEN
    CREATE ROLE virtual_ink_api NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'virtual_ink_worker') THEN
    CREATE ROLE virtual_ink_worker NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'virtual_ink_auditor') THEN
    CREATE ROLE virtual_ink_auditor NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS virtual_ink.schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- No free-form metadata: private content, addresses and URLs have no column.
CREATE TABLE IF NOT EXISTS virtual_ink.audit_events (
  id uuid PRIMARY KEY,
  occurred_at timestamptz NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('user', 'system')),
  actor_id uuid,
  tenant_id uuid,
  action text NOT NULL CHECK (action IN (
    'file.accessed', 'proof.accessed', 'membership.changed',
    'pricing.changed', 'support.accessed', 'system.probe'
  )),
  resource_id uuid NOT NULL,
  request_id uuid NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('allowed', 'denied')),
  CHECK (
    (actor_type = 'system' AND actor_id IS NULL AND action = 'system.probe') OR
    (actor_type = 'user' AND actor_id IS NOT NULL AND tenant_id IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS audit_events_tenant_time_idx
  ON virtual_ink.audit_events (tenant_id, occurred_at, id);
ALTER TABLE virtual_ink.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_ink.audit_events FORCE ROW LEVEL SECURITY;
-- No policies/grants yet: audited business actions stay blocked until Phase 2.

-- This queue accepts ONLY a labelled no-op probe, never tenant/customer work.
CREATE TABLE IF NOT EXISTS virtual_ink.background_jobs (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind = 'system.probe'),
  payload jsonb NOT NULL CHECK (payload = '{"demo":true}'::jsonb),
  state text NOT NULL DEFAULT 'queued' CHECK (state IN ('queued', 'completed', 'failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3),
  run_after timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CHECK ((state = 'completed') = (completed_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS background_jobs_ready_idx
  ON virtual_ink.background_jobs (run_after, id) WHERE state = 'queued';

REVOKE ALL ON ALL TABLES IN SCHEMA virtual_ink FROM PUBLIC;
GRANT USAGE ON SCHEMA virtual_ink TO virtual_ink_api, virtual_ink_worker, virtual_ink_auditor;
GRANT SELECT ON virtual_ink.background_jobs TO virtual_ink_worker;
GRANT UPDATE (state, attempts, completed_at) ON virtual_ink.background_jobs TO virtual_ink_worker;
-- API cannot read/write jobs; worker cannot read audits or files.
INSERT INTO virtual_ink.schema_migrations(version) VALUES ('001_foundation') ON CONFLICT DO NOTHING;
COMMIT;
