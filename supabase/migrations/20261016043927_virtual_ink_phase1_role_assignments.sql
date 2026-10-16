-- Disabled Phase 1 assignment foundation. No HTTP, provisioner or vendor writes.
-- Apply only to a reviewed fresh development target after the release gates.
CREATE SCHEMA virtual_ink_phase1;
REVOKE ALL ON SCHEMA virtual_ink_phase1 FROM PUBLIC;
CREATE ROLE virtual_ink_phase1_reader NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
GRANT virtual_ink_api TO virtual_ink_phase1_reader WITH INHERIT TRUE, SET FALSE;
GRANT USAGE ON SCHEMA virtual_ink_phase1 TO virtual_ink_phase1_reader;

CREATE TABLE virtual_ink_phase1.role_assignments (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES virtual_ink.users(id),
  role text NOT NULL CHECK (role IN ('CUSTOMER','VENDOR','DESIGNER','DELIVERY_PARTNER',
    'ORGANIZATION_MEMBER','ORGANIZATION_ADMIN','ADMIN','SUPER_ADMIN')),
  active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1 CHECK (version IN (1,2)),
  granted_by uuid NOT NULL REFERENCES virtual_ink.users(id),
  approval_reference uuid NOT NULL,
  reason_code text NOT NULL CHECK (reason_code ~ '^[a-z][a-z0-9_]{2,63}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid REFERENCES virtual_ink.users(id),
  revocation_approval_reference uuid,
  revocation_reason_code text CHECK (revocation_reason_code ~ '^[a-z][a-z0-9_]{2,63}$'),
  revoked_at timestamptz,
  CHECK ((active AND version=1 AND revoked_by IS NULL AND revoked_at IS NULL
      AND revocation_approval_reference IS NULL AND revocation_reason_code IS NULL)
    OR (NOT active AND version=2 AND revoked_by IS NOT NULL AND revoked_at IS NOT NULL AND revoked_at>=created_at
      AND revocation_approval_reference IS NOT NULL AND revocation_reason_code IS NOT NULL))
);
CREATE UNIQUE INDEX role_assignments_one_active_user_idx
  ON virtual_ink_phase1.role_assignments(user_id) WHERE active;
CREATE INDEX role_assignments_user_history_idx ON virtual_ink_phase1.role_assignments(user_id,created_at,id);
CREATE INDEX role_assignments_granted_by_idx ON virtual_ink_phase1.role_assignments(granted_by);
CREATE INDEX role_assignments_revoked_by_idx ON virtual_ink_phase1.role_assignments(revoked_by) WHERE revoked_by IS NOT NULL;

CREATE TABLE virtual_ink_phase1.role_assignment_audits (
  id uuid PRIMARY KEY,
  assignment_id uuid NOT NULL REFERENCES virtual_ink_phase1.role_assignments(id),
  user_id uuid NOT NULL REFERENCES virtual_ink.users(id),
  role text NOT NULL,
  version integer NOT NULL CHECK (version IN (1,2)),
  action text NOT NULL CHECK (action IN ('role.granted','role.revoked')),
  actor_id uuid NOT NULL REFERENCES virtual_ink.users(id),
  approval_reference uuid NOT NULL,
  reason_code text NOT NULL CHECK (reason_code ~ '^[a-z][a-z0-9_]{2,63}$'),
  request_id uuid NOT NULL,
  transaction_id bigint NOT NULL DEFAULT txid_current(),
  db_actor name NOT NULL DEFAULT session_user,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id,version),
  CHECK ((action='role.granted' AND version=1) OR (action='role.revoked' AND version=2))
);
CREATE INDEX role_assignment_audits_user_time_idx ON virtual_ink_phase1.role_assignment_audits(user_id,occurred_at,id);
CREATE INDEX role_assignment_audits_actor_idx ON virtual_ink_phase1.role_assignment_audits(actor_id);

ALTER TABLE virtual_ink_phase1.role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_ink_phase1.role_assignments FORCE ROW LEVEL SECURITY;
ALTER TABLE virtual_ink_phase1.role_assignment_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_ink_phase1.role_assignment_audits FORCE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA virtual_ink_phase1 FROM PUBLIC;
GRANT SELECT ON virtual_ink_phase1.role_assignments TO virtual_ink_phase1_reader;
CREATE POLICY role_assignment_self ON virtual_ink_phase1.role_assignments
FOR SELECT TO virtual_ink_phase1_reader USING (
  active AND user_id=(SELECT virtual_ink.current_user_id())
  AND (SELECT current_setting('app.access_mode',true))='phase1.actor'
  AND EXISTS (SELECT FROM virtual_ink.users u WHERE u.id=role_assignments.user_id AND u.active)
);
-- Audit records deliberately have no client/read policy or runtime privileges.

CREATE FUNCTION virtual_ink_phase1.protect_assignment() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    IF NOT NEW.active OR NEW.version<>1 THEN RAISE EXCEPTION 'Role assignment must start active' USING ERRCODE='23514'; END IF;
  ELSIF TG_OP='UPDATE' THEN
    IF NOT OLD.active OR NEW.active OR NEW.version<>OLD.version+1 OR
      ROW(NEW.id,NEW.user_id,NEW.role,NEW.granted_by,NEW.approval_reference,NEW.reason_code,NEW.created_at)
      IS DISTINCT FROM ROW(OLD.id,OLD.user_id,OLD.role,OLD.granted_by,OLD.approval_reference,OLD.reason_code,OLD.created_at) THEN
      RAISE EXCEPTION 'Role assignment only permits revocation' USING ERRCODE='23514';
    END IF;
  ELSE RAISE EXCEPTION 'Role assignment history is immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_assignment BEFORE INSERT OR UPDATE OR DELETE
ON virtual_ink_phase1.role_assignments FOR EACH ROW EXECUTE FUNCTION virtual_ink_phase1.protect_assignment();
CREATE TRIGGER protect_assignment_truncate BEFORE TRUNCATE
ON virtual_ink_phase1.role_assignments FOR EACH STATEMENT EXECUTE FUNCTION virtual_ink_phase1.protect_assignment();

CREATE FUNCTION virtual_ink_phase1.require_assignment_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM virtual_ink_phase1.role_assignment_audits a
    WHERE a.assignment_id=NEW.id AND a.user_id=NEW.user_id AND a.role=NEW.role
      AND a.version=NEW.version AND a.transaction_id=txid_current() AND a.db_actor=session_user
      AND a.action=CASE WHEN NEW.active THEN 'role.granted' ELSE 'role.revoked' END
      AND a.actor_id=CASE WHEN NEW.active THEN NEW.granted_by ELSE NEW.revoked_by END
      AND a.approval_reference=CASE WHEN NEW.active THEN NEW.approval_reference ELSE NEW.revocation_approval_reference END
      AND a.reason_code=CASE WHEN NEW.active THEN NEW.reason_code ELSE NEW.revocation_reason_code END) THEN
    RAISE EXCEPTION 'Role change requires a matching transaction audit' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER require_assignment_audit AFTER INSERT OR UPDATE
ON virtual_ink_phase1.role_assignments DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION virtual_ink_phase1.require_assignment_audit();

CREATE FUNCTION virtual_ink_phase1.validate_assignment_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
  IF NEW.transaction_id<>txid_current() OR NEW.db_actor<>session_user OR NOT EXISTS (
    SELECT FROM virtual_ink_phase1.role_assignments a WHERE a.id=NEW.assignment_id
      AND a.user_id=NEW.user_id AND a.role=NEW.role AND (
        NEW.action='role.granted' AND NEW.version=1 AND NEW.actor_id=a.granted_by
          AND NEW.approval_reference=a.approval_reference AND NEW.reason_code=a.reason_code OR
        NEW.action='role.revoked' AND NEW.version=2 AND NOT a.active AND a.version=2
          AND NEW.actor_id=a.revoked_by AND NEW.approval_reference=a.revocation_approval_reference
          AND NEW.reason_code=a.revocation_reason_code)) THEN
    RAISE EXCEPTION 'Role audit does not match assignment' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER validate_assignment_audit AFTER INSERT
ON virtual_ink_phase1.role_assignment_audits DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION virtual_ink_phase1.validate_assignment_audit();

CREATE FUNCTION virtual_ink_phase1.immutable_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN RAISE EXCEPTION 'Role audits are append-only' USING ERRCODE='23514'; END $$;
CREATE TRIGGER immutable_audit BEFORE UPDATE OR DELETE ON virtual_ink_phase1.role_assignment_audits
FOR EACH ROW EXECUTE FUNCTION virtual_ink_phase1.immutable_audit();
CREATE TRIGGER immutable_audit_truncate BEFORE TRUNCATE ON virtual_ink_phase1.role_assignment_audits
FOR EACH STATEMENT EXECUTE FUNCTION virtual_ink_phase1.immutable_audit();
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA virtual_ink_phase1 FROM PUBLIC;

-- Remove creator default grants too; revoking PUBLIC alone does not remove them.
DO $$ DECLARE role_name text; BEGIN
  FOREACH role_name IN ARRAY ARRAY['virtual_ink_api','virtual_ink_provisioner','virtual_ink_vendor_service','anon','authenticated','service_role'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname=role_name) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA virtual_ink_phase1 FROM %I',role_name);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA virtual_ink_phase1 FROM %I',role_name);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA virtual_ink_phase1 FROM %I',role_name);
    END IF;
  END LOOP;
END $$;

-- No writer role, LOGIN, passwords, seed roles, public RPC or provider coupling.
-- Only a reviewed migration administrator can write this disabled foundation.
