-- Virtual Ink caller-owned membership discovery. Existing selected-tenant
-- policies remain intact. Only a server-set, transaction-local discovery mode
-- with no selected tenant permits own active membership/tenant enumeration.
CREATE POLICY discover_own_memberships ON virtual_ink.memberships FOR SELECT TO virtual_ink_api
USING (active AND user_id=(SELECT virtual_ink.current_user_id())
  AND (SELECT current_setting('app.access_mode',true))='memberships.list'
  AND (SELECT virtual_ink.current_tenant_id()) IS NULL
  AND EXISTS (SELECT FROM virtual_ink.users u WHERE u.id=memberships.user_id AND u.active)
  AND NOT EXISTS (SELECT FROM virtual_ink.user_roles r
    WHERE r.user_id=memberships.user_id AND r.role='DeliveryPartner' AND r.active));

CREATE POLICY discover_own_tenants ON virtual_ink.tenants FOR SELECT TO virtual_ink_api
USING (active AND kind='vendor'
  AND (SELECT current_setting('app.access_mode',true))='memberships.list'
  AND (SELECT virtual_ink.current_tenant_id()) IS NULL
  AND EXISTS (SELECT FROM virtual_ink.memberships m
    WHERE m.tenant_id=tenants.id AND m.user_id=(SELECT virtual_ink.current_user_id()) AND m.active));

-- A self-scoped event also records empty pages without inventing a tenant.
CREATE TABLE virtual_ink.membership_list_audits (
  id uuid PRIMARY KEY,
  occurred_at timestamptz NOT NULL,
  actor_id uuid NOT NULL REFERENCES virtual_ink.users(id),
  action text NOT NULL CHECK (action='memberships.listed'),
  resource_id uuid NOT NULL CHECK (resource_id=actor_id),
  request_id uuid NOT NULL,
  outcome text NOT NULL CHECK (outcome='allowed')
);
CREATE INDEX membership_list_audits_actor_time_idx
  ON virtual_ink.membership_list_audits(actor_id,occurred_at,id);
ALTER TABLE virtual_ink.membership_list_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_ink.membership_list_audits FORCE ROW LEVEL SECURITY;
REVOKE ALL ON virtual_ink.membership_list_audits FROM PUBLIC, virtual_ink_api, virtual_ink_provisioner;
GRANT INSERT ON virtual_ink.membership_list_audits TO virtual_ink_api;
CREATE POLICY append_own_membership_list_audit ON virtual_ink.membership_list_audits
FOR INSERT TO virtual_ink_api
WITH CHECK (actor_id=(SELECT virtual_ink.current_user_id()) AND resource_id=actor_id
  AND request_id=(SELECT nullif(current_setting('app.request_id',true),'')::uuid)
  AND (SELECT current_setting('app.access_mode',true))='memberships.list'
  AND (SELECT virtual_ink.current_tenant_id()) IS NULL
  AND action='memberships.listed' AND outcome='allowed'
  AND EXISTS (SELECT FROM virtual_ink.users u WHERE u.id=actor_id AND u.active));

DO $$ DECLARE role_name text; BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname=role_name) THEN
      EXECUTE format('REVOKE ALL ON virtual_ink.membership_list_audits FROM %I',role_name);
    END IF;
  END LOOP;
END $$;
