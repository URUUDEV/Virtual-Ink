-- Virtual Ink Backend Phase 2. Portable application schema; hosted provisioning
-- uses Supabase migration history. Never run as the HTTP database login.
-- Apply once to a reviewed fresh development target. No production data seed.
CREATE SCHEMA IF NOT EXISTS virtual_ink;
REVOKE ALL ON SCHEMA virtual_ink FROM PUBLIC;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'virtual_ink_api') THEN
    CREATE ROLE virtual_ink_api NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'virtual_ink_api'
    AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls)) THEN
    RAISE EXCEPTION 'Unsafe existing API group';
  END IF;
END $$;

CREATE TABLE virtual_ink.users (
  id uuid PRIMARY KEY,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE virtual_ink.identities (
  provider text NOT NULL CHECK (provider IN ('supabase')),
  issuer text NOT NULL CHECK (length(issuer) BETWEEN 1 AND 256),
  subject uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES virtual_ink.users(id),
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (provider, issuer, subject)
);
CREATE INDEX identities_user_idx ON virtual_ink.identities(user_id);
CREATE TABLE virtual_ink.user_roles (
  user_id uuid NOT NULL REFERENCES virtual_ink.users(id),
  role text NOT NULL CHECK (role IN ('Customer', 'PlatformOperator', 'DeliveryPartner')),
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, role)
);
CREATE TABLE virtual_ink.tenants (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind = 'vendor'),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE virtual_ink.memberships (
  tenant_id uuid NOT NULL REFERENCES virtual_ink.tenants(id),
  user_id uuid NOT NULL REFERENCES virtual_ink.users(id),
  role text NOT NULL CHECK (role IN ('VendorOwner', 'VendorStaff')),
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (tenant_id, user_id)
);
CREATE INDEX memberships_user_idx ON virtual_ink.memberships(user_id, tenant_id);
CREATE TABLE virtual_ink.operator_grants (
  tenant_id uuid NOT NULL REFERENCES virtual_ink.tenants(id),
  user_id uuid NOT NULL REFERENCES virtual_ink.users(id),
  capability text NOT NULL CHECK (capability = 'tenant.review'),
  purpose_code text NOT NULL CHECK (purpose_code = 'vendor_review'),
  expires_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (tenant_id, user_id, capability)
);
CREATE INDEX operator_grants_user_idx ON virtual_ink.operator_grants(user_id, tenant_id);
CREATE TABLE virtual_ink.access_audits (
  id uuid PRIMARY KEY,
  occurred_at timestamptz NOT NULL,
  actor_id uuid NOT NULL REFERENCES virtual_ink.users(id),
  tenant_id uuid NOT NULL REFERENCES virtual_ink.tenants(id),
  action text NOT NULL CHECK (action = 'tenant.accessed'),
  resource_id uuid NOT NULL,
  request_id uuid NOT NULL,
  outcome text NOT NULL CHECK (outcome = 'allowed'),
  CHECK (resource_id = tenant_id)
);
CREATE INDEX access_audits_tenant_time_idx ON virtual_ink.access_audits(tenant_id, occurred_at, id);
CREATE INDEX access_audits_actor_idx ON virtual_ink.access_audits(actor_id, occurred_at);

-- SECURITY INVOKER only. Missing context resolves to NULL and denies access.
CREATE FUNCTION virtual_ink.current_user_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = pg_catalog
AS $$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;
CREATE FUNCTION virtual_ink.current_tenant_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = pg_catalog
AS $$ SELECT nullif(current_setting('app.tenant_id', true), '')::uuid $$;
REVOKE ALL ON FUNCTION virtual_ink.current_user_id(), virtual_ink.current_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION virtual_ink.current_user_id(), virtual_ink.current_tenant_id() TO virtual_ink_api;

DO $$ DECLARE name text; BEGIN
  FOREACH name IN ARRAY ARRAY['users','identities','user_roles','tenants','memberships','operator_grants','access_audits'] LOOP
    EXECUTE format('ALTER TABLE virtual_ink.%I ENABLE ROW LEVEL SECURITY', name);
    EXECUTE format('ALTER TABLE virtual_ink.%I FORCE ROW LEVEL SECURITY', name);
    EXECUTE format('REVOKE ALL ON virtual_ink.%I FROM PUBLIC, virtual_ink_api', name);
  END LOOP;
END $$;
GRANT USAGE ON SCHEMA virtual_ink TO virtual_ink_api;
GRANT SELECT ON virtual_ink.users, virtual_ink.identities, virtual_ink.user_roles,
  virtual_ink.tenants, virtual_ink.memberships, virtual_ink.operator_grants TO virtual_ink_api;
GRANT INSERT ON virtual_ink.access_audits TO virtual_ink_api;

CREATE POLICY identity_lookup ON virtual_ink.identities FOR SELECT TO virtual_ink_api
USING (active AND provider = current_setting('app.identity_provider', true)
  AND issuer = current_setting('app.identity_issuer', true)
  AND subject::text = current_setting('app.identity_subject', true));
CREATE POLICY user_self ON virtual_ink.users FOR SELECT TO virtual_ink_api
USING (active AND id = (SELECT virtual_ink.current_user_id())
  AND EXISTS (SELECT 1 FROM virtual_ink.identities i WHERE i.user_id = users.id AND i.active));
CREATE POLICY own_roles ON virtual_ink.user_roles FOR SELECT TO virtual_ink_api
USING (active AND user_id = (SELECT virtual_ink.current_user_id())
  AND EXISTS (SELECT 1 FROM virtual_ink.users u WHERE u.id = user_id AND u.active));
CREATE POLICY own_membership ON virtual_ink.memberships FOR SELECT TO virtual_ink_api
USING (active AND user_id = (SELECT virtual_ink.current_user_id())
  AND tenant_id = (SELECT virtual_ink.current_tenant_id())
  AND EXISTS (SELECT 1 FROM virtual_ink.users u WHERE u.id = user_id AND u.active)
  AND NOT EXISTS (SELECT 1 FROM virtual_ink.user_roles r WHERE r.user_id = memberships.user_id AND r.role = 'DeliveryPartner' AND r.active));
CREATE POLICY own_operator_grant ON virtual_ink.operator_grants FOR SELECT TO virtual_ink_api
USING (active AND expires_at > now() AND user_id = (SELECT virtual_ink.current_user_id())
  AND tenant_id = (SELECT virtual_ink.current_tenant_id())
  AND EXISTS (SELECT 1 FROM virtual_ink.user_roles r WHERE r.user_id = operator_grants.user_id AND r.role = 'PlatformOperator' AND r.active)
  AND NOT EXISTS (SELECT 1 FROM virtual_ink.user_roles r WHERE r.user_id = operator_grants.user_id AND r.role = 'DeliveryPartner' AND r.active));
CREATE POLICY scoped_tenant ON virtual_ink.tenants FOR SELECT TO virtual_ink_api
USING (active AND id = (SELECT virtual_ink.current_tenant_id()) AND (
  EXISTS (SELECT 1 FROM virtual_ink.memberships m WHERE m.tenant_id = tenants.id AND m.user_id = (SELECT virtual_ink.current_user_id()) AND m.active)
  OR EXISTS (SELECT 1 FROM virtual_ink.operator_grants g WHERE g.tenant_id = tenants.id AND g.user_id = (SELECT virtual_ink.current_user_id()) AND g.active AND g.capability = 'tenant.review' AND g.expires_at > now())
));
CREATE POLICY append_scoped_access_audit ON virtual_ink.access_audits FOR INSERT TO virtual_ink_api
WITH CHECK (actor_id = (SELECT virtual_ink.current_user_id())
  AND tenant_id = (SELECT virtual_ink.current_tenant_id())
  AND request_id = nullif(current_setting('app.request_id', true), '')::uuid
  AND resource_id = tenant_id AND action = 'tenant.accessed' AND outcome = 'allowed'
  AND EXISTS (SELECT 1 FROM virtual_ink.tenants t WHERE t.id = tenant_id AND t.active));

-- No exposed business API privileges, including elevated Data API clients.
DO $$ DECLARE role_name text; BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA virtual_ink FROM %I', role_name);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA virtual_ink FROM %I', role_name);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA virtual_ink FROM %I', role_name);
    END IF;
  END LOOP;
END $$;
-- No automatic login, role assignment, auth.users trigger, provider foreign key,
-- public function, file grant, real vendor, checkout or pricing data is created.
