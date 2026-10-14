-- Reviewed synthetic, transaction-rolled-back domain/RLS assertions. No Auth or human signoff.
BEGIN;
GRANT virtual_ink_vendor_service TO CURRENT_USER;
INSERT INTO virtual_ink.vendor_reviewer_grants(provider,issuer,subject,expires_at,approval_reference)
VALUES('supabase','https://odgxcuwueessxfsoveza.supabase.co/auth/v1','a2222222-2222-4222-8222-222222222222',now()+interval '1 day','a3333333-3333-4333-8333-333333333333');
INSERT INTO virtual_ink.vendor_reviewer_grant_audits(id,provider,issuer,subject,action,approval_reference)
VALUES(gen_random_uuid(),'supabase','https://odgxcuwueessxfsoveza.supabase.co/auth/v1','a2222222-2222-4222-8222-222222222222','granted','a3333333-3333-4333-8333-333333333333');
SET CONSTRAINTS ALL IMMEDIATE;
SET ROLE virtual_ink_vendor_service;
DO $$
DECLARE profile jsonb:=jsonb_build_object('businessName','Synthetic Studio','contactName','Test Partner','email','partner@example.invalid','phone','','country','Demo country','city','Demo area','slug','synthetic-core-studio','summary','Synthetic apparel services.','registrationNumber','','notes','','services',jsonb_build_array('apparel'),'handoff','collection','typicalWorkingDays',5);
  r jsonb; app uuid; tenant uuid; op uuid:=gen_random_uuid(); before_count integer; blocked boolean;
BEGIN
  PERFORM set_config('app.vendor_actor_provider','supabase',true),set_config('app.vendor_actor_issuer','https://odgxcuwueessxfsoveza.supabase.co/auth/v1',true),set_config('app.vendor_actor_subject','a1111111-1111-4111-8111-111111111111',true),set_config('app.vendor_actor_verified','true',true),set_config('app.vendor_actor_mfa','false',true);
  r:=virtual_ink.vendor_onboarding_command('application.create',jsonb_build_object('operationId',op,'profile',profile)); app:=(r->>'applicationId')::uuid;
  IF r->>'status'<>'draft' THEN RAISE EXCEPTION 'ASSERT create'; END IF;
  r:=virtual_ink.vendor_onboarding_command('application.create',jsonb_build_object('operationId',op,'profile',profile)); IF r->>'historicalReplay'<>'true' THEN RAISE EXCEPTION 'ASSERT replay'; END IF;
  blocked:=false; BEGIN PERFORM virtual_ink.vendor_onboarding_command('application.create',jsonb_build_object('operationId',op,'profile',profile||jsonb_build_object('city','Changed'))); EXCEPTION WHEN raise_exception THEN IF SQLERRM='VENDOR_CONFLICT' THEN blocked:=true; ELSE RAISE; END IF; END; IF NOT blocked THEN RAISE EXCEPTION 'ASSERT changed replay'; END IF;
  r:=virtual_ink.vendor_onboarding_command('application.submit',jsonb_build_object('operationId',gen_random_uuid(),'applicationId',app,'expectedVersion',1,'consent',true)); IF r->>'status'<>'submitted' THEN RAISE EXCEPTION 'ASSERT submit'; END IF;
  blocked:=false; BEGIN PERFORM virtual_ink.vendor_onboarding_command('application.save',jsonb_build_object('operationId',gen_random_uuid(),'applicationId',app,'expectedVersion',1,'profile',profile)); EXCEPTION WHEN raise_exception THEN IF SQLERRM='VENDOR_CONFLICT' THEN blocked:=true; ELSE RAISE; END IF; END; IF NOT blocked THEN RAISE EXCEPTION 'ASSERT stale version'; END IF;
  PERFORM set_config('app.vendor_actor_subject','a4444444-4444-4444-8444-444444444444',true);
  blocked:=false; BEGIN PERFORM virtual_ink.vendor_onboarding_command('application.get',jsonb_build_object('applicationId',app)); EXCEPTION WHEN raise_exception THEN IF SQLERRM='VENDOR_NOT_FOUND' THEN blocked:=true; ELSE RAISE; END IF; END; IF NOT blocked THEN RAISE EXCEPTION 'ASSERT cross-owner'; END IF;
  blocked:=false; BEGIN PERFORM virtual_ink.vendor_onboarding_command('admin.list',jsonb_build_object('limit',20,'cursor',NULL,'status','submitted')); EXCEPTION WHEN raise_exception THEN IF SQLERRM='VENDOR_FORBIDDEN' THEN blocked:=true; ELSE RAISE; END IF; END; IF NOT blocked THEN RAISE EXCEPTION 'ASSERT no reviewer'; END IF;
  PERFORM set_config('app.vendor_actor_subject','a2222222-2222-4222-8222-222222222222',true);
  blocked:=false; BEGIN PERFORM virtual_ink.vendor_onboarding_command('admin.list',jsonb_build_object('limit',20,'cursor',NULL,'status','submitted')); EXCEPTION WHEN raise_exception THEN IF SQLERRM='VENDOR_FORBIDDEN' THEN blocked:=true; ELSE RAISE; END IF; END; IF NOT blocked THEN RAISE EXCEPTION 'ASSERT MFA'; END IF;
  PERFORM set_config('app.vendor_actor_mfa','true',true);
  r:=virtual_ink.vendor_onboarding_command('admin.list',jsonb_build_object('limit',1,'cursor',NULL,'status','submitted')); IF jsonb_array_length(r->'items')<>1 THEN RAISE EXCEPTION 'ASSERT review queue'; END IF;
  r:=virtual_ink.vendor_onboarding_command('admin.decide',jsonb_build_object('operationId',gen_random_uuid(),'applicationId',app,'expectedVersion',2,'decision','request_changes','feedback','Synthetic service detail needs review.','checks',jsonb_build_object('ownerIdentity',false,'businessEvidence',false,'serviceCapabilities',false),'evidenceReference',NULL)); IF r->>'status'<>'changes_requested' THEN RAISE EXCEPTION 'ASSERT changes'; END IF;
  PERFORM set_config('app.vendor_actor_subject','a1111111-1111-4111-8111-111111111111',true),set_config('app.vendor_actor_mfa','false',true);
  r:=virtual_ink.vendor_onboarding_command('application.save',jsonb_build_object('operationId',gen_random_uuid(),'applicationId',app,'expectedVersion',3,'profile',profile));
  r:=virtual_ink.vendor_onboarding_command('application.submit',jsonb_build_object('operationId',gen_random_uuid(),'applicationId',app,'expectedVersion',4,'consent',true));
  PERFORM set_config('app.vendor_actor_subject','a2222222-2222-4222-8222-222222222222',true),set_config('app.vendor_actor_mfa','true',true);
  op:=gen_random_uuid(); r:=virtual_ink.vendor_onboarding_command('admin.decide',jsonb_build_object('operationId',op,'applicationId',app,'expectedVersion',5,'decision','approve','feedback','Synthetic rollback-only checks recorded.','checks',jsonb_build_object('ownerIdentity',true,'businessEvidence',true,'serviceCapabilities',true),'evidenceReference',gen_random_uuid()));
  IF r->>'status'<>'approved' OR r->>'tenantId' IS NULL THEN RAISE EXCEPTION 'ASSERT approve'; END IF; tenant:=(r->>'tenantId')::uuid;
  PERFORM set_config('app.vendor_actor_subject','a1111111-1111-4111-8111-111111111111',true),set_config('app.vendor_actor_mfa','false',true);
  r:=virtual_ink.vendor_onboarding_command('session','{}'); IF jsonb_array_length(r->'vendors')<>1 THEN RAISE EXCEPTION 'ASSERT owner activation'; END IF;
  r:=virtual_ink.vendor_onboarding_command('availability.set',jsonb_build_object('operationId',gen_random_uuid(),'tenantId',tenant,'availability','accepting_enquiries')); IF r->>'availability'<>'accepting_enquiries' THEN RAISE EXCEPTION 'ASSERT availability'; END IF;
  r:=virtual_ink.vendor_onboarding_command('storefront.get',jsonb_build_object('slug','synthetic-core-studio')); IF r?'email' OR r?'contactName' OR r?'phone' OR r->>'businessName'<>'Synthetic Studio' THEN RAISE EXCEPTION 'ASSERT public projection'; END IF;
  blocked:=false; BEGIN UPDATE virtual_ink.vendor_profiles SET business_name='Unreviewed' WHERE tenant_id=tenant; EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END; IF NOT blocked THEN RAISE EXCEPTION 'ASSERT profile column rights'; END IF;
  blocked:=false; BEGIN DELETE FROM virtual_ink.vendor_onboarding_events WHERE application_id=app; EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END; IF NOT blocked THEN RAISE EXCEPTION 'ASSERT immutable audit rights'; END IF;
END $$;
RESET ROLE;
SET CONSTRAINTS ALL IMMEDIATE;
SELECT 'passed: rollback-only create, replay/conflict, submit, version, cross-owner, reviewer/MFA, changes, approval/activation, availability, public privacy and immutable rights' AS result;
ROLLBACK;
