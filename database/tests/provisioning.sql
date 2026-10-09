-- Synthetic rollback-only assertions. Run on the reviewed development target
-- with its migration administrator, never as the HTTP/provisioning login.
BEGIN;
SET LOCAL statement_timeout='10s';
GRANT virtual_ink_provisioner TO CURRENT_USER WITH SET TRUE;
GRANT virtual_ink_api TO CURRENT_USER WITH SET TRUE;
SET LOCAL ROLE virtual_ink_provisioner;
INSERT INTO virtual_ink.users(id) VALUES ('a1111111-1111-4111-8111-111111111111'), ('b1111111-1111-4111-8111-111111111111');
INSERT INTO virtual_ink.identities(provider,issuer,subject,user_id) VALUES
 ('supabase','https://odgxcuwueessxfsoveza.supabase.co/auth/v1','a1111111-1111-4111-8111-111111111111','a1111111-1111-4111-8111-111111111111'),
 ('supabase','https://odgxcuwueessxfsoveza.supabase.co/auth/v1','b1111111-1111-4111-8111-111111111111','b1111111-1111-4111-8111-111111111111');
INSERT INTO virtual_ink.user_roles(user_id,role) VALUES ('a1111111-1111-4111-8111-111111111111','Customer');
INSERT INTO virtual_ink.tenants(id,kind) VALUES ('a2222222-2222-4222-8222-222222222222','vendor');
INSERT INTO virtual_ink.memberships(tenant_id,user_id,role) VALUES
 ('a2222222-2222-4222-8222-222222222222','a1111111-1111-4111-8111-111111111111','VendorOwner'),
 ('a2222222-2222-4222-8222-222222222222','b1111111-1111-4111-8111-111111111111','VendorStaff');
INSERT INTO virtual_ink.provisioning_audits(operation_id,approval_id,reviewer_id,db_actor,action,request_fingerprint,user_id,tenant_id,outcome)
VALUES ('a3333333-3333-4333-8333-333333333333','a4444444-4444-4444-8444-444444444444',
 'a5555555-5555-4555-8555-555555555555',session_user,'create_vendor',repeat('a',64),
 'a1111111-1111-4111-8111-111111111111','a2222222-2222-4222-8222-222222222222','created');
INSERT INTO virtual_ink.provisioning_audits(operation_id,approval_id,reviewer_id,db_actor,action,request_fingerprint,user_id,tenant_id,outcome)
VALUES
 ('c3333333-3333-4333-8333-333333333333','a4444444-4444-4444-8444-444444444444','a5555555-5555-4555-8555-555555555555',
 session_user,'create_account',repeat('c',64),'a1111111-1111-4111-8111-111111111111',NULL,'created'),
 ('d3333333-3333-4333-8333-333333333333','a4444444-4444-4444-8444-444444444444','a5555555-5555-4555-8555-555555555555',
 session_user,'create_account',repeat('d',64),'b1111111-1111-4111-8111-111111111111',NULL,'created'),
 ('e3333333-3333-4333-8333-333333333333','a4444444-4444-4444-8444-444444444444','a5555555-5555-4555-8555-555555555555',
 session_user,'add_staff',repeat('e',64),'b1111111-1111-4111-8111-111111111111','a2222222-2222-4222-8222-222222222222','created');
SET CONSTRAINTS ALL IMMEDIATE; -- Execute the same deferred checks that COMMIT runs.
SET CONSTRAINTS ALL DEFERRED;
DO $$ BEGIN
  IF (SELECT count(*) FROM virtual_ink.provisioning_audits WHERE operation_id='a3333333-3333-4333-8333-333333333333') <> 1 THEN RAISE EXCEPTION 'Missing committed candidate audit'; END IF;
  BEGIN
    INSERT INTO virtual_ink.user_roles(user_id,role) VALUES ('b1111111-1111-4111-8111-111111111111','PlatformOperator');
    RAISE EXCEPTION 'Provisioner escalated platform role';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO virtual_ink.user_roles(user_id,role) VALUES ('b1111111-1111-4111-8111-111111111111','DeliveryPartner');
    RAISE EXCEPTION 'Provisioner granted delivery role';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE virtual_ink.memberships SET role='VendorOwner' WHERE user_id='b1111111-1111-4111-8111-111111111111';
    RAISE EXCEPTION 'Provisioner promoted staff';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE virtual_ink.users SET active=false;
    RAISE EXCEPTION 'Provisioner changed user status';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    DELETE FROM virtual_ink.provisioning_audits;
    RAISE EXCEPTION 'Provisioner deleted audits';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE virtual_ink.provisioning_audits SET approval_id='a5555555-5555-4555-8555-555555555555';
    RAISE EXCEPTION 'Provisioner edited audit evidence';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM * FROM virtual_ink.operator_grants;
    RAISE EXCEPTION 'Provisioner read operator grants';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM * FROM virtual_ink.access_audits;
    RAISE EXCEPTION 'Provisioner read access audits';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO virtual_ink.provisioning_audits(operation_id,approval_id,reviewer_id,db_actor,action,request_fingerprint,user_id,tenant_id,outcome)
    VALUES ('b3333333-3333-4333-8333-333333333333','a4444444-4444-4444-8444-444444444444',
      'a5555555-5555-4555-8555-555555555555','forged_database_actor','create_vendor',repeat('b',64),
      'a1111111-1111-4111-8111-111111111111','a2222222-2222-4222-8222-222222222222','created');
    RAISE EXCEPTION 'Provisioner forged session actor';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO virtual_ink.provisioning_audits SELECT * FROM virtual_ink.provisioning_audits;
    RAISE EXCEPTION 'Duplicate operation accepted';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    INSERT INTO virtual_ink.users(id) VALUES ('c1111111-1111-4111-8111-111111111111');
    SET CONSTRAINTS ALL IMMEDIATE;
    RAISE EXCEPTION 'Unaudited user passed commit constraint';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    INSERT INTO virtual_ink.tenants(id,kind) VALUES ('b2222222-2222-4222-8222-222222222222','vendor');
    SET CONSTRAINTS ALL IMMEDIATE;
    RAISE EXCEPTION 'Another tenant audit authorized an unaudited tenant';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    INSERT INTO virtual_ink.identities(provider,issuer,subject,user_id)
      VALUES ('supabase','https://synthetic.example.invalid/auth/v1','c1111111-1111-4111-8111-111111111111','a1111111-1111-4111-8111-111111111111');
    DELETE FROM virtual_ink.provisioning_audits;
    RAISE EXCEPTION 'Audit removal before identity commit accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO virtual_ink.memberships(tenant_id,user_id,role) VALUES
      ('a2222222-2222-4222-8222-222222222222','c1111111-1111-4111-8111-111111111111','VendorStaff');
    RAISE EXCEPTION 'Foreign-key gap accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  BEGIN
    INSERT INTO virtual_ink.provisioning_audits(operation_id,approval_id,reviewer_id,db_actor,action,request_fingerprint,user_id,tenant_id,outcome,transaction_id)
    VALUES ('b3333333-3333-4333-8333-333333333333','a4444444-4444-4444-8444-444444444444',
      'a5555555-5555-4555-8555-555555555555',session_user,'create_account',repeat('b',64),
      'a1111111-1111-4111-8111-111111111111',NULL,'existing',txid_current()-1);
    RAISE EXCEPTION 'Audit from another transaction accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
-- New user with account evidence but no staff evidence: cannot commit membership.
INSERT INTO virtual_ink.users(id) VALUES ('c1111111-1111-4111-8111-111111111111');
INSERT INTO virtual_ink.provisioning_audits(operation_id,approval_id,reviewer_id,db_actor,action,request_fingerprint,user_id,tenant_id,outcome)
VALUES ('f3333333-3333-4333-8333-333333333333','a4444444-4444-4444-8444-444444444444','a5555555-5555-4555-8555-555555555555',
 session_user,'create_account',repeat('f',64),'c1111111-1111-4111-8111-111111111111',NULL,'created');
SET CONSTRAINTS ALL IMMEDIATE;
SET CONSTRAINTS ALL DEFERRED;
DO $$ BEGIN
  BEGIN
    INSERT INTO virtual_ink.memberships(tenant_id,user_id,role) VALUES
      ('a2222222-2222-4222-8222-222222222222','c1111111-1111-4111-8111-111111111111','VendorStaff');
    SET CONSTRAINTS ALL IMMEDIATE;
    RAISE EXCEPTION 'Account evidence authorized an unaudited staff grant';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE virtual_ink_api;
SELECT set_config('app.identity_provider','supabase',true),
 set_config('app.identity_issuer','https://odgxcuwueessxfsoveza.supabase.co/auth/v1',true),
 set_config('app.identity_subject','b1111111-1111-4111-8111-111111111111',true),
 set_config('app.user_id','b1111111-1111-4111-8111-111111111111',true),
 set_config('app.tenant_id','a2222222-2222-4222-8222-222222222222',true);
DO $$ BEGIN
  IF (SELECT count(*) FROM virtual_ink.memberships) <> 1 THEN RAISE EXCEPTION 'API staff read leaked another membership'; END IF;
  IF NOT EXISTS (SELECT FROM virtual_ink.tenants WHERE id='a2222222-2222-4222-8222-222222222222') THEN RAISE EXCEPTION 'Provisioned staff cannot read selected tenant'; END IF;
  BEGIN
    PERFORM * FROM virtual_ink.provisioning_audits;
    RAISE EXCEPTION 'API read provisioning evidence';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO virtual_ink.users(id) VALUES ('c1111111-1111-4111-8111-111111111111');
    RAISE EXCEPTION 'API provisioned an account';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
DO $$ DECLARE role_name text; BEGIN
  IF NOT EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='virtual_ink' AND c.relname='provisioning_audits' AND c.relrowsecurity AND c.relforcerowsecurity) THEN
    RAISE EXCEPTION 'Missing forced audit RLS';
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='virtual_ink_provisioner' AND
    (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls)) THEN RAISE EXCEPTION 'Unsafe provisioner group'; END IF;
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role','virtual_ink_api'] LOOP
    IF EXISTS (SELECT FROM pg_roles WHERE rolname=role_name) AND has_table_privilege(role_name,'virtual_ink.provisioning_audits','SELECT,INSERT,UPDATE,DELETE') THEN
      RAISE EXCEPTION 'Unexpected provisioning audit privileges';
    END IF;
  END LOOP;
END $$;
ROLLBACK; -- Every fixture, candidate audit and temporary SET grant is removed.
