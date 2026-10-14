-- Merge the disjoint discovery and selected-tenant predicates into one SELECT
-- policy per table. Same ownership/mode boundaries; no extra grants.
DROP POLICY discover_own_memberships ON virtual_ink.memberships;
ALTER POLICY own_membership ON virtual_ink.memberships
USING (active AND user_id=(SELECT virtual_ink.current_user_id())
  AND (tenant_id=(SELECT virtual_ink.current_tenant_id()) OR (
    (SELECT current_setting('app.access_mode',true))='memberships.list'
    AND (SELECT virtual_ink.current_tenant_id()) IS NULL))
  AND EXISTS (SELECT FROM virtual_ink.users u WHERE u.id=memberships.user_id AND u.active)
  AND NOT EXISTS (SELECT FROM virtual_ink.user_roles r
    WHERE r.user_id=memberships.user_id AND r.role='DeliveryPartner' AND r.active));

DROP POLICY discover_own_tenants ON virtual_ink.tenants;
ALTER POLICY scoped_tenant ON virtual_ink.tenants
USING (active AND kind='vendor' AND (
  (EXISTS (SELECT FROM virtual_ink.memberships m WHERE m.tenant_id=tenants.id
    AND m.user_id=(SELECT virtual_ink.current_user_id()) AND m.active)
    AND (id=(SELECT virtual_ink.current_tenant_id()) OR (
      (SELECT current_setting('app.access_mode',true))='memberships.list'
      AND (SELECT virtual_ink.current_tenant_id()) IS NULL)))
  OR (id=(SELECT virtual_ink.current_tenant_id()) AND EXISTS (
    SELECT FROM virtual_ink.operator_grants g WHERE g.tenant_id=tenants.id
      AND g.user_id=(SELECT virtual_ink.current_user_id()) AND g.active
      AND g.capability='tenant.review' AND g.expires_at > now()))));
