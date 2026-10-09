-- Require an append-only onboarding audit in the same transaction even if a
-- trusted administrator issues SQL outside the CLI. No SECURITY DEFINER code.
ALTER TABLE virtual_ink.provisioning_audits ADD COLUMN transaction_id bigint NOT NULL DEFAULT txid_current();
CREATE INDEX provisioning_audits_transaction_idx ON virtual_ink.provisioning_audits(transaction_id);
DROP POLICY provisioning_insert ON virtual_ink.provisioning_audits;
CREATE POLICY provisioning_insert ON virtual_ink.provisioning_audits FOR INSERT TO virtual_ink_provisioner
WITH CHECK (db_actor=session_user AND transaction_id=txid_current());

CREATE FUNCTION virtual_ink.require_provisioning_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE target_user uuid; target_tenant uuid; expected_action text;
BEGIN
  IF TG_TABLE_NAME='users' THEN
    target_user := NEW.id; expected_action := 'create_account';
  ELSIF TG_TABLE_NAME IN ('identities','user_roles') THEN
    target_user := NEW.user_id; expected_action := 'create_account';
  ELSIF TG_TABLE_NAME='tenants' THEN
    target_tenant := NEW.id; expected_action := 'create_vendor';
  ELSIF TG_TABLE_NAME='memberships' THEN
    target_user := NEW.user_id; target_tenant := NEW.tenant_id;
    expected_action := CASE NEW.role WHEN 'VendorOwner' THEN 'create_vendor' WHEN 'VendorStaff' THEN 'add_staff' END;
  ELSE
    RAISE EXCEPTION 'Unsupported onboarding table' USING ERRCODE='23514';
  END IF;
  IF expected_action IS NULL OR NOT EXISTS (
    SELECT FROM virtual_ink.provisioning_audits a
    WHERE a.transaction_id=txid_current() AND a.db_actor=session_user AND a.action=expected_action
      AND (target_user IS NULL OR a.user_id=target_user)
      AND a.tenant_id IS NOT DISTINCT FROM target_tenant
  ) THEN
    RAISE EXCEPTION 'Onboarding requires a matching transaction audit' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION virtual_ink.require_provisioning_audit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION virtual_ink.require_provisioning_audit() TO virtual_ink_provisioner;
DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['users','identities','user_roles','tenants','memberships'] LOOP
    EXECUTE format('CREATE CONSTRAINT TRIGGER require_provisioning_audit AFTER INSERT ON virtual_ink.%I
      DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION virtual_ink.require_provisioning_audit()', table_name);
  END LOOP;
END $$;
