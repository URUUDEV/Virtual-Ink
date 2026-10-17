-- Acceptance-only controlled permission probes. No Auth rows, secrets or data
-- changes. The caller must bind a reviewed staging project, never production.
BEGIN;
SET LOCAL statement_timeout='10s';
DO $$ DECLARE r text; q text; denied integer:=0;
BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role','virtual_ink_api','virtual_ink_provisioner','virtual_ink_vendor_service'] LOOP
  FOREACH q IN ARRAY ARRAY[
   'UPDATE virtual_ink_phase1.role_assignments SET role=''SUPER_ADMIN'' WHERE false',
   'DELETE FROM virtual_ink_security.events WHERE false',
   'SELECT virtual_ink_security.command(''role.execute'',''{}''::jsonb,''{}''::jsonb)'
  ] LOOP
   BEGIN
    EXECUTE format('SET LOCAL ROLE %I',r);
    EXECUTE q;
    RAISE EXCEPTION 'ACCEPTANCE_DENIAL_MISSING';
   EXCEPTION WHEN insufficient_privilege THEN denied:=denied+1;
   END;
   RESET ROLE;
  END LOOP;
 END LOOP;
 FOREACH q IN ARRAY ARRAY[
  'UPDATE virtual_ink_phase1.role_assignments SET role=''SUPER_ADMIN'' WHERE false',
  'DELETE FROM virtual_ink_security.events WHERE false',
  'UPDATE virtual_ink_security.configuration SET enabled=true WHERE false'
 ] LOOP
  BEGIN
   SET LOCAL ROLE virtual_ink_security_service;
   EXECUTE q;
   RAISE EXCEPTION 'ACCEPTANCE_SERVICE_DENIAL_MISSING';
  EXCEPTION WHEN insufficient_privilege THEN denied:=denied+1;
  END;
  RESET ROLE;
 END LOOP;
 IF denied<>21 THEN RAISE EXCEPTION 'ACCEPTANCE_DENIAL_COUNT_MISMATCH'; END IF;
END $$;
ROLLBACK;
