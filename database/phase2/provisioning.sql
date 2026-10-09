-- Virtual Ink private onboarding boundary. No login, vendor, identity or role
-- membership is provisioned by this migration. The CLI uses a separate login.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='virtual_ink_provisioner') THEN
    CREATE ROLE virtual_ink_provisioner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='virtual_ink_provisioner'
    AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls)) THEN
    RAISE EXCEPTION 'Unsafe provisioning group';
  END IF;
END $$;

CREATE TABLE virtual_ink.provisioning_audits (
  operation_id uuid PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  approval_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  db_actor text NOT NULL CHECK (length(db_actor) BETWEEN 1 AND 128),
  action text NOT NULL CHECK (action IN ('create_account','create_vendor','add_staff')),
  request_fingerprint text NOT NULL CHECK (request_fingerprint ~ '^[a-f0-9]{64}$'),
  user_id uuid NOT NULL REFERENCES virtual_ink.users(id),
  tenant_id uuid REFERENCES virtual_ink.tenants(id),
  outcome text NOT NULL CHECK (outcome IN ('created','existing')),
  CHECK ((action='create_account' AND tenant_id IS NULL) OR (action IN ('create_vendor','add_staff') AND tenant_id IS NOT NULL))
);
CREATE INDEX provisioning_audits_user_idx ON virtual_ink.provisioning_audits(user_id);
CREATE INDEX provisioning_audits_tenant_idx ON virtual_ink.provisioning_audits(tenant_id);
ALTER TABLE virtual_ink.provisioning_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_ink.provisioning_audits FORCE ROW LEVEL SECURITY;
REVOKE ALL ON virtual_ink.provisioning_audits FROM PUBLIC, virtual_ink_api;
GRANT USAGE ON SCHEMA virtual_ink TO virtual_ink_provisioner;

-- This dedicated private administrative credential can inspect onboarding
-- identifiers across tenants. Never give its membership to the HTTP login.
-- It has no private-file, operator-grant, update, delete, DDL or role-admin rights.
GRANT SELECT, INSERT ON virtual_ink.users, virtual_ink.identities, virtual_ink.tenants,
  virtual_ink.memberships, virtual_ink.user_roles, virtual_ink.provisioning_audits TO virtual_ink_provisioner;
DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['users','identities','tenants','memberships','user_roles','provisioning_audits'] LOOP
    EXECUTE format('CREATE POLICY provisioning_read ON virtual_ink.%I FOR SELECT TO virtual_ink_provisioner USING (true)', table_name);
  END LOOP;
END $$;
CREATE POLICY provisioning_insert ON virtual_ink.users FOR INSERT TO virtual_ink_provisioner WITH CHECK (active);
CREATE POLICY provisioning_insert ON virtual_ink.identities FOR INSERT TO virtual_ink_provisioner WITH CHECK (active AND provider='supabase');
CREATE POLICY provisioning_insert ON virtual_ink.tenants FOR INSERT TO virtual_ink_provisioner WITH CHECK (active AND kind='vendor');
CREATE POLICY provisioning_insert ON virtual_ink.memberships FOR INSERT TO virtual_ink_provisioner
WITH CHECK (active AND role IN ('VendorOwner','VendorStaff'));
CREATE POLICY provisioning_insert ON virtual_ink.user_roles FOR INSERT TO virtual_ink_provisioner WITH CHECK (active AND role='Customer');
CREATE POLICY provisioning_insert ON virtual_ink.provisioning_audits FOR INSERT TO virtual_ink_provisioner WITH CHECK (db_actor=session_user);

DO $$ DECLARE role_name text; BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname=role_name) THEN
      EXECUTE format('REVOKE ALL ON virtual_ink.provisioning_audits FROM %I', role_name);
    END IF;
  END LOOP;
END $$;
