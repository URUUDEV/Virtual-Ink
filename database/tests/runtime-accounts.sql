-- Virtual Ink catalog assertions only. No Auth/application user or password data.
BEGIN;
SET LOCAL statement_timeout='10s';
DO $$ DECLARE login_name text; group_name text; BEGIN
  FOR login_name, group_name IN SELECT * FROM (VALUES
    ('virtual_ink_api_login','virtual_ink_api'), ('virtual_ink_provisioner_login','virtual_ink_provisioner')) x LOOP
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname=login_name AND NOT rolcanlogin AND rolinherit
      AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication) THEN
      RAISE EXCEPTION 'Service account is missing or unsafe';
    END IF;
    IF (SELECT count(*) FROM pg_auth_members WHERE member=login_name::regrole) <> 1 OR
      NOT EXISTS (SELECT FROM pg_auth_members WHERE member=login_name::regrole AND roleid=group_name::regrole
        AND inherit_option AND NOT set_option AND NOT admin_option) THEN
      RAISE EXCEPTION 'Service account membership options are unsafe';
    END IF;
    IF NOT pg_has_role(login_name,group_name,'USAGE') THEN RAISE EXCEPTION 'Missing inherited group access'; END IF;
  END LOOP;
END $$;
GRANT virtual_ink_api_login TO CURRENT_USER WITH SET TRUE;
GRANT virtual_ink_provisioner_login TO CURRENT_USER WITH SET TRUE;
SET LOCAL ROLE virtual_ink_api_login;
DO $$ BEGIN
  IF NOT has_table_privilege(current_user,'virtual_ink.users','SELECT') OR
    NOT has_table_privilege(current_user,'virtual_ink.access_audits','INSERT') OR
    has_any_column_privilege(current_user,'virtual_ink.provisioning_audits','SELECT,INSERT,UPDATE,REFERENCES') OR
    has_table_privilege(current_user,'virtual_ink.memberships','INSERT,UPDATE,DELETE,TRUNCATE') OR
    has_schema_privilege(current_user,'virtual_ink','CREATE') OR has_schema_privilege(current_user,'public','CREATE') THEN
    RAISE EXCEPTION 'Unsafe API account rights';
  END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE virtual_ink_provisioner_login;
DO $$ BEGIN
  IF NOT has_table_privilege(current_user,'virtual_ink.users','SELECT,INSERT') OR
    NOT has_table_privilege(current_user,'virtual_ink.provisioning_audits','SELECT,INSERT') OR
    has_table_privilege(current_user,'virtual_ink.memberships','UPDATE,DELETE,TRUNCATE') OR
    has_any_column_privilege(current_user,'virtual_ink.access_audits','SELECT,INSERT,UPDATE,REFERENCES') OR
    has_any_column_privilege(current_user,'virtual_ink.operator_grants','SELECT,INSERT,UPDATE,REFERENCES') OR
    has_schema_privilege(current_user,'virtual_ink','CREATE') OR has_schema_privilege(current_user,'public','CREATE') THEN
    RAISE EXCEPTION 'Unsafe provisioner account rights';
  END IF;
END $$;
RESET ROLE;
-- Reproduce a column-only privilege drift for the startup guard to detect.
GRANT SELECT (approval_id) ON virtual_ink.provisioning_audits TO virtual_ink_api_login;
SET LOCAL ROLE virtual_ink_api_login;
DO $$ BEGIN
  IF has_table_privilege(current_user,'virtual_ink.provisioning_audits','SELECT') OR
    NOT has_any_column_privilege(current_user,'virtual_ink.provisioning_audits','SELECT') THEN
    RAISE EXCEPTION 'Column-only drift fixture is invalid';
  END IF;
END $$;
RESET ROLE;
ROLLBACK; -- Temporary SET and column grants are removed. Service accounts stay disabled.
SELECT 'Runtime account catalog and column-drift assertions passed; temporary grants rolled back' AS result;
