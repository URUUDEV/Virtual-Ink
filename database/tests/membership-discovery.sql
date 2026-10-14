-- Virtual Ink synthetic membership discovery assertions. No provider users,
-- passwords or real business data. All fixtures and temporary role grants roll back.
BEGIN;
SET LOCAL statement_timeout='10s';
GRANT virtual_ink_api TO CURRENT_USER WITH SET TRUE;
INSERT INTO virtual_ink.users(id,active) VALUES
 ('11111111-1111-4111-8111-111111111111',true),
 ('22222222-2222-4222-8222-222222222222',true),
 ('33333333-3333-4333-8333-333333333333',false),
 ('44444444-4444-4444-8444-444444444444',true),
 ('55555555-5555-4555-8555-555555555555',true),
 ('66666666-6666-4666-8666-666666666666',true);
INSERT INTO virtual_ink.identities(provider,issuer,subject,user_id)
 SELECT 'supabase','https://synthetic.invalid/auth/v1',id,id FROM virtual_ink.users;
INSERT INTO virtual_ink.tenants(id,kind,active) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','vendor',true),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','vendor',true),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','vendor',true),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','vendor',false),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5','vendor',true);
INSERT INTO virtual_ink.memberships(tenant_id,user_id,role,active) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','11111111-1111-4111-8111-111111111111','VendorOwner',true),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','11111111-1111-4111-8111-111111111111','VendorStaff',true),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','22222222-2222-4222-8222-222222222222','VendorOwner',true),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','11111111-1111-4111-8111-111111111111','VendorOwner',true),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5','11111111-1111-4111-8111-111111111111','VendorStaff',false),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','33333333-3333-4333-8333-333333333333','VendorOwner',true),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','44444444-4444-4444-8444-444444444444','VendorStaff',true);
INSERT INTO virtual_ink.user_roles(user_id,role) VALUES
 ('44444444-4444-4444-8444-444444444444','DeliveryPartner'),
 ('55555555-5555-4555-8555-555555555555','PlatformOperator'),
 ('66666666-6666-4666-8666-666666666666','Customer');
INSERT INTO virtual_ink.operator_grants(tenant_id,user_id,capability,purpose_code,expires_at) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','55555555-5555-4555-8555-555555555555','tenant.review','vendor_review',now()+interval '1 hour');

SET LOCAL ROLE virtual_ink_api;
SELECT set_config('app.identity_provider','supabase',true),
 set_config('app.identity_issuer','https://synthetic.invalid/auth/v1',true),
 set_config('app.identity_subject','11111111-1111-4111-8111-111111111111',true),
 set_config('app.user_id','11111111-1111-4111-8111-111111111111',true),
 set_config('app.tenant_id','',true),set_config('app.access_mode','',true),
 set_config('app.request_id','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM virtual_ink.memberships) <> 0 OR (SELECT count(*) FROM virtual_ink.tenants) <> 0
 THEN RAISE EXCEPTION 'Unset discovery mode exposed vendor data'; END IF;
END $$;
SELECT set_config('app.access_mode','memberships.list',true);
-- Execute the actual parameterized repository statements under the API role.
DO $actual$ DECLARE r record; n integer:=0; BEGIN
 FOR r IN EXECUTE $list$SELECT m.tenant_id, m.role
  FROM virtual_ink.memberships m JOIN virtual_ink.tenants t ON t.id=m.tenant_id
  WHERE m.user_id=$1 AND m.active AND t.active AND t.kind='vendor'
    AND ($2::uuid IS NULL OR m.tenant_id > $2::uuid)
  ORDER BY m.tenant_id LIMIT $3$list$
   USING '11111111-1111-4111-8111-111111111111'::uuid,NULL::uuid,2 LOOP n:=n+1; END LOOP;
 IF n<>2 THEN RAISE EXCEPTION 'Actual list query did not return two own active scopes'; END IF;
 n:=0;
 FOR r IN EXECUTE $list$SELECT m.tenant_id, m.role
  FROM virtual_ink.memberships m JOIN virtual_ink.tenants t ON t.id=m.tenant_id
  WHERE m.user_id=$1 AND m.active AND t.active AND t.kind='vendor'
    AND ($2::uuid IS NULL OR m.tenant_id > $2::uuid)
  ORDER BY m.tenant_id LIMIT $3$list$
   USING '11111111-1111-4111-8111-111111111111'::uuid,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid,2 LOOP
   n:=n+1;
   IF r.tenant_id<>'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'::uuid THEN RAISE EXCEPTION 'Actual page crossed scope'; END IF;
 END LOOP;
 IF n<>1 THEN RAISE EXCEPTION 'Actual page query incorrect'; END IF;
 n:=0;
 FOR r IN EXECUTE $cursor$SELECT m.tenant_id, m.role
  FROM virtual_ink.memberships m JOIN virtual_ink.tenants t ON t.id=m.tenant_id
  WHERE m.user_id=$1 AND m.tenant_id=$2 AND m.active AND t.active AND t.kind='vendor'$cursor$
   USING '11111111-1111-4111-8111-111111111111'::uuid,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'::uuid LOOP n:=n+1; END LOOP;
 IF n<>0 THEN RAISE EXCEPTION 'Actual cursor query resolved another vendor'; END IF;
END $actual$;
DO $$ BEGIN
 IF (SELECT count(*) FROM virtual_ink.memberships m JOIN virtual_ink.tenants t ON t.id=m.tenant_id
   WHERE m.user_id='11111111-1111-4111-8111-111111111111' AND m.active AND t.active) <> 2
 THEN RAISE EXCEPTION 'Own active scope list incorrect'; END IF;
 IF (SELECT count(*) FROM virtual_ink.tenants) <> 2
 THEN RAISE EXCEPTION 'Other or inactive tenant exposed'; END IF;
 IF EXISTS (SELECT FROM virtual_ink.memberships WHERE user_id <> '11111111-1111-4111-8111-111111111111')
 THEN RAISE EXCEPTION 'Other user membership exposed'; END IF;
 IF (SELECT count(*) FROM virtual_ink.memberships m JOIN virtual_ink.tenants t ON t.id=m.tenant_id
   WHERE m.user_id='11111111-1111-4111-8111-111111111111' AND m.active AND t.active
     AND m.tenant_id > 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1') <> 1
 THEN RAISE EXCEPTION 'Bounded page continuation incorrect'; END IF;
 IF EXISTS (SELECT FROM virtual_ink.memberships m JOIN virtual_ink.tenants t ON t.id=m.tenant_id
   WHERE m.user_id='11111111-1111-4111-8111-111111111111'
     AND m.tenant_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3')
 THEN RAISE EXCEPTION 'Guessed cursor resolved outside caller scope'; END IF;
 BEGIN UPDATE virtual_ink.memberships SET role='VendorOwner';
   RAISE EXCEPTION 'Discovery granted mutation'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN SELECT * FROM virtual_ink.membership_list_audits;
   RAISE EXCEPTION 'API may read discovery audits'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN DELETE FROM virtual_ink.membership_list_audits;
   RAISE EXCEPTION 'API may delete discovery audits'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
INSERT INTO virtual_ink.membership_list_audits VALUES
 ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1',now(),'11111111-1111-4111-8111-111111111111',
 'memberships.listed','11111111-1111-4111-8111-111111111111','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','allowed');
DO $$ BEGIN
 BEGIN INSERT INTO virtual_ink.membership_list_audits VALUES
   ('cccccccc-cccc-4ccc-8ccc-ccccccccccc2',now(),'22222222-2222-4222-8222-222222222222',
   'memberships.listed','22222222-2222-4222-8222-222222222222','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','allowed');
   RAISE EXCEPTION 'Wrong actor audit permitted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN INSERT INTO virtual_ink.membership_list_audits VALUES
   ('cccccccc-cccc-4ccc-8ccc-ccccccccccc3',now(),'11111111-1111-4111-8111-111111111111',
   'memberships.listed','11111111-1111-4111-8111-111111111111','dddddddd-dddd-4ddd-8ddd-dddddddddddd','allowed');
   RAISE EXCEPTION 'Wrong request audit permitted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

-- The discovery flag cannot expand a selected-tenant operation.
SELECT set_config('app.tenant_id','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM virtual_ink.tenants) <> 1 OR (SELECT count(*) FROM virtual_ink.memberships) <> 1
 THEN RAISE EXCEPTION 'Selected-tenant boundary widened'; END IF;
 BEGIN INSERT INTO virtual_ink.membership_list_audits VALUES
   ('cccccccc-cccc-4ccc-8ccc-ccccccccccc4',now(),'11111111-1111-4111-8111-111111111111',
   'memberships.listed','11111111-1111-4111-8111-111111111111','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','allowed');
   RAISE EXCEPTION 'List audit accepted in selected-tenant mode'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('app.tenant_id','',true),set_config('app.user_id','22222222-2222-4222-8222-222222222222',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM virtual_ink.tenants) <> 0 OR (SELECT count(*) FROM virtual_ink.memberships) <> 0
 THEN RAISE EXCEPTION 'Spoofed user escaped identity binding'; END IF;
END $$;
-- Other user sees only their own tenant; disabled/delivery/operator/customer have none.
SELECT set_config('app.identity_subject','22222222-2222-4222-8222-222222222222',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM virtual_ink.tenants) <> 1 OR (SELECT count(*) FROM virtual_ink.memberships) <> 1
 THEN RAISE EXCEPTION 'Second user discovery scope incorrect'; END IF;
END $$;
DO $$ DECLARE subject_id text; BEGIN
 FOREACH subject_id IN ARRAY ARRAY['33333333-3333-4333-8333-333333333333',
   '44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555555',
   '66666666-6666-4666-8666-666666666666'] LOOP
   PERFORM set_config('app.identity_subject',subject_id,true),set_config('app.user_id',subject_id,true);
   IF (SELECT count(*) FROM virtual_ink.tenants) <> 0 OR
      (SELECT count(*) FROM virtual_ink.memberships m JOIN virtual_ink.tenants t ON t.id=m.tenant_id) <> 0
   THEN RAISE EXCEPTION 'Inactive, delivery or unassigned actor saw vendor scopes'; END IF;
 END LOOP;
END $$;
-- Empty customer result still has a durable self-scoped audit within this transaction.
INSERT INTO virtual_ink.membership_list_audits VALUES
 ('cccccccc-cccc-4ccc-8ccc-ccccccccccc5',now(),'66666666-6666-4666-8666-666666666666',
 'memberships.listed','66666666-6666-4666-8666-666666666666','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','allowed');
SELECT set_config('app.access_mode','',true);
DO $$ BEGIN
 BEGIN INSERT INTO virtual_ink.membership_list_audits VALUES
   ('cccccccc-cccc-4ccc-8ccc-ccccccccccc6',now(),'66666666-6666-4666-8666-666666666666',
   'memberships.listed','66666666-6666-4666-8666-666666666666','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','allowed');
   RAISE EXCEPTION 'Audit accepted without discovery mode'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF (SELECT count(*) FROM virtual_ink.membership_list_audits) <> 2 THEN RAISE EXCEPTION 'Discovery audit evidence missing'; END IF;
 IF has_any_column_privilege('virtual_ink_provisioner','virtual_ink.membership_list_audits','SELECT,INSERT,UPDATE,REFERENCES')
 THEN RAISE EXCEPTION 'Provisioning group gained discovery audit access'; END IF;
 IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='virtual_ink' AND c.relkind='r' AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity))
 THEN RAISE EXCEPTION 'RLS protection missing'; END IF;
 IF EXISTS (SELECT FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='virtual_ink' AND p.prosecdef)
 THEN RAISE EXCEPTION 'Definer function found'; END IF;
END $$;
ROLLBACK;
SELECT 'Membership discovery scope, cursor, immutable audit and selected-tenant assertions passed; fixtures rolled back' AS result;
