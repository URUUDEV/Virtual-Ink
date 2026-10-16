-- Supabase Auth adapter, disabled until configured on an isolated target.
-- The provider calls this hook after validating TOTP and before issuing AAL2.
-- No code, secret, token, address or unfiltered hook payload is stored.
CREATE SCHEMA virtual_ink_auth_guard;
REVOKE ALL ON SCHEMA virtual_ink_auth_guard FROM PUBLIC;
CREATE TABLE virtual_ink_auth_guard.settings (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 enabled boolean NOT NULL DEFAULT false,
 environment text NOT NULL DEFAULT 'unconfigured' CHECK(environment IN('unconfigured','local','preview'))
);
INSERT INTO virtual_ink_auth_guard.settings(singleton) VALUES(true);
CREATE TABLE virtual_ink_auth_guard.factor_state (
 user_id uuid NOT NULL, factor_id uuid NOT NULL, last_accepted_at timestamptz NOT NULL,
 PRIMARY KEY(user_id,factor_id)
);
ALTER TABLE virtual_ink_auth_guard.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_ink_auth_guard.settings FORCE ROW LEVEL SECURITY;
ALTER TABLE virtual_ink_auth_guard.factor_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_ink_auth_guard.factor_state FORCE ROW LEVEL SECURITY;

ALTER TABLE virtual_ink_security.events DROP CONSTRAINT events_source_check;
ALTER TABLE virtual_ink_security.events ADD CONSTRAINT events_source_check
 CHECK(source IN('web-admin','auth-provider-hook'));
CREATE INDEX provider_mfa_rate_idx ON virtual_ink_security.events(subject,occurred_at DESC)
 WHERE source='auth-provider-hook' AND metadata->>'decision'<>'rate_limited';

CREATE FUNCTION virtual_ink_auth_guard.mfa_verification_attempt(event jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE principal uuid; factor uuid; cid uuid:=gen_random_uuid(); moment timestamptz;
 last_accepted timestamptz; native_last timestamptz; recent_count integer;
 decision text; status integer; outcome text; severity text; cfg record;
BEGIN
 -- Invoker rights and this check both require the native Auth database identity.
 -- A browser cannot supply the provider's validation result or call this hook.
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='supabase_auth_admin' AND pg_has_role(current_user,oid,'USAGE')) THEN
  RAISE EXCEPTION 'Native Auth hook identity required' USING ERRCODE='42501';
 END IF;
 IF current_setting('transaction_isolation')<>'read committed' THEN
  RAISE EXCEPTION 'Native MFA requires READ COMMITTED' USING ERRCODE='25001';
 END IF;
 BEGIN
  IF jsonb_typeof(event)<>'object' OR jsonb_typeof(event->'valid') IS DISTINCT FROM 'boolean'
    OR event->>'factor_type' IS DISTINCT FROM 'totp' THEN RAISE invalid_parameter_value; END IF;
  principal:=(event->>'user_id')::uuid;factor:=(event->>'factor_id')::uuid;
  IF principal IS NULL OR factor IS NULL THEN RAISE invalid_parameter_value; END IF;
  IF event->'metadata'->>'uuid' IS NOT NULL THEN cid:=(event->'metadata'->>'uuid')::uuid; END IF;
 EXCEPTION WHEN invalid_text_representation OR invalid_parameter_value THEN
  decision:='invalid_hook_input';status:=400;
 END;
 IF decision IS NULL THEN
  -- Account-scoped serialization also covers concurrent challenges/factors.
  PERFORM pg_advisory_xact_lock(hashtextextended('virtual-ink-provider-mfa:'||principal::text,0));
  moment:=clock_timestamp();
  SELECT * INTO cfg FROM virtual_ink_auth_guard.settings WHERE singleton;
  IF NOT cfg.enabled OR cfg.environment NOT IN('local','preview') THEN
   decision:='disabled';status:=503;
  ELSE
   SELECT count(*) INTO recent_count FROM (
    SELECT 1 FROM virtual_ink_security.events WHERE subject=principal AND source='auth-provider-hook'
     AND metadata->>'decision'<>'rate_limited' AND occurred_at>moment-interval '5 minutes'
     ORDER BY occurred_at DESC LIMIT 5) recent;
   IF recent_count>=5 THEN decision:='rate_limited';status:=429;
   ELSIF (event->>'valid')::boolean THEN
    SELECT last_accepted_at INTO last_accepted FROM virtual_ink_auth_guard.factor_state
     WHERE user_id=principal AND factor_id=factor;
    -- Bootstrap conservatively from native successes, including provider-first
    -- use before hook activation. Auth owns these rows; clients cannot edit them.
    SELECT max(c.verified_at) INTO native_last FROM auth.mfa_challenges c
     JOIN auth.mfa_factors f ON f.id=c.factor_id AND f.user_id=principal WHERE f.id=factor;
    last_accepted:=greatest(last_accepted,native_last);
    -- Native TOTP uses 30-second periods with one period of skew each way.
    -- A code's total acceptance window is at most 90 seconds. Since the hook
    -- receives no code/counter, reject ALL valid attempts for that full window.
    IF last_accepted IS NOT NULL AND moment<last_accepted+interval '90 seconds' THEN
     decision:='cooldown';status:=429;
    ELSE
     INSERT INTO virtual_ink_auth_guard.factor_state VALUES(principal,factor,moment)
      ON CONFLICT(user_id,factor_id) DO UPDATE SET last_accepted_at=excluded.last_accepted_at;
     decision:='allowed';
    END IF;
   ELSE decision:='invalid'; END IF;
  END IF;
 END IF;
 moment:=coalesce(moment,clock_timestamp());
 outcome:=CASE WHEN decision='allowed' THEN 'attempt' WHEN decision='invalid' THEN 'failure' ELSE 'blocked' END;
 severity:=CASE WHEN decision='allowed' THEN 'info' WHEN decision<>'invalid' THEN 'alert'
  WHEN (SELECT count(*) FROM (SELECT 1 FROM virtual_ink_security.events e WHERE e.subject=principal
    AND e.source='auth-provider-hook' AND e.outcome IN('failure','blocked') AND e.occurred_at>moment-interval '5 minutes' LIMIT 2) failures)>=2
    THEN 'alert' ELSE 'warning' END;
 INSERT INTO virtual_ink_security.events(subject,action,outcome,severity,correlation_id,assurance,source,metadata,occurred_at)
 VALUES(principal,'mfa.provider.verify',outcome,severity,cid,'unknown','auth-provider-hook',
  jsonb_build_object('factorId',factor,'decision',decision),moment);
 -- This intent commits before native Auth issues a token. Do not label it a
 -- successful MFA session: native verification may still fail after the hook.
 IF status IS NOT NULL THEN RETURN jsonb_build_object('error',jsonb_build_object('http_code',status,
   'message',CASE WHEN status=429 THEN 'Authenticator verification is rate limited. Wait before trying again.'
    ELSE 'Authenticator verification is unavailable.' END)); END IF;
 RETURN jsonb_build_object('decision','continue');
END $$;

-- Remove permissive creator defaults; never create an Auth login or credential.
REVOKE ALL ON ALL TABLES IN SCHEMA virtual_ink_auth_guard FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA virtual_ink_auth_guard FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role','virtual_ink_api','virtual_ink_provisioner','virtual_ink_vendor_service','virtual_ink_security_service','virtual_ink_security_owner'] LOOP
  IF EXISTS(SELECT FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('REVOKE ALL ON SCHEMA virtual_ink_auth_guard FROM %I',r);
   EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA virtual_ink_auth_guard FROM %I',r);
   EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA virtual_ink_auth_guard FROM %I',r);
  END IF;
 END LOOP;
 IF EXISTS(SELECT FROM pg_roles WHERE rolname='supabase_auth_admin') THEN
  GRANT USAGE ON SCHEMA virtual_ink_auth_guard,virtual_ink_security TO supabase_auth_admin;
  GRANT SELECT ON virtual_ink_auth_guard.settings,virtual_ink_auth_guard.factor_state TO supabase_auth_admin;
  GRANT INSERT,UPDATE(last_accepted_at) ON virtual_ink_auth_guard.factor_state TO supabase_auth_admin;
  CREATE POLICY native_auth_settings ON virtual_ink_auth_guard.settings FOR SELECT TO supabase_auth_admin USING(true);
  CREATE POLICY native_auth_state ON virtual_ink_auth_guard.factor_state TO supabase_auth_admin USING(true) WITH CHECK(true);
  GRANT EXECUTE ON FUNCTION virtual_ink_auth_guard.mfa_verification_attempt(jsonb) TO supabase_auth_admin;
  GRANT SELECT(subject,source,metadata,occurred_at,outcome) ON virtual_ink_security.events TO supabase_auth_admin;
  GRANT INSERT(subject,action,outcome,severity,correlation_id,assurance,source,metadata,occurred_at) ON virtual_ink_security.events TO supabase_auth_admin;
  CREATE POLICY native_auth_event_read ON virtual_ink_security.events FOR SELECT TO supabase_auth_admin USING(source='auth-provider-hook');
  CREATE POLICY native_auth_event_insert ON virtual_ink_security.events FOR INSERT TO supabase_auth_admin WITH CHECK(
   source='auth-provider-hook' AND action='mfa.provider.verify' AND assurance='unknown' AND actor_id IS NULL AND target_id IS NULL
   AND requester IS NULL AND approver IS NULL AND executor IS NULL AND reason IS NULL AND expires_at IS NULL
   AND previous_roles='[]'::jsonb AND new_roles='[]'::jsonb AND metadata-ARRAY['factorId','decision']='{}'::jsonb);
 END IF;
END $$;

-- Repair ambiguous audit/request read columns, preserving all existing command
-- decisions. Only the migration administrator temporarily assumes the existing
-- non-login function owner; no runtime membership or CREATE privilege remains.
GRANT virtual_ink_security_owner TO CURRENT_USER;
GRANT CREATE ON SCHEMA virtual_ink_security TO virtual_ink_security_owner;
SET ROLE virtual_ink_security_owner;
CREATE OR REPLACE FUNCTION virtual_ink_security.command(p_action text,p_input jsonb,p_context jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE cfg record; principal uuid; actor uuid; sid uuid; actor_role text; target_role text;
 cid uuid; aid uuid:=gen_random_uuid(); target uuid; assignment virtual_ink_phase1.role_assignments%ROWTYPE;
 req virtual_ink_security.role_requests%ROWTYPE; recovery virtual_ink_security.recovery_requests%ROWTYPE;
 result jsonb; failure text; failure_state text; high boolean; recent boolean; mfa bigint; primary_time bigint;
 counter integer; fingerprint text; reason text; target_subject uuid; now_time timestamptz;
BEGIN
 BEGIN
  principal:=(p_context->>'subject')::uuid; sid:=(p_context->>'sessionId')::uuid;
  cid:=(p_context->>'correlationId')::uuid;
  mfa:=nullif(p_context->>'mfaAt','')::bigint; primary_time:=nullif(p_context->>'primaryAt','')::bigint;
  IF principal IS NULL OR sid IS NULL OR cid IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION 'CONFLICT'; END IF;
  IF p_action='role.request' THEN target:=(p_input->>'targetUserId')::uuid;reason:=left(p_input->>'reason',500);target_role:=p_input->>'role'; END IF;
  SELECT * INTO cfg FROM virtual_ink_security.configuration WHERE singleton;
  IF NOT cfg.enabled OR cfg.environment IS DISTINCT FROM p_context->>'environment' OR
    cfg.issuer IS DISTINCT FROM p_context->>'issuer' THEN RAISE EXCEPTION 'IDENTITY_UNAVAILABLE'; END IF;
  high:=p_action IN('role.request','role.approve','role.execute','roles.lookup','requests.list','events.list','recovery.approve','protected.check')
    OR p_action='mfa.reserve' AND p_input->>'kind'='unenroll';
  IF high AND (p_context->>'aal' IS DISTINCT FROM 'aal2' OR nullif(p_context->>'stepUpAt','')::bigint IS DISTINCT FROM mfa OR mfa IS NULL) THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  recent:=high OR p_action='mfa.reserve' AND p_input->>'kind' IN('enroll','cancel-enrollment');
  -- Serialize the complete admin decision and re-read every role after locking.
  PERFORM pg_advisory_xact_lock(74016,1);
  IF p_action IN('logout.result','password.result') THEN
   IF p_input->>'outcome' NOT IN('success','failure') OR NOT EXISTS(SELECT FROM virtual_ink_security.events
      WHERE correlation_id=cid AND subject=principal AND session_id=sid AND action=CASE WHEN p_action='logout.result' THEN 'logout' ELSE 'password.change' END AND outcome='attempt') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  ELSIF NOT virtual_ink_security.provider_session(principal,sid,mfa,primary_time,high,recent) THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  now_time:=clock_timestamp();
  SELECT i.user_id INTO actor FROM virtual_ink.identities i JOIN virtual_ink.users u ON u.id=i.user_id
   WHERE i.provider='supabase' AND i.issuer=cfg.issuer AND i.subject=principal AND i.active AND u.active;
  SELECT role INTO actor_role FROM virtual_ink_phase1.role_assignments
   WHERE user_id=actor AND active AND (expires_at IS NULL OR expires_at>now_time);
  IF p_action NOT IN('account.status','logout','logout.result','password.begin','password.result','recovery.request','mfa.result') AND actor_role NOT IN
    ('ADMIN','SUPER_ADMIN','SECURITY_ADMIN','FINANCE_ADMIN','DISPUTE_REVIEWER','PAYOUT_APPROVER') OR
    p_action NOT IN('account.status','logout','logout.result','password.begin','password.result','recovery.request','mfa.result') AND actor_role IS NULL THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  IF p_action IN('status','account.status') THEN
   result:=jsonb_build_object('role',actor_role,'userId',actor,'canManageRoles',actor_role='SUPER_ADMIN');
  ELSIF p_action='password.begin' THEN
   IF actor_role IN('ADMIN','SUPER_ADMIN','SECURITY_ADMIN','FINANCE_ADMIN','DISPUTE_REVIEWER','PAYOUT_APPROVER') AND
     (p_context->>'aal' IS DISTINCT FROM 'aal2' OR nullif(p_context->>'stepUpAt','')::bigint IS DISTINCT FROM mfa OR mfa IS NULL OR
      NOT virtual_ink_security.provider_session(principal,sid,mfa,primary_time,true,true)) THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
   INSERT INTO virtual_ink_security.attempts VALUES(principal,'password.update',floor(extract(epoch FROM now_time)/300)::bigint,1)
    ON CONFLICT(subject,kind,bucket) DO UPDATE SET attempts=virtual_ink_security.attempts.attempts+1 RETURNING attempts INTO counter;
   IF counter>5 THEN failure:='RATE_LIMITED'; END IF;
   result:='{}';
  ELSIF p_action='mfa.reserve' THEN
   IF p_input->>'kind' NOT IN('enroll','challenge','verify','reauthenticate','unenroll','cancel-enrollment') THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
   INSERT INTO virtual_ink_security.attempts VALUES(principal,p_input->>'kind',floor(extract(epoch FROM now_time)/300)::bigint,1)
   ON CONFLICT(subject,kind,bucket) DO UPDATE SET attempts=virtual_ink_security.attempts.attempts+1 RETURNING attempts INTO counter;
   IF counter>(CASE WHEN p_input->>'kind' IN('verify','reauthenticate','enroll') THEN 5 ELSE 10 END) THEN
    failure:='RATE_LIMITED';
   ELSIF p_input->>'kind'='verify' THEN
    fingerprint:=p_input->>'digest';
    INSERT INTO virtual_ink_security.used_mfa_codes VALUES(principal,(p_input->>'factorId')::uuid,fingerprint,now_time+interval '5 minutes')
    ON CONFLICT(subject,factor_id,digest) DO UPDATE SET expires_at=excluded.expires_at
      WHERE virtual_ink_security.used_mfa_codes.expires_at<=now_time;
    IF NOT FOUND THEN failure:='UNAUTHENTICATED'; END IF;
   END IF;
   result:=jsonb_build_object('reserved',failure IS NULL);
  ELSIF p_action='mfa.result' THEN
   IF p_input->>'kind' NOT IN('enroll','challenge','verify','reauthenticate','unenroll','cancel-enrollment') OR
      p_input->>'outcome' NOT IN('success','failure') OR NOT EXISTS(SELECT FROM virtual_ink_security.events
       WHERE correlation_id=cid AND subject=principal AND action='mfa.'||(p_input->>'kind') AND outcome='attempt') THEN
    RAISE EXCEPTION 'FORBIDDEN'; END IF;
   result:='{}';
  ELSIF p_action IN('role.request','role.approve','role.execute') THEN
   IF actor_role IS DISTINCT FROM 'SUPER_ADMIN' THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
   IF p_action='role.request' THEN
    target:=(p_input->>'targetUserId')::uuid; reason:=p_input->>'reason';
    IF target IS NULL OR target=actor THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
    IF reason IS NULL OR length(trim(reason))<10 OR length(reason)>500 THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
    SELECT * INTO assignment FROM virtual_ink_phase1.role_assignments WHERE user_id=target AND active FOR UPDATE;
    IF NOT FOUND OR assignment.id IS DISTINCT FROM (p_input->>'expectedAssignmentId')::uuid OR
      NOT EXISTS(SELECT FROM virtual_ink.users WHERE id=target AND active) THEN RAISE EXCEPTION 'CONFLICT'; END IF;
    target_role:=p_input->>'role';
    IF target_role NOT IN('CUSTOMER','ADMIN','SUPER_ADMIN','SECURITY_ADMIN','FINANCE_ADMIN','DISPUTE_REVIEWER','PAYOUT_APPROVER') OR
      target_role=assignment.role THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
    IF target_role='CUSTOMER' AND assignment.role NOT IN('ADMIN','SUPER_ADMIN','SECURITY_ADMIN','FINANCE_ADMIN','DISPUTE_REVIEWER','PAYOUT_APPROVER') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
    IF p_input->>'expiresAt' IS NOT NULL AND (target_role IN('CUSTOMER','SUPER_ADMIN') OR
      (p_input->>'expiresAt')::timestamptz<=now_time OR (p_input->>'expiresAt')::timestamptz>now_time+interval '30 days') THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
    INSERT INTO virtual_ink_security.role_requests(id,target_id,expected_assignment,previous_role,new_role,requester,reason,expires_at)
     VALUES((p_input->>'requestId')::uuid,target,assignment.id,assignment.role,target_role,actor,reason,(p_input->>'expiresAt')::timestamptz) RETURNING * INTO req;
   ELSE
    SELECT * INTO req FROM virtual_ink_security.role_requests WHERE id=(p_input->>'requestId')::uuid FOR UPDATE;
    IF NOT FOUND OR req.target_id=actor OR req.request_expires_at<=now_time OR
      req.expires_at IS NOT NULL AND req.expires_at<=now_time THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
    IF NOT EXISTS(SELECT FROM virtual_ink.users WHERE id=req.target_id AND active) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
    IF p_action='role.approve' THEN
     IF req.state<>'pending' OR req.requester=actor THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
     UPDATE virtual_ink_security.role_requests SET state='approved',approver=actor WHERE id=req.id RETURNING * INTO req;
    ELSE
     IF req.state<>'approved' OR actor NOT IN(req.requester,req.approver) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
     IF NOT EXISTS(SELECT FROM virtual_ink_phase1.role_assignments r JOIN virtual_ink.users u ON u.id=r.user_id
       WHERE r.user_id=req.requester AND r.role='SUPER_ADMIN' AND r.active AND u.active) OR
       NOT EXISTS(SELECT FROM virtual_ink_phase1.role_assignments r JOIN virtual_ink.users u ON u.id=r.user_id
       WHERE r.user_id=req.approver AND r.role='SUPER_ADMIN' AND r.active AND u.active) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
     SELECT * INTO assignment FROM virtual_ink_phase1.role_assignments WHERE user_id=req.target_id AND active FOR UPDATE;
     IF NOT FOUND OR assignment.id<>req.expected_assignment OR assignment.role<>req.previous_role THEN RAISE EXCEPTION 'CONFLICT'; END IF;
     IF assignment.role='SUPER_ADMIN' AND (SELECT count(*) FROM virtual_ink_phase1.role_assignments r
       JOIN virtual_ink.users u ON u.id=r.user_id WHERE r.role='SUPER_ADMIN' AND r.active AND u.active)<=1 THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
     UPDATE virtual_ink_phase1.role_assignments SET active=false,version=2,revoked_by=actor,
       revocation_approval_reference=req.id,revocation_reason_code='reviewed_role_change',revoked_at=now_time WHERE id=assignment.id;
     INSERT INTO virtual_ink_phase1.role_assignment_audits(id,assignment_id,user_id,role,version,action,actor_id,approval_reference,reason_code,request_id)
       VALUES(gen_random_uuid(),assignment.id,req.target_id,assignment.role,2,'role.revoked',actor,req.id,'reviewed_role_change',cid);
     INSERT INTO virtual_ink_phase1.role_assignments(id,user_id,role,granted_by,approval_reference,reason_code,expires_at)
       VALUES(aid,req.target_id,req.new_role,actor,req.id,'reviewed_role_change',req.expires_at);
     INSERT INTO virtual_ink_phase1.role_assignment_audits(id,assignment_id,user_id,role,version,action,actor_id,approval_reference,reason_code,request_id)
       VALUES(gen_random_uuid(),aid,req.target_id,req.new_role,1,'role.granted',actor,req.id,'reviewed_role_change',cid);
     FOR target_subject IN SELECT subject::uuid FROM virtual_ink.identities WHERE user_id=req.target_id AND provider='supabase' AND issuer=cfg.issuer LOOP
       PERFORM virtual_ink_security.revoke_provider_sessions(target_subject);
     END LOOP;
     UPDATE virtual_ink_security.role_requests SET state='executed',executor=actor WHERE id=req.id RETURNING * INTO req;
     -- Deferred triggers must run while the restricted definer is still active.
     SET CONSTRAINTS ALL IMMEDIATE;
     SET CONSTRAINTS ALL DEFERRED;
    END IF;
   END IF;
   result:=jsonb_build_object('requestId',req.id,'state',req.state,'targetUserId',req.target_id,'previousRole',req.previous_role,
     'role',req.new_role,'requester',req.requester,'approver',req.approver,'executor',req.executor,'reason',req.reason,'expiresAt',req.expires_at);
  ELSIF p_action='roles.lookup' THEN
   IF actor_role NOT IN('SUPER_ADMIN','SECURITY_ADMIN') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
   SELECT jsonb_build_object('userId',u.id,'assignmentId',r.id,'role',r.role,'expiresAt',r.expires_at)
    INTO result FROM virtual_ink.users u LEFT JOIN virtual_ink_phase1.role_assignments r ON r.user_id=u.id AND r.active
    WHERE u.id=(p_input->>'targetUserId')::uuid AND u.active;
   IF result IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  ELSIF p_action='requests.list' THEN
   IF actor_role IS DISTINCT FROM 'SUPER_ADMIN' THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
   SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO result FROM
    (SELECT r.id,r.target_id,r.previous_role,r.new_role,r.requester,r.approver,r.executor,r.reason,r.expires_at,r.request_expires_at,r.state
     FROM virtual_ink_security.role_requests r ORDER BY r.created_at DESC,r.id LIMIT 20) q;
  ELSIF p_action='events.list' THEN
   IF actor_role NOT IN('SUPER_ADMIN','SECURITY_ADMIN') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
   SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO result FROM
    (SELECT e.id,e.action,e.outcome,e.severity,e.correlation_id,e.target_id,e.actor_id,e.requester,e.approver,e.executor,e.reason,
      e.previous_roles,e.new_roles,e.assurance,e.source,e.expires_at,e.occurred_at FROM virtual_ink_security.events e
     ORDER BY e.occurred_at DESC,e.id LIMIT 30) q;
  ELSIF p_action='recovery.request' THEN
   reason:=p_input->>'reason';
   IF reason IS NULL OR length(trim(reason))<10 OR length(reason)>500 THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
   INSERT INTO virtual_ink_security.recovery_requests(id,subject,reason) VALUES((p_input->>'requestId')::uuid,principal,reason);
   result:=jsonb_build_object('requestId',p_input->>'requestId','state','pending_private_review');
  ELSIF p_action='recovery.approve' THEN
   IF actor_role IS DISTINCT FROM 'SUPER_ADMIN' THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
   SELECT * INTO recovery FROM virtual_ink_security.recovery_requests WHERE id=(p_input->>'requestId')::uuid FOR UPDATE;
   IF NOT FOUND OR recovery.subject=principal OR recovery.state<>'pending' OR recovery.created_at<now_time-interval '24 hours' OR
      actor IS NOT DISTINCT FROM recovery.approver_one THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
   IF recovery.approver_one IS NOT NULL AND NOT EXISTS(SELECT FROM virtual_ink_phase1.role_assignments r
     JOIN virtual_ink.users u ON u.id=r.user_id WHERE r.user_id=recovery.approver_one AND r.role='SUPER_ADMIN' AND r.active AND u.active) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
   IF recovery.approver_one IS NULL THEN UPDATE virtual_ink_security.recovery_requests SET approver_one=actor WHERE id=recovery.id;
   ELSE UPDATE virtual_ink_security.recovery_requests SET approver_two=actor,state='approved' WHERE id=recovery.id; END IF;
   result:=jsonb_build_object('requestId',recovery.id,'state','requires_private_identity_review');
  ELSIF p_action='protected.check' THEN
   IF NOT (actor_role='SUPER_ADMIN' OR actor_role='ADMIN' AND p_input->>'capability' IN('vendor.verify','account.suspend') OR
    actor_role='SECURITY_ADMIN' AND p_input->>'capability' IN('account.suspend','security.settings','security.read') OR
    actor_role='FINANCE_ADMIN' AND p_input->>'capability'='refund.approve' OR
    actor_role='PAYOUT_APPROVER' AND p_input->>'capability' IN('payment.release','payout.change') OR
    actor_role='DISPUTE_REVIEWER' AND p_input->>'capability'='dispute.review') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
   result:=jsonb_build_object('authorized',true,'implemented',false);
  ELSIF p_action='request.invalid' THEN RAISE EXCEPTION 'VALIDATION_FAILED';
  ELSIF p_action IN('logout','logout.result','password.result') THEN result:='{}';
  ELSE RAISE EXCEPTION 'NOT_FOUND';
  END IF;
 EXCEPTION WHEN OTHERS THEN
  failure_state:=SQLSTATE;
  failure:=CASE WHEN SQLERRM IN('UNAUTHENTICATED','FORBIDDEN','CONFLICT','VALIDATION_FAILED','NOT_FOUND','IDENTITY_UNAVAILABLE') THEN SQLERRM ELSE 'CONFLICT' END;
 END;
 -- The inner subtransaction rolls failed mutations back; this event still commits.
 INSERT INTO virtual_ink_security.events(id,subject,actor_id,action,outcome,severity,correlation_id,session_id,assurance,
  source,target_id,previous_roles,new_roles,requester,approver,executor,reason,expires_at,metadata)
 VALUES(aid,principal,actor,CASE WHEN p_action IN('mfa.reserve','mfa.result') THEN 'mfa.'||coalesce(p_input->>'kind','invalid') WHEN p_action='logout.result' THEN 'logout'
   WHEN p_action IN('password.begin','password.result') THEN 'password.change' ELSE p_action END,
  CASE WHEN failure IS NOT NULL THEN 'failure' WHEN p_action IN('mfa.reserve','logout','password.begin') THEN 'attempt'
    WHEN p_action IN('mfa.result','logout.result','password.result') THEN p_input->>'outcome' ELSE 'success' END,
  CASE WHEN failure IS NOT NULL OR p_action IN('recovery.request','recovery.approve') OR p_action='mfa.result' AND p_input->>'kind' IN('unenroll','enroll','cancel-enrollment') OR
    p_action='mfa.result' AND p_input->>'outcome'='failure' AND (SELECT count(*) FROM virtual_ink_security.events WHERE subject=principal
      AND outcome='failure' AND occurred_at>clock_timestamp()-interval '5 minutes')>=2 THEN 'alert'
    WHEN p_action='mfa.result' AND p_input->>'outcome'='failure' THEN 'warning' ELSE 'info' END,
  coalesce(cid,gen_random_uuid()),sid,CASE WHEN failure IS NOT NULL THEN 'unknown' WHEN p_context->>'aal'='aal2' THEN 'aal2' ELSE 'aal1' END,'web-admin',coalesce(req.target_id,target),
  CASE WHEN req.previous_role IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(req.previous_role) END,
  CASE WHEN coalesce(req.new_role,target_role) IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(coalesce(req.new_role,target_role)) END,
  coalesce(req.requester,actor),req.approver,CASE WHEN p_action='role.execute' AND failure IS NULL THEN actor END,coalesce(req.reason,reason),req.expires_at,
  jsonb_build_object('error',failure,'databaseCode',failure_state,'changeRequestId',coalesce(req.id::text,recovery.id::text,p_input->>'requestId')));
 RETURN CASE WHEN failure IS NULL THEN jsonb_build_object('ok',true,'data',result,'auditId',aid)
  ELSE jsonb_build_object('ok',false,'error',failure,'auditId',aid) END;
END $$;

RESET ROLE;
REVOKE CREATE ON SCHEMA virtual_ink_security FROM virtual_ink_security_owner;
REVOKE virtual_ink_security_owner FROM CURRENT_USER;

-- Provider adapter. Auth schema was inspected through catalog reads, not user rows.
-- PL/pgSQL defers table resolution, allowing portable migrations on fresh PostgreSQL.
CREATE OR REPLACE FUNCTION virtual_ink_security.provider_session(p_subject uuid,p_session uuid,p_mfa bigint,p_primary bigint,p_strong boolean,p_recent boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE live record; mfa_time bigint; primary_time bigint; now_second bigint;
BEGIN
 -- Native Auth tables have provider-owned RLS. This narrow private broker uses
 -- the migration administrator's existing Auth rights; no runtime role receives
 -- BYPASSRLS, Auth table access, ownership or an elevated credential. It is not
 -- a PostgREST RPC: only the business function owner can EXECUTE it.
 IF session_user<>current_user AND NOT pg_has_role(session_user,'virtual_ink_security_service','USAGE') THEN RETURN false; END IF;
 now_second:=floor(extract(epoch FROM clock_timestamp()))::bigint;
 SELECT s.aal::text,s.factor_id INTO live FROM auth.sessions s JOIN auth.users u ON u.id=s.user_id
  WHERE s.id=p_session AND s.user_id=p_subject AND (s.not_after IS NULL OR s.not_after>clock_timestamp())
  AND u.is_anonymous=false AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL
  AND (u.banned_until IS NULL OR u.banned_until<=clock_timestamp());
 IF NOT FOUND THEN RETURN false; END IF;
 IF p_recent THEN
  SELECT floor(extract(epoch FROM updated_at))::bigint INTO primary_time FROM auth.mfa_amr_claims
   WHERE session_id=p_session AND authentication_method='password';
  IF p_primary IS NULL OR primary_time IS DISTINCT FROM p_primary OR primary_time>now_second OR primary_time<=now_second-300 THEN RETURN false; END IF;
 END IF;
 IF p_strong THEN
  IF live.aal<>'aal2' OR p_mfa IS NULL THEN RETURN false; END IF;
  SELECT floor(extract(epoch FROM a.updated_at))::bigint INTO mfa_time FROM auth.mfa_amr_claims a
   JOIN auth.mfa_factors f ON f.id=live.factor_id AND f.user_id=p_subject AND f.factor_type::text='totp' AND f.status::text='verified'
    AND f.created_at<=a.updated_at WHERE a.session_id=p_session AND a.authentication_method='totp';
  IF mfa_time IS DISTINCT FROM p_mfa OR mfa_time>now_second OR mfa_time<=now_second-300 THEN RETURN false; END IF;
  -- AAL2 alone is insufficient if the provider hook was never enabled. Bind the
  -- native AMR to the factor's actual provider-hook reservation. This timestamp
  -- is created by the native Auth identity before issuance, never by a browser.
  IF NOT EXISTS(SELECT FROM virtual_ink_auth_guard.settings g
    JOIN virtual_ink_security.configuration c ON c.singleton
    JOIN virtual_ink_auth_guard.factor_state f ON f.user_id=p_subject AND f.factor_id=live.factor_id
    WHERE g.singleton AND g.enabled AND c.enabled AND g.environment=c.environment
     AND floor(extract(epoch FROM f.last_accepted_at))::bigint BETWEEN p_mfa-10 AND p_mfa) THEN RETURN false; END IF;
 END IF;
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION virtual_ink_security.revoke_provider_sessions(p_subject uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ BEGIN
 IF session_user<>current_user AND NOT pg_has_role(session_user,'virtual_ink_security_service','USAGE') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 DELETE FROM auth.sessions WHERE user_id=p_subject;
END $$;
-- No Auth table/policy changes, LOGIN, passwords or runtime memberships. The
-- broker returns a boolean or performs one subject-bound session deletion only.
-- Its EXECUTE ACL excludes browsers and the runtime service itself; callers must
-- pass through the business command's verified actor, approval and audit gates.
REVOKE ALL ON FUNCTION virtual_ink_security.provider_session(uuid,uuid,bigint,bigint,boolean,boolean),virtual_ink_security.revoke_provider_sessions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION virtual_ink_security.provider_session(uuid,uuid,bigint,bigint,boolean,boolean),virtual_ink_security.revoke_provider_sessions(uuid) TO virtual_ink_security_owner;
