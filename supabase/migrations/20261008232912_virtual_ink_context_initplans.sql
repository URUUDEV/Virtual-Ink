-- Evaluate verified request context once per statement, not for each row.
ALTER POLICY identity_lookup ON virtual_ink.identities
USING (active AND provider = (SELECT current_setting('app.identity_provider', true))
  AND issuer = (SELECT current_setting('app.identity_issuer', true))
  AND subject::text = (SELECT current_setting('app.identity_subject', true)));
ALTER POLICY append_scoped_access_audit ON virtual_ink.access_audits
WITH CHECK (actor_id = (SELECT virtual_ink.current_user_id())
  AND tenant_id = (SELECT virtual_ink.current_tenant_id())
  AND request_id = (SELECT nullif(current_setting('app.request_id', true), '')::uuid)
  AND resource_id = tenant_id AND action = 'tenant.accessed' AND outcome = 'allowed'
  AND EXISTS (SELECT 1 FROM virtual_ink.tenants t WHERE t.id = tenant_id AND t.active));
