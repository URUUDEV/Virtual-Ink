-- Virtual Ink development service accounts. No password and no LOGIN capability
-- are provisioned. Mumba enables a reviewed account only after a private password
-- prompt and TLS setup. This migration creates no Auth or application user.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='virtual_ink_api' AND NOT rolcanlogin AND NOT rolsuper AND NOT rolbypassrls)
    OR NOT EXISTS (SELECT FROM pg_roles WHERE rolname='virtual_ink_provisioner' AND NOT rolcanlogin AND NOT rolsuper AND NOT rolbypassrls) THEN
    RAISE EXCEPTION 'Required restricted groups are missing';
  END IF;
END $$;
-- Fail if these names are already in use rather than modifying an unknown account.
CREATE ROLE virtual_ink_api_login NOLOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE virtual_ink_provisioner_login NOLOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
GRANT virtual_ink_api TO virtual_ink_api_login WITH INHERIT TRUE, SET FALSE, ADMIN FALSE;
GRANT virtual_ink_provisioner TO virtual_ink_provisioner_login WITH INHERIT TRUE, SET FALSE, ADMIN FALSE;
ALTER ROLE virtual_ink_api_login SET search_path=pg_catalog;
ALTER ROLE virtual_ink_provisioner_login SET search_path=pg_catalog;
ALTER ROLE virtual_ink_api_login SET statement_timeout='5s';
ALTER ROLE virtual_ink_provisioner_login SET statement_timeout='5s';
ALTER ROLE virtual_ink_api_login SET idle_in_transaction_session_timeout='10s';
ALTER ROLE virtual_ink_provisioner_login SET idle_in_transaction_session_timeout='10s';
