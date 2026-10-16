-- Synthetic transaction-rolled-back schema/audit/RLS checks, not real approval.
BEGIN;
SET LOCAL statement_timeout='10s';
GRANT virtual_ink_phase1_reader TO CURRENT_USER WITH SET TRUE;
DO $$ DECLARE i integer; person uuid; assignment uuid;
  roles text[]:=ARRAY['CUSTOMER','VENDOR','DESIGNER','DELIVERY_PARTNER','ORGANIZATION_MEMBER','ORGANIZATION_ADMIN','ADMIN','SUPER_ADMIN'];
BEGIN
  FOR i IN 1..10 LOOP
    person:=('b1000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid;
    INSERT INTO virtual_ink.users(id) VALUES(person);
    INSERT INTO virtual_ink.identities(provider,issuer,subject,user_id) VALUES('supabase','https://synthetic.invalid/auth/v1',person,person);
    INSERT INTO virtual_ink.provisioning_audits(operation_id,approval_id,reviewer_id,db_actor,action,request_fingerprint,user_id,outcome)
      VALUES(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),session_user,'create_account',repeat('b',64),person,'created');
  END LOOP;
  FOR i IN 1..8 LOOP
    person:=('b1000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid;
    assignment:=('b2000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid;
    INSERT INTO virtual_ink_phase1.role_assignments(id,user_id,role,granted_by,approval_reference,reason_code)
      VALUES(assignment,person,roles[i],'b1000000-0000-4000-8000-000000000009',gen_random_uuid(),'synthetic_grant');
    INSERT INTO virtual_ink_phase1.role_assignment_audits(id,assignment_id,user_id,role,version,action,actor_id,approval_reference,reason_code,request_id)
      SELECT gen_random_uuid(),id,user_id,role,version,'role.granted',granted_by,approval_reference,reason_code,gen_random_uuid()
      FROM virtual_ink_phase1.role_assignments WHERE id=assignment;
  END LOOP;
END $$;
SET CONSTRAINTS ALL IMMEDIATE;
SET CONSTRAINTS ALL DEFERRED;
DO $$ DECLARE blocked boolean;
BEGIN
  blocked:=false;
  BEGIN
    INSERT INTO virtual_ink_phase1.role_assignments(id,user_id,role,granted_by,approval_reference,reason_code)
      VALUES(gen_random_uuid(),'b1000000-0000-4000-8000-000000000010','CUSTOMER','b1000000-0000-4000-8000-000000000009',gen_random_uuid(),'missing_audit');
    SET CONSTRAINTS ALL IMMEDIATE;
  EXCEPTION WHEN check_violation THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Missing audit accepted'; END IF;
  blocked:=false;
  BEGIN
    INSERT INTO virtual_ink_phase1.role_assignments(id,user_id,role,granted_by,approval_reference,reason_code)
      VALUES(gen_random_uuid(),'b1000000-0000-4000-8000-000000000001','ADMIN','b1000000-0000-4000-8000-000000000009',gen_random_uuid(),'duplicate_role');
  EXCEPTION WHEN unique_violation THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Multiple active roles accepted'; END IF;
  blocked:=false;
  BEGIN
    UPDATE virtual_ink_phase1.role_assignments SET role='SUPER_ADMIN' WHERE user_id='b1000000-0000-4000-8000-000000000001';
  EXCEPTION WHEN check_violation THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Role changed in place'; END IF;
  blocked:=false;
  BEGIN DELETE FROM virtual_ink_phase1.role_assignment_audits;
  EXCEPTION WHEN check_violation THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Audit deleted'; END IF;
  blocked:=false;
  BEGIN TRUNCATE virtual_ink_phase1.role_assignment_audits;
  EXCEPTION WHEN check_violation THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Audit truncated'; END IF;
  blocked:=false;
  BEGIN
    UPDATE virtual_ink_phase1.role_assignments SET active=false,version=2,
      revoked_by='b1000000-0000-4000-8000-000000000009',revocation_approval_reference=gen_random_uuid(),
      revocation_reason_code='missing_revoke_audit',revoked_at=clock_timestamp()
      WHERE user_id='b1000000-0000-4000-8000-000000000001';
    SET CONSTRAINTS ALL IMMEDIATE;
  EXCEPTION WHEN check_violation THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Unaudited revocation accepted'; END IF;
  blocked:=false;
  BEGIN
    INSERT INTO virtual_ink_phase1.role_assignment_audits(id,assignment_id,user_id,role,version,action,actor_id,approval_reference,reason_code,request_id)
      SELECT gen_random_uuid(),id,user_id,role,2,'role.revoked',granted_by,approval_reference,'invented_revoke',gen_random_uuid()
      FROM virtual_ink_phase1.role_assignments WHERE user_id='b1000000-0000-4000-8000-000000000001';
    SET CONSTRAINTS ALL IMMEDIATE;
  EXCEPTION WHEN check_violation THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Audit invented an unperformed revocation'; END IF;
  blocked:=false;
  BEGIN
    INSERT INTO virtual_ink_phase1.role_assignments(id,user_id,role,granted_by,approval_reference,reason_code)
      VALUES(gen_random_uuid(),'b1000000-0000-4000-8000-000000000010','INVENTED','b1000000-0000-4000-8000-000000000009',gen_random_uuid(),'unknown_role');
  EXCEPTION WHEN check_violation THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Unknown role accepted'; END IF;
  blocked:=false;
  BEGIN UPDATE virtual_ink_phase1.role_assignment_audits SET reason_code='rewritten';
  EXCEPTION WHEN check_violation THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Audit rewritten'; END IF;
  blocked:=false;
  BEGIN DELETE FROM virtual_ink_phase1.role_assignments;
  EXCEPTION WHEN check_violation THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Assignment history deleted'; END IF;
END $$;

SELECT set_config('app.identity_provider','supabase',true),set_config('app.identity_issuer','https://synthetic.invalid/auth/v1',true),
 set_config('app.identity_subject','b1000000-0000-4000-8000-000000000001',true),
 set_config('app.user_id','b1000000-0000-4000-8000-000000000001',true),set_config('app.access_mode','phase1.actor',true);
SET LOCAL ROLE virtual_ink_phase1_reader;
DO $$ DECLARE blocked boolean;
BEGIN
  IF (SELECT count(*) FROM virtual_ink_phase1.role_assignments)<>1 OR
    EXISTS(SELECT FROM virtual_ink_phase1.role_assignments WHERE user_id<>'b1000000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'Assignment RLS scope failed'; END IF;
  blocked:=false;
  BEGIN UPDATE virtual_ink_phase1.role_assignments SET active=false;
  EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Reader can mutate roles'; END IF;
  blocked:=false;
  BEGIN SELECT * FROM virtual_ink_phase1.role_assignment_audits;
  EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Reader can read private audits'; END IF;
END $$;
SELECT set_config('app.access_mode','',true);
DO $$ BEGIN IF EXISTS(SELECT FROM virtual_ink_phase1.role_assignments) THEN RAISE EXCEPTION 'Missing mode allowed'; END IF; END $$;
SELECT set_config('app.access_mode','phase1.actor',true),set_config('app.user_id','b1000000-0000-4000-8000-000000000002',true);
DO $$ BEGIN IF EXISTS(SELECT FROM virtual_ink_phase1.role_assignments) THEN RAISE EXCEPTION 'Mismatched identity context allowed'; END IF; END $$;
SELECT set_config('app.user_id','b1000000-0000-4000-8000-000000000001',true);
RESET ROLE;
UPDATE virtual_ink.users SET active=false WHERE id='b1000000-0000-4000-8000-000000000001';
SELECT set_config('app.access_mode','phase1.actor',true);
SET LOCAL ROLE virtual_ink_phase1_reader;
DO $$ BEGIN IF EXISTS(SELECT FROM virtual_ink_phase1.role_assignments) THEN RAISE EXCEPTION 'Suspended user allowed'; END IF; END $$;
RESET ROLE;
UPDATE virtual_ink.users SET active=true WHERE id='b1000000-0000-4000-8000-000000000001';
UPDATE virtual_ink_phase1.role_assignments SET active=false,version=2,
  revoked_by='b1000000-0000-4000-8000-000000000009',revocation_approval_reference=gen_random_uuid(),
  revocation_reason_code='synthetic_revoke',revoked_at=clock_timestamp()
  WHERE user_id='b1000000-0000-4000-8000-000000000001';
INSERT INTO virtual_ink_phase1.role_assignment_audits(id,assignment_id,user_id,role,version,action,actor_id,approval_reference,reason_code,request_id)
  SELECT gen_random_uuid(),id,user_id,role,version,'role.revoked',revoked_by,revocation_approval_reference,revocation_reason_code,gen_random_uuid()
  FROM virtual_ink_phase1.role_assignments WHERE user_id='b1000000-0000-4000-8000-000000000001';
SET CONSTRAINTS ALL IMMEDIATE;
SET LOCAL ROLE virtual_ink_phase1_reader;
DO $$ BEGIN IF EXISTS(SELECT FROM virtual_ink_phase1.role_assignments) THEN RAISE EXCEPTION 'Revoked role visible'; END IF; END $$;
RESET ROLE;
DO $$ DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['virtual_ink_api','virtual_ink_provisioner','virtual_ink_vendor_service','anon','authenticated','service_role'] LOOP
    IF has_schema_privilege(r,'virtual_ink_phase1','USAGE,CREATE') OR
      has_table_privilege(r,'virtual_ink_phase1.role_assignments','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') THEN
      RAISE EXCEPTION 'Existing runtime role received Phase 1 rights'; END IF;
  END LOOP;
  IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='virtual_ink_phase1_reader' AND NOT rolcanlogin AND NOT rolbypassrls AND NOT rolsuper) THEN
    RAISE EXCEPTION 'Unsafe reader role'; END IF;
END $$;
ROLLBACK;
SELECT 'Passed: eight roles, audit-before-commit, versioned revoke, immutable history, RLS and no runtime grants; fixtures rolled back' AS result;
