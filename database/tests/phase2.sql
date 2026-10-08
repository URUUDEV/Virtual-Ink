-- Synthetic security fixtures only. Everything, including audits, is rolled back.
-- Run as the development migration owner; never with real user/vendor data.
BEGIN;
-- Supabase's migration role has ADMIN but not SET on newly created roles.
-- This test-only grant is transaction-scoped and rolled back with fixtures.
GRANT virtual_ink_api TO CURRENT_USER WITH SET TRUE;
INSERT INTO virtual_ink.users(id,active) VALUES
 ('11111111-1111-4111-8111-111111111111',true),
 ('22222222-2222-4222-8222-222222222222',true),
 ('33333333-3333-4333-8333-333333333333',true),
 ('44444444-4444-4444-8444-444444444444',true),
 ('55555555-5555-4555-8555-555555555555',true),
 ('66666666-6666-4666-8666-666666666666',true),
 ('77777777-7777-4777-8777-777777777777',true),
 ('88888888-8888-4888-8888-888888888888',false),
 ('99999999-9999-4999-8999-999999999999',true),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
INSERT INTO virtual_ink.identities(provider,issuer,subject,user_id)
 SELECT 'supabase','https://synthetic.invalid/auth/v1',id,id FROM virtual_ink.users;
INSERT INTO virtual_ink.tenants(id,kind) VALUES
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','vendor'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','vendor');
INSERT INTO virtual_ink.user_roles(user_id,role) VALUES
 ('44444444-4444-4444-8444-444444444444','Customer'),
 ('55555555-5555-4555-8555-555555555555','DeliveryPartner'),
 ('66666666-6666-4666-8666-666666666666','PlatformOperator'),
 ('99999999-9999-4999-8999-999999999999','PlatformOperator'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','PlatformOperator');
INSERT INTO virtual_ink.memberships(tenant_id,user_id,role,active) VALUES
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','VendorOwner',true),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','22222222-2222-4222-8222-222222222222','VendorOwner',true),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','33333333-3333-4333-8333-333333333333','VendorStaff',true),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','55555555-5555-4555-8555-555555555555','VendorOwner',true),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','77777777-7777-4777-8777-777777777777','VendorStaff',false),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','88888888-8888-4888-8888-888888888888','VendorOwner',true);
INSERT INTO virtual_ink.operator_grants(tenant_id,user_id,capability,purpose_code,expires_at) VALUES
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','66666666-6666-4666-8666-666666666666','tenant.review','vendor_review',now()+interval '1 hour'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','99999999-9999-4999-8999-999999999999','tenant.review','vendor_review',now()-interval '1 hour');

SET LOCAL ROLE virtual_ink_api;
SELECT set_config('app.user_id','',true), set_config('app.tenant_id','',true),
 set_config('app.identity_provider','',true), set_config('app.identity_issuer','',true), set_config('app.identity_subject','',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM virtual_ink.users) <> 0 OR (SELECT count(*) FROM virtual_ink.identities) <> 0
 OR (SELECT count(*) FROM virtual_ink.tenants) <> 0 THEN RAISE EXCEPTION 'Missing context exposed data'; END IF;
END $$;
SELECT set_config('app.identity_provider','supabase',true), set_config('app.identity_issuer','https://synthetic.invalid/auth/v1',true),
 set_config('app.identity_subject','11111111-1111-4111-8111-111111111111',true),
 set_config('app.user_id','11111111-1111-4111-8111-111111111111',true),
 set_config('app.tenant_id','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true),
 set_config('app.request_id','dddddddd-dddd-4ddd-8ddd-dddddddddddd',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM virtual_ink.identities) <> 1 OR (SELECT count(*) FROM virtual_ink.users) <> 1
 OR (SELECT count(*) FROM virtual_ink.tenants) <> 1 OR (SELECT count(*) FROM virtual_ink.memberships) <> 1
 OR (SELECT count(*) FROM virtual_ink.tenants t JOIN virtual_ink.memberships m ON m.tenant_id=t.id) <> 1
 THEN RAISE EXCEPTION 'Owner scope/joins incorrect'; END IF;
 BEGIN
   UPDATE virtual_ink.memberships SET role='VendorOwner';
   RAISE EXCEPTION 'Unauthorized membership mutation permitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
   INSERT INTO virtual_ink.user_roles VALUES ('11111111-1111-4111-8111-111111111111','PlatformOperator',true);
   RAISE EXCEPTION 'Unauthorized self-escalation permitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
   SELECT * FROM virtual_ink.access_audits;
   RAISE EXCEPTION 'Unauthorized audit read permitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
INSERT INTO virtual_ink.access_audits VALUES
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',now(),'11111111-1111-4111-8111-111111111111',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','tenant.accessed','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 'dddddddd-dddd-4ddd-8ddd-dddddddddddd','allowed');
DO $$ BEGIN
 BEGIN
   INSERT INTO virtual_ink.access_audits VALUES
   ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',now(),'22222222-2222-4222-8222-222222222222',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','tenant.accessed','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd','allowed');
   RAISE EXCEPTION 'Wrong audit actor permitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
   INSERT INTO virtual_ink.access_audits VALUES
   ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',now(),'11111111-1111-4111-8111-111111111111',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc','tenant.accessed','cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd','allowed');
   RAISE EXCEPTION 'Cross tenant audit permitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
   DELETE FROM virtual_ink.access_audits;
   RAISE EXCEPTION 'Audit deletion permitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

SELECT set_config('app.tenant_id','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM virtual_ink.tenants) <> 0 OR (SELECT count(*) FROM virtual_ink.memberships) <> 0
 THEN RAISE EXCEPTION 'Cross tenant data exposed'; END IF;
END $$;
-- Changing only app user_id cannot escape verified identity mapping.
SELECT set_config('app.user_id','22222222-2222-4222-8222-222222222222',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM virtual_ink.users) <> 0 OR (SELECT count(*) FROM virtual_ink.tenants) <> 0
 THEN RAISE EXCEPTION 'User context spoof bypassed mapping'; END IF;
END $$;

-- Staff is limited to their active tenant and own membership row.
SELECT set_config('app.identity_subject','33333333-3333-4333-8333-333333333333',true),
 set_config('app.user_id','33333333-3333-4333-8333-333333333333',true),
 set_config('app.tenant_id','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM virtual_ink.tenants) <> 1 OR (SELECT count(*) FROM virtual_ink.memberships) <> 1
 THEN RAISE EXCEPTION 'Staff scope incorrect'; END IF;
END $$;

-- Customer, delivery (even with a vendor membership), inactive staff,
-- disabled user, expired operator and ungranted operator see no tenant.
DO $$ DECLARE subject_id text; BEGIN
 FOREACH subject_id IN ARRAY ARRAY[
  '44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555555',
  '77777777-7777-4777-8777-777777777777','88888888-8888-4888-8888-888888888888',
  '99999999-9999-4999-8999-999999999999','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'] LOOP
   PERFORM set_config('app.identity_subject',subject_id,true),set_config('app.user_id',subject_id,true);
   IF (SELECT count(*) FROM virtual_ink.tenants) <> 0 OR (SELECT count(*) FROM virtual_ink.memberships) <> 0
   THEN RAISE EXCEPTION 'Forbidden identity received tenant access'; END IF;
 END LOOP;
END $$;

SELECT set_config('app.identity_subject','66666666-6666-4666-8666-666666666666',true),
 set_config('app.user_id','66666666-6666-4666-8666-666666666666',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM virtual_ink.tenants) <> 1 OR (SELECT count(*) FROM virtual_ink.operator_grants) <> 1
 THEN RAISE EXCEPTION 'Explicit operator access missing'; END IF;
END $$;
SELECT set_config('app.tenant_id','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM virtual_ink.tenants) <> 0 THEN RAISE EXCEPTION 'Operator crossed scope'; END IF;
END $$;

RESET ROLE;
DO $$ BEGIN
 IF (SELECT count(*) FROM virtual_ink.access_audits) <> 1 THEN RAISE EXCEPTION 'Required audit was not persisted'; END IF;
 IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='virtual_ink' AND c.relkind='r' AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity))
 THEN RAISE EXCEPTION 'RLS protection missing'; END IF;
 IF EXISTS (SELECT FROM pg_roles WHERE rolname='virtual_ink_api' AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls))
 THEN RAISE EXCEPTION 'Unsafe runtime group'; END IF;
 IF EXISTS (SELECT FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='virtual_ink' AND p.prosecdef)
 THEN RAISE EXCEPTION 'Definer function found'; END IF;
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN SELECT * FROM virtual_ink.tenants; RAISE EXCEPTION 'anon data access permitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN SELECT * FROM virtual_ink.tenants; RAISE EXCEPTION 'authenticated data access permitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE service_role;
DO $$ BEGIN
 BEGIN SELECT * FROM virtual_ink.tenants; RAISE EXCEPTION 'service_role data access permitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'Phase 2 database denial, scope, grant and audit assertions passed; fixtures rolled back' AS result;
