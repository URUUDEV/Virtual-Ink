CREATE FUNCTION virtual_ink.current_request_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = pg_catalog
AS $$ SELECT nullif(current_setting('app.request_id', true), '')::uuid $$;
REVOKE ALL ON FUNCTION virtual_ink.current_request_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION virtual_ink.current_request_id() TO virtual_ink_api;
ALTER POLICY append_scoped_access_audit ON virtual_ink.access_audits
WITH CHECK (actor_id = (SELECT virtual_ink.current_user_id())
  AND tenant_id = (SELECT virtual_ink.current_tenant_id())
  AND request_id = (SELECT virtual_ink.current_request_id())
  AND resource_id = tenant_id AND action = 'tenant.accessed' AND outcome = 'allowed'
  AND EXISTS (SELECT 1 FROM virtual_ink.tenants t WHERE t.id = tenant_id AND t.active));
