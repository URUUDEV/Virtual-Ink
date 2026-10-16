-- Strong replacement enrollment and serialized application factor removal.
-- Existing role/audit decisions are preserved. Uncertain provider removal
-- outcomes remain reserved until a privately reviewed, audited reconciliation.
CREATE TABLE virtual_ink_security.factor_removals (
 subject uuid PRIMARY KEY, correlation_id uuid NOT NULL, session_id uuid NOT NULL, factor_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE virtual_ink_security.factor_removals ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_ink_security.factor_removals FORCE ROW LEVEL SECURITY;
REVOKE ALL ON virtual_ink_security.factor_removals FROM PUBLIC,virtual_ink_security_service;
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role','supabase_auth_admin','virtual_ink_api','virtual_ink_provisioner','virtual_ink_vendor_service'] LOOP
  IF EXISTS(SELECT FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('REVOKE ALL ON virtual_ink_security.factor_removals FROM %I',r);
  END IF;
 END LOOP;
END $$;
CREATE POLICY security_owner ON virtual_ink_security.factor_removals
 TO virtual_ink_security_owner USING(true) WITH CHECK(true);
GRANT SELECT,INSERT,DELETE ON virtual_ink_security.factor_removals TO virtual_ink_security_owner;
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
    OR p_action='mfa.reserve' AND p_input->>'kind' IN('unenroll','replace-enroll');
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
   IF p_input->>'kind' NOT IN('enroll','replace-enroll','challenge','verify','reauthenticate','unenroll','cancel-enrollment') THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
   INSERT INTO virtual_ink_security.attempts VALUES(principal,p_input->>'kind',floor(extract(epoch FROM now_time)/300)::bigint,1)
   ON CONFLICT(subject,kind,bucket) DO UPDATE SET attempts=virtual_ink_security.attempts.attempts+1 RETURNING attempts INTO counter;
   IF counter>(CASE WHEN p_input->>'kind' IN('verify','reauthenticate','enroll','replace-enroll') THEN 5 ELSE 10 END) THEN
    failure:='RATE_LIMITED';
   ELSIF p_input->>'kind'='verify' THEN
    fingerprint:=p_input->>'digest';
    INSERT INTO virtual_ink_security.used_mfa_codes VALUES(principal,(p_input->>'factorId')::uuid,fingerprint,now_time+interval '5 minutes')
    ON CONFLICT(subject,factor_id,digest) DO UPDATE SET expires_at=excluded.expires_at
      WHERE virtual_ink_security.used_mfa_codes.expires_at<=now_time;
    IF NOT FOUND THEN failure:='UNAUTHENTICATED'; END IF;
   END IF;
   IF failure IS NULL AND p_input->>'kind'='unenroll' THEN
    -- This reservation spans the provider HTTP operation, across application
    -- instances. It never expires automatically: an uncertain provider outcome
    -- must be privately reconciled before another removal can begin.
    INSERT INTO virtual_ink_security.factor_removals(subject,correlation_id,session_id,factor_id)
     VALUES(principal,cid,sid,(p_input->>'factorId')::uuid) ON CONFLICT(subject) DO NOTHING;
    IF NOT FOUND THEN failure:='CONFLICT'; END IF;
   END IF;
   result:=jsonb_build_object('reserved',failure IS NULL);
  ELSIF p_action='mfa.result' THEN
   IF p_input->>'kind' NOT IN('enroll','replace-enroll','challenge','verify','reauthenticate','unenroll','cancel-enrollment') OR
      p_input->>'outcome' NOT IN('success','failure') OR NOT EXISTS(SELECT FROM virtual_ink_security.events
       WHERE correlation_id=cid AND subject=principal AND action='mfa.'||(p_input->>'kind') AND outcome='attempt') THEN
    RAISE EXCEPTION 'FORBIDDEN'; END IF;
   IF p_input->>'kind'='unenroll' AND
     (p_input->>'outcome'='success' OR p_input->'providerAttempted'='false'::jsonb) THEN
    DELETE FROM virtual_ink_security.factor_removals
     WHERE subject=principal AND correlation_id=cid AND session_id=sid;
   END IF;
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
  CASE WHEN failure IS NOT NULL OR p_action IN('recovery.request','recovery.approve') OR p_action='mfa.result' AND p_input->>'kind' IN('unenroll','enroll','replace-enroll','cancel-enrollment') OR
    p_action='mfa.result' AND p_input->>'outcome'='failure' AND (SELECT count(*) FROM virtual_ink_security.events WHERE subject=principal
      AND outcome='failure' AND occurred_at>clock_timestamp()-interval '5 minutes')>=2 THEN 'alert'
    WHEN p_action='mfa.result' AND p_input->>'outcome'='failure' THEN 'warning' ELSE 'info' END,
  coalesce(cid,gen_random_uuid()),sid,CASE WHEN failure IS NOT NULL THEN 'unknown' WHEN p_context->>'aal'='aal2' THEN 'aal2' ELSE 'aal1' END,'web-admin',coalesce(req.target_id,target),
  CASE WHEN req.previous_role IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(req.previous_role) END,
  CASE WHEN coalesce(req.new_role,target_role) IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(coalesce(req.new_role,target_role)) END,
  coalesce(req.requester,actor),req.approver,CASE WHEN p_action='role.execute' AND failure IS NULL THEN actor END,coalesce(req.reason,reason),req.expires_at,
  jsonb_build_object('error',failure,'databaseCode',failure_state,'changeRequestId',coalesce(req.id::text,recovery.id::text,p_input->>'requestId'),'factorId',CASE WHEN p_action IN('mfa.reserve','mfa.result') THEN p_input->>'factorId' END,'providerAttempted',CASE WHEN p_action='mfa.result' AND p_input->>'kind'='unenroll' THEN p_input->'providerAttempted' END));
 RETURN CASE WHEN failure IS NULL THEN jsonb_build_object('ok',true,'data',result,'auditId',aid)
  ELSE jsonb_build_object('ok',false,'error',failure,'auditId',aid) END;
END $$;

RESET ROLE;
REVOKE CREATE ON SCHEMA virtual_ink_security FROM virtual_ink_security_owner;
REVOKE virtual_ink_security_owner FROM CURRENT_USER;
