-- Business state machine. Called only by trusted, verified provider/HTTP adapters.
CREATE OR REPLACE FUNCTION virtual_ink.vendor_payload(p jsonb,allowed text[]) RETURNS void LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN IF jsonb_typeof(p) IS DISTINCT FROM 'object' OR octet_length(p::text)>16384 OR EXISTS(SELECT FROM jsonb_object_keys(p) k WHERE NOT k=ANY(allowed||ARRAY['requestId'])) THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF; END $$;
CREATE OR REPLACE FUNCTION virtual_ink.vendor_live_profile(p virtual_ink.vendor_profiles) RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
  PERFORM set_config('app.vendor_target_user',p.owner_user_id::text,true),set_config('app.vendor_target_tenant',p.tenant_id::text,true);
  RETURN EXISTS(SELECT FROM virtual_ink.tenants t WHERE t.id=p.tenant_id AND t.active) AND
    EXISTS(SELECT FROM virtual_ink.users u WHERE u.id=p.owner_user_id AND u.active) AND
    EXISTS(SELECT FROM virtual_ink.memberships m WHERE m.tenant_id=p.tenant_id AND m.user_id=p.owner_user_id AND m.role='VendorOwner' AND m.active) AND
    EXISTS(SELECT FROM virtual_ink.user_roles r WHERE r.user_id=p.owner_user_id AND r.role='Customer' AND r.active) AND
    NOT EXISTS(SELECT FROM virtual_ink.user_roles r WHERE r.user_id=p.owner_user_id AND r.role='DeliveryPartner' AND r.active);
END $$;
CREATE OR REPLACE FUNCTION virtual_ink.vendor_onboarding_command(command text,p jsonb) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $$
#variable_conflict use_variable
DECLARE actor_provider text:=current_setting('app.vendor_actor_provider',true); actor_issuer text:=current_setting('app.vendor_actor_issuer',true); actor_subject uuid:=virtual_ink.vendor_subject();
  actor_user uuid; owner_user uuid; target_tenant uuid; app_id uuid; operation uuid; request_id uuid; fingerprint text; existing virtual_ink.vendor_onboarding_events;
  a virtual_ink.vendor_applications; storefront virtual_ink.vendor_profiles; identity_row virtual_ink.identities; person virtual_ink.users;
  new_profile jsonb; result jsonb; items jsonb:='[]'::jsonb; detail jsonb; event_id uuid:=gen_random_uuid(); event_action text; previous_status text;
  next_status text; next_version integer; expected integer; total integer; page_limit integer; seen integer:=0; last_time timestamptz; last_id uuid;
  cursor_data jsonb; next_cursor text; status_filter text; candidate record; rate_written integer; review_granted boolean; decision text; checks jsonb; feedback text; evidence uuid; service text;
BEGIN
  SET CONSTRAINTS ALL DEFERRED;
  IF command IS NULL OR command NOT IN ('session','application.list','application.get','application.create','application.save','application.submit','admin.list','admin.get','admin.decide','storefront.get','availability.set') THEN RAISE EXCEPTION 'VENDOR_NOT_FOUND'; END IF;
  IF jsonb_typeof(p) IS DISTINCT FROM 'object' OR octet_length(p::text)>16384 THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
  request_id:=coalesce((p->>'requestId')::uuid,gen_random_uuid());
  PERFORM set_config('app.vendor_target_user','',true),set_config('app.vendor_target_subject','',true),set_config('app.vendor_target_tenant','',true),set_config('app.vendor_actor_user','',true),set_config('app.vendor_public_slug','',true),set_config('lock_timeout','2s',true);

  IF command='storefront.get' THEN
    PERFORM virtual_ink.vendor_payload(p,ARRAY['slug']);
    IF jsonb_typeof(p->'slug') IS DISTINCT FROM 'string' OR length(p->>'slug') NOT BETWEEN 3 AND 60 OR p->>'slug'!~'^[a-z0-9]+(-[a-z0-9]+)*$' THEN RAISE EXCEPTION 'VENDOR_NOT_FOUND'; END IF;
    PERFORM set_config('app.vendor_mode','public',true),set_config('app.vendor_public_slug',p->>'slug',true);
    SELECT * INTO storefront FROM virtual_ink.vendor_profiles s WHERE s.slug=p->>'slug';
    IF NOT FOUND OR NOT virtual_ink.vendor_live_profile(storefront) OR NOT EXISTS(SELECT FROM virtual_ink.vendor_applications x WHERE x.id=storefront.application_id AND x.status='approved') THEN RAISE EXCEPTION 'VENDOR_NOT_FOUND'; END IF;
    RETURN virtual_ink.vendor_storefront_data(storefront);
  END IF;
  IF coalesce(current_setting('app.vendor_actor_verified',true),'')<>'true' OR actor_subject IS NULL OR actor_provider<>'supabase' OR coalesce(actor_issuer,'')='' THEN RAISE EXCEPTION 'VENDOR_UNAUTHENTICATED'; END IF;
  PERFORM set_config('app.vendor_mode','owner',true),set_config('app.vendor_target_subject',actor_subject::text,true);
  SELECT * INTO identity_row FROM virtual_ink.identities i WHERE i.provider=actor_provider AND i.issuer=actor_issuer AND i.subject=actor_subject;
  IF FOUND THEN
    IF NOT identity_row.active THEN RAISE EXCEPTION 'VENDOR_FORBIDDEN'; END IF;
    actor_user:=identity_row.user_id; PERFORM set_config('app.vendor_actor_user',actor_user::text,true);
    SELECT * INTO person FROM virtual_ink.users u WHERE u.id=actor_user;
    IF NOT FOUND OR NOT person.active OR NOT EXISTS(SELECT FROM virtual_ink.user_roles r WHERE r.user_id=actor_user AND r.role='Customer' AND r.active) OR EXISTS(SELECT FROM virtual_ink.user_roles r WHERE r.user_id=actor_user AND r.role='DeliveryPartner' AND r.active) THEN RAISE EXCEPTION 'VENDOR_FORBIDDEN'; END IF;
  END IF;
  PERFORM set_config('app.vendor_target_subject','',true);
  INSERT INTO virtual_ink.vendor_request_limits(provider,issuer,subject,request_count) VALUES(actor_provider,actor_issuer,actor_subject,1)
    ON CONFLICT(provider,issuer,subject) DO UPDATE SET window_started_at=CASE WHEN vendor_request_limits.window_started_at<clock_timestamp()-interval '1 minute' THEN clock_timestamp() ELSE vendor_request_limits.window_started_at END,
      request_count=CASE WHEN vendor_request_limits.window_started_at<clock_timestamp()-interval '1 minute' THEN 1 ELSE vendor_request_limits.request_count+1 END
    WHERE vendor_request_limits.window_started_at<clock_timestamp()-interval '1 minute' OR vendor_request_limits.request_count<60;
  GET DIAGNOSTICS rate_written=ROW_COUNT; IF rate_written<>1 THEN RAISE EXCEPTION 'VENDOR_RATE_LIMITED'; END IF;
  review_granted:=EXISTS(SELECT FROM virtual_ink.vendor_reviewer_grants g WHERE g.provider=actor_provider AND g.issuer=actor_issuer AND g.subject=actor_subject AND g.active AND g.expires_at>now());
  IF command LIKE 'admin.%' THEN
    IF NOT virtual_ink.vendor_can_review() THEN RAISE EXCEPTION 'VENDOR_FORBIDDEN'; END IF;
    PERFORM set_config('app.vendor_mode','review',true);
  END IF;

  IF command='session' THEN
    PERFORM virtual_ink.vendor_payload(p,ARRAY[]::text[]);
    FOR storefront IN SELECT * FROM virtual_ink.vendor_profiles s WHERE s.owner_user_id=actor_user ORDER BY s.approved_at DESC,s.tenant_id DESC LIMIT 20 LOOP
      IF virtual_ink.vendor_live_profile(storefront) THEN items:=items||jsonb_build_array(virtual_ink.vendor_storefront_data(storefront)); END IF;
    END LOOP;
    RETURN jsonb_build_object('accountId',actor_subject,'reviewAccess',CASE WHEN NOT review_granted THEN 'none' WHEN virtual_ink.vendor_can_review() THEN 'ready' ELSE 'mfa_required' END,'vendors',items);
  END IF;
  IF command IN ('application.list','admin.list') THEN
    PERFORM virtual_ink.vendor_payload(p,CASE WHEN command='admin.list' THEN ARRAY['limit','cursor','status'] ELSE ARRAY['limit','cursor'] END);
    IF jsonb_typeof(p->'limit') IS DISTINCT FROM 'number' OR p->>'limit'!~'^[0-9]{1,2}$' THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
    page_limit:=(p->>'limit')::integer; IF page_limit NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
    IF command='admin.list' THEN status_filter:=p->>'status'; IF status_filter IS NULL OR status_filter NOT IN ('draft','submitted','changes_requested','approved','rejected') THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF; END IF;
    IF p->'cursor' IS DISTINCT FROM 'null'::jsonb AND p?'cursor' THEN
      IF jsonb_typeof(p->'cursor') IS DISTINCT FROM 'string' OR length(p->>'cursor')>150 OR p->>'cursor'!~'^[A-Za-z0-9_-]+$' THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
      cursor_data:=convert_from(decode(translate(p->>'cursor','-_','+/')||repeat('=',(4-length(p->>'cursor')%4)%4),'base64'),'UTF8')::jsonb;
      PERFORM virtual_ink.vendor_payload(cursor_data,ARRAY['updatedAt','id']);
      IF (SELECT count(*) FROM jsonb_object_keys(cursor_data))<>2 THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
      IF jsonb_typeof(cursor_data->'updatedAt') IS DISTINCT FROM 'string' OR length(cursor_data->>'updatedAt')>40 THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
      last_time:=(cursor_data->>'updatedAt')::timestamptz; last_id:=(cursor_data->>'id')::uuid;
      IF last_time IS NULL OR last_id IS NULL OR NOT isfinite(last_time) THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
    END IF;
    FOR a IN SELECT * FROM virtual_ink.vendor_applications x WHERE (command='admin.list' AND x.status=status_filter OR command='application.list' AND x.provider=actor_provider AND x.issuer=actor_issuer AND x.subject=actor_subject)
      AND (last_time IS NULL OR (x.updated_at,x.id)<(last_time,last_id)) ORDER BY x.updated_at DESC,x.id DESC LIMIT page_limit+1 LOOP
      seen:=seen+1;
      IF seen>page_limit THEN next_cursor:=rtrim(translate(replace(encode(convert_to(cursor_data::text,'UTF8'),'base64'),E'\n',''),'+/','-_'),'='); EXIT; END IF;
      items:=items||jsonb_build_array(virtual_ink.vendor_summary(a)); cursor_data:=jsonb_build_object('updatedAt',a.updated_at,'id',a.id);
    END LOOP;
    result:=jsonb_build_object('items',items,'nextCursor',next_cursor);
    IF command='admin.list' THEN
      INSERT INTO virtual_ink.vendor_onboarding_events(id,actor_provider,actor_issuer,actor_subject,operation_id,action,version,request_id,request_hash,result)
      VALUES(event_id,actor_provider,actor_issuer,actor_subject,request_id,'review.listed',0,request_id,encode(sha256(convert_to((p-'requestId')::text,'UTF8')),'hex'),jsonb_build_object('returned',jsonb_array_length(items)));
    END IF;
    RETURN result;
  END IF;
  IF command IN ('application.get','admin.get') THEN
    PERFORM virtual_ink.vendor_payload(p,ARRAY['applicationId']); app_id:=(p->>'applicationId')::uuid;
    SELECT * INTO a FROM virtual_ink.vendor_applications x WHERE x.id=app_id AND (command='admin.get' OR x.provider=actor_provider AND x.issuer=actor_issuer AND x.subject=actor_subject);
    IF NOT FOUND THEN RAISE EXCEPTION 'VENDOR_NOT_FOUND'; END IF;
    SELECT coalesce(jsonb_agg(e.item ORDER BY e.occurred_at DESC,e.id DESC),'[]'::jsonb) INTO items FROM (
      SELECT x.occurred_at,x.id,jsonb_build_object('action',x.action,'occurredAt',x.occurred_at,'version',x.version,'fromStatus',x.from_status,'toStatus',x.to_status) AS item
      FROM virtual_ink.vendor_onboarding_events x WHERE x.application_id=a.id AND x.action NOT IN ('review.viewed','review.listed') ORDER BY x.occurred_at DESC,x.id DESC LIMIT 20) e;
    result:=virtual_ink.vendor_summary(a)||jsonb_build_object('profile',a.profile,'feedback',a.feedback,'consent',a.consent,'events',items);
    IF command='admin.get' THEN
      INSERT INTO virtual_ink.vendor_onboarding_events(id,actor_provider,actor_issuer,actor_subject,operation_id,application_id,action,version,request_id,request_hash,result)
      VALUES(event_id,actor_provider,actor_issuer,actor_subject,request_id,a.id,'review.viewed',a.version,request_id,encode(sha256(convert_to(a.id::text,'UTF8')),'hex'),jsonb_build_object('applicationId',a.id));
    END IF;
    RETURN result;
  END IF;

  PERFORM virtual_ink.vendor_payload(p,CASE command WHEN 'application.create' THEN ARRAY['operationId','profile'] WHEN 'application.save' THEN ARRAY['operationId','applicationId','expectedVersion','profile'] WHEN 'application.submit' THEN ARRAY['operationId','applicationId','expectedVersion','consent'] WHEN 'admin.decide' THEN ARRAY['operationId','applicationId','expectedVersion','decision','feedback','checks','evidenceReference'] ELSE ARRAY['operationId','tenantId','availability'] END);
  operation:=(p->>'operationId')::uuid; IF operation IS NULL THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
  fingerprint:=encode(sha256(convert_to(jsonb_build_object('command',command,'payload',p-'requestId'-'operationId')::text,'UTF8')),'hex');
  PERFORM pg_advisory_xact_lock(hashtextextended(actor_provider||actor_issuer||actor_subject::text||operation::text,0));
  SELECT * INTO existing FROM virtual_ink.vendor_onboarding_events e WHERE e.actor_provider=actor_provider AND e.actor_issuer=actor_issuer AND e.actor_subject=actor_subject AND e.operation_id=operation;
  IF FOUND THEN IF existing.request_hash<>fingerprint THEN RAISE EXCEPTION 'VENDOR_CONFLICT'; END IF; RETURN existing.result||jsonb_build_object('historicalReplay',true); END IF;
  IF command='availability.set' THEN
    target_tenant:=(p->>'tenantId')::uuid;
    IF jsonb_typeof(p->'availability') IS DISTINCT FROM 'string' OR p->>'availability' NOT IN ('accepting_enquiries','paused') THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
    SELECT * INTO storefront FROM virtual_ink.vendor_profiles s WHERE s.tenant_id=target_tenant AND s.owner_user_id=actor_user FOR UPDATE;
    IF NOT FOUND OR NOT virtual_ink.vendor_live_profile(storefront) THEN RAISE EXCEPTION 'VENDOR_NOT_FOUND'; END IF;
    app_id:=storefront.application_id; SELECT * INTO a FROM virtual_ink.vendor_applications x WHERE x.id=app_id AND x.subject=actor_subject AND x.status='approved';
    IF NOT FOUND THEN RAISE EXCEPTION 'VENDOR_NOT_FOUND'; END IF;
    UPDATE virtual_ink.vendor_profiles SET availability=p->>'availability' WHERE tenant_id=target_tenant;
    result:=jsonb_build_object('tenantId',target_tenant,'availability',p->>'availability','historicalReplay',false);
    INSERT INTO virtual_ink.vendor_onboarding_events(id,actor_provider,actor_issuer,actor_subject,operation_id,application_id,action,version,request_id,request_hash,result)
    VALUES(event_id,actor_provider,actor_issuer,actor_subject,operation,app_id,'availability.changed',a.version,request_id,fingerprint,result);
    SET CONSTRAINTS ALL IMMEDIATE; RETURN result;
  END IF;
  IF command='application.create' THEN
    new_profile:=virtual_ink.vendor_profile_valid(p->'profile');
    PERFORM pg_advisory_xact_lock(hashtextextended(actor_provider||actor_issuer||actor_subject::text||'/create',0));
    IF EXISTS(SELECT FROM virtual_ink.vendor_applications x WHERE x.provider=actor_provider AND x.issuer=actor_issuer AND x.subject=actor_subject AND x.status IN ('draft','submitted','changes_requested')) THEN RAISE EXCEPTION 'VENDOR_CONFLICT'; END IF;
    app_id:=gen_random_uuid(); next_status:='draft'; next_version:=1; event_action:='application.created';
    INSERT INTO virtual_ink.vendor_applications(id,provider,issuer,subject,status,version,profile) VALUES(app_id,actor_provider,actor_issuer,actor_subject,next_status,next_version,new_profile) RETURNING * INTO a;
  ELSE
    app_id:=(p->>'applicationId')::uuid;
    IF jsonb_typeof(p->'expectedVersion') IS DISTINCT FROM 'number' OR p->>'expectedVersion'!~'^[1-9][0-9]{0,6}$' THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
    expected:=(p->>'expectedVersion')::integer;
    SELECT * INTO a FROM virtual_ink.vendor_applications x WHERE x.id=app_id AND (command='admin.decide' OR x.provider=actor_provider AND x.issuer=actor_issuer AND x.subject=actor_subject) FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'VENDOR_NOT_FOUND'; END IF;
    IF a.version<>expected OR a.version>=1000000 THEN RAISE EXCEPTION 'VENDOR_CONFLICT'; END IF;
    previous_status:=a.status; next_version:=a.version+1; next_status:=a.status; new_profile:=a.profile;
    IF command='application.save' THEN
      IF a.status NOT IN ('draft','changes_requested') THEN RAISE EXCEPTION 'VENDOR_CONFLICT'; END IF;
      new_profile:=virtual_ink.vendor_profile_valid(p->'profile'); event_action:='application.saved'; a.consent:=false;
    ELSIF command='application.submit' THEN
      IF a.status NOT IN ('draft','changes_requested') THEN RAISE EXCEPTION 'VENDOR_CONFLICT'; END IF;
      IF p->'consent' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
      new_profile:=virtual_ink.vendor_profile_valid(a.profile,true); next_status:='submitted'; event_action:='application.submitted'; a.consent:=true; a.submitted_at:=clock_timestamp(); a.feedback:='';
    ELSE
      IF a.status<>'submitted' OR a.subject=actor_subject THEN RAISE EXCEPTION 'VENDOR_FORBIDDEN'; END IF;
      decision:=p->>'decision'; checks:=p->'checks'; feedback:=p->>'feedback'; evidence:=(p->>'evidenceReference')::uuid;
      IF decision IS NULL OR decision NOT IN ('approve','request_changes','reject') OR jsonb_typeof(p->'feedback') IS DISTINCT FROM 'string' OR length(btrim(feedback)) NOT BETWEEN 1 AND 500 OR feedback~('[<>[:cntrl:]'||chr(8234)||'-'||chr(8238)||chr(8294)||'-'||chr(8297)||']') OR jsonb_typeof(checks) IS DISTINCT FROM 'object' OR (SELECT count(*) FROM jsonb_object_keys(checks))<>3 OR EXISTS(SELECT FROM jsonb_each(checks) x WHERE x.key NOT IN ('ownerIdentity','businessEvidence','serviceCapabilities') OR jsonb_typeof(x.value)<>'boolean') THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
      a.feedback:=btrim(feedback); a.reviewed_at:=clock_timestamp();
      IF decision='approve' THEN
        IF evidence IS NULL OR checks<>jsonb_build_object('ownerIdentity',true,'businessEvidence',true,'serviceCapabilities',true) OR NOT a.consent THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
        new_profile:=virtual_ink.vendor_profile_valid(a.profile,true);
        PERFORM set_config('app.vendor_target_subject',a.subject::text,true);
        SELECT * INTO identity_row FROM virtual_ink.identities i WHERE i.provider=a.provider AND i.issuer=a.issuer AND i.subject=a.subject;
        IF FOUND THEN
          IF NOT identity_row.active THEN RAISE EXCEPTION 'VENDOR_FORBIDDEN'; END IF;
          owner_user:=identity_row.user_id; PERFORM set_config('app.vendor_target_user',owner_user::text,true);
          IF NOT EXISTS(SELECT FROM virtual_ink.users u WHERE u.id=owner_user AND u.active) OR NOT EXISTS(SELECT FROM virtual_ink.user_roles r WHERE r.user_id=owner_user AND r.role='Customer' AND r.active) OR EXISTS(SELECT FROM virtual_ink.user_roles r WHERE r.user_id=owner_user AND r.role='DeliveryPartner' AND r.active) THEN RAISE EXCEPTION 'VENDOR_FORBIDDEN'; END IF;
        ELSE
          owner_user:=gen_random_uuid(); PERFORM set_config('app.vendor_target_user',owner_user::text,true);
          INSERT INTO virtual_ink.users(id) VALUES(owner_user);
          INSERT INTO virtual_ink.identities(provider,issuer,subject,user_id) VALUES(a.provider,a.issuer,a.subject,owner_user);
          INSERT INTO virtual_ink.user_roles(user_id,role) VALUES(owner_user,'Customer');
          INSERT INTO virtual_ink.provisioning_audits(operation_id,approval_id,reviewer_id,db_actor,action,request_fingerprint,user_id,outcome)
          VALUES(gen_random_uuid(),event_id,actor_subject,session_user,'create_account',fingerprint,owner_user,'created');
        END IF;
        target_tenant:=gen_random_uuid(); PERFORM set_config('app.vendor_target_tenant',target_tenant::text,true);
        INSERT INTO virtual_ink.tenants(id,kind) VALUES(target_tenant,'vendor');
        INSERT INTO virtual_ink.memberships(tenant_id,user_id,role) VALUES(target_tenant,owner_user,'VendorOwner');
        INSERT INTO virtual_ink.provisioning_audits(operation_id,approval_id,reviewer_id,db_actor,action,request_fingerprint,user_id,tenant_id,outcome)
        VALUES(gen_random_uuid(),event_id,actor_subject,session_user,'create_vendor',fingerprint,owner_user,target_tenant,'created');
        INSERT INTO virtual_ink.vendor_profiles(tenant_id,application_id,owner_user_id,slug,business_name,summary,country,city,handoff,typical_working_days)
        VALUES(target_tenant,a.id,owner_user,new_profile->>'slug',new_profile->>'businessName',new_profile->>'summary',new_profile->>'country',new_profile->>'city',new_profile->>'handoff',(new_profile->>'typicalWorkingDays')::integer);
        FOR service IN SELECT jsonb_array_elements_text(new_profile->'services') LOOP INSERT INTO virtual_ink.vendor_profile_services(tenant_id,service_code) VALUES(target_tenant,service); END LOOP;
        a.tenant_id:=target_tenant; next_status:='approved'; event_action:='application.approved';
      ELSIF decision='request_changes' THEN next_status:='changes_requested'; event_action:='application.changes_requested'; a.consent:=false;
      ELSE next_status:='rejected'; event_action:='application.rejected'; END IF;
    END IF;
    UPDATE virtual_ink.vendor_applications SET status=next_status,version=next_version,profile=new_profile,consent=a.consent,feedback=a.feedback,submitted_at=a.submitted_at,reviewed_at=a.reviewed_at,tenant_id=a.tenant_id,updated_at=clock_timestamp() WHERE id=app_id RETURNING * INTO a;
  END IF;
  result:=jsonb_build_object('applicationId',a.id,'status',a.status,'version',a.version,'tenantId',a.tenant_id,'historicalReplay',false);
  INSERT INTO virtual_ink.vendor_application_snapshots(application_id,version,profile,consent,status) VALUES(a.id,a.version,a.profile,a.consent,a.status);
  INSERT INTO virtual_ink.vendor_onboarding_events(id,actor_provider,actor_issuer,actor_subject,operation_id,application_id,action,from_status,to_status,version,request_id,request_hash,result,evidence_reference,verification_checks)
  VALUES(event_id,actor_provider,actor_issuer,actor_subject,operation,a.id,event_action,previous_status,a.status,a.version,request_id,fingerprint,result,evidence,checks);
  IF event_action IN ('application.submitted','application.changes_requested','application.rejected','application.approved') THEN
    INSERT INTO virtual_ink.vendor_notification_outbox(id,application_id,recipient_provider,recipient_issuer,recipient_subject,event,version) VALUES(gen_random_uuid(),a.id,a.provider,a.issuer,a.subject,event_action,a.version);
  END IF;
  -- Deferred legacy/core constraints must execute while the narrow function role is active.
  SET CONSTRAINTS ALL IMMEDIATE;
  RETURN result;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'VENDOR_CONFLICT';
  WHEN invalid_text_representation OR invalid_datetime_format OR datetime_field_overflow OR numeric_value_out_of_range THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED';
END $$;
REVOKE ALL ON FUNCTION virtual_ink.vendor_payload(jsonb,text[]),virtual_ink.vendor_live_profile(virtual_ink.vendor_profiles),virtual_ink.vendor_onboarding_command(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION virtual_ink.vendor_payload(jsonb,text[]),virtual_ink.vendor_live_profile(virtual_ink.vendor_profiles),virtual_ink.vendor_onboarding_command(text,jsonb) TO virtual_ink_vendor_service;
