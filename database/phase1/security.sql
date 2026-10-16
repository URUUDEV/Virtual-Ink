-- Portable business security boundary. The provider functions below deny until
-- the separately reviewed provider adapter is installed. No login or seed admin.
CREATE SCHEMA virtual_ink_security;
REVOKE ALL ON SCHEMA virtual_ink_security FROM PUBLIC;
CREATE ROLE virtual_ink_security_service NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE virtual_ink_security_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
GRANT USAGE ON SCHEMA virtual_ink_security,virtual_ink_phase1,virtual_ink TO virtual_ink_security_owner;
GRANT USAGE ON SCHEMA virtual_ink_security TO virtual_ink_security_service;

ALTER TABLE virtual_ink_phase1.role_assignments DROP CONSTRAINT role_assignments_role_check;
ALTER TABLE virtual_ink_phase1.role_assignments ADD CONSTRAINT role_assignments_role_check CHECK(role IN
 ('CUSTOMER','VENDOR','DESIGNER','DELIVERY_PARTNER','ORGANIZATION_MEMBER','ORGANIZATION_ADMIN',
  'ADMIN','SUPER_ADMIN','SECURITY_ADMIN','FINANCE_ADMIN','DISPUTE_REVIEWER','PAYOUT_APPROVER'));
ALTER TABLE virtual_ink_phase1.role_assignments ADD COLUMN expires_at timestamptz;
ALTER TABLE virtual_ink_phase1.role_assignments ADD CONSTRAINT assignment_expiry CHECK
 (expires_at IS NULL OR expires_at>created_at AND role<>'SUPER_ADMIN');
-- Expiry is part of the immutable grant. It cannot silently be extended.
CREATE FUNCTION virtual_ink_security.protect_expiry() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$ BEGIN
 IF NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN RAISE EXCEPTION 'Immutable privilege expiry' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_expiry BEFORE UPDATE ON virtual_ink_phase1.role_assignments
FOR EACH ROW EXECUTE FUNCTION virtual_ink_security.protect_expiry();

CREATE TABLE virtual_ink_security.configuration (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 environment text NOT NULL CHECK(environment IN('unconfigured','preview','production','local')),
 issuer text NOT NULL, enabled boolean NOT NULL DEFAULT false
);
INSERT INTO virtual_ink_security.configuration VALUES(true,'unconfigured','',false);
CREATE TABLE virtual_ink_security.role_requests (
 id uuid PRIMARY KEY, target_id uuid NOT NULL REFERENCES virtual_ink.users(id),
 expected_assignment uuid NOT NULL REFERENCES virtual_ink_phase1.role_assignments(id),
 previous_role text NOT NULL, new_role text NOT NULL,
 requester uuid NOT NULL REFERENCES virtual_ink.users(id), approver uuid REFERENCES virtual_ink.users(id),
 executor uuid REFERENCES virtual_ink.users(id), reason text NOT NULL CHECK(length(reason) BETWEEN 10 AND 500),
 expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 request_expires_at timestamptz NOT NULL DEFAULT clock_timestamp()+interval '15 minutes',
 state text NOT NULL DEFAULT 'pending' CHECK(state IN('pending','approved','executed')),
 CHECK(target_id<>requester AND (approver IS NULL OR approver<>requester AND approver<>target_id)
   AND (executor IS NULL OR executor<>target_id))
);
CREATE INDEX role_requests_created_idx ON virtual_ink_security.role_requests(created_at,id);
CREATE TABLE virtual_ink_security.events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), subject uuid, actor_id uuid,
 action text NOT NULL, outcome text NOT NULL CHECK(outcome IN('attempt','success','failure','blocked')),
 severity text NOT NULL CHECK(severity IN('info','warning','alert')),
 correlation_id uuid NOT NULL, session_id uuid, assurance text NOT NULL CHECK(assurance IN('aal1','aal2','unknown')),
 source text NOT NULL CHECK(source='web-admin'), target_id uuid,
 previous_roles jsonb NOT NULL DEFAULT '[]', new_roles jsonb NOT NULL DEFAULT '[]',
 requester uuid, approver uuid, executor uuid, reason text, expires_at timestamptz,
 metadata jsonb NOT NULL DEFAULT '{}', occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX security_events_subject_idx ON virtual_ink_security.events(subject,occurred_at);
CREATE INDEX security_events_correlation_idx ON virtual_ink_security.events(correlation_id);
CREATE TABLE virtual_ink_security.attempts (
 subject uuid NOT NULL, kind text NOT NULL, bucket bigint NOT NULL, attempts integer NOT NULL,
 PRIMARY KEY(subject,kind,bucket)
);
CREATE TABLE virtual_ink_security.used_mfa_codes (
 subject uuid NOT NULL, factor_id uuid NOT NULL, digest text NOT NULL CHECK(digest~'^[a-f0-9]{64}$'),
 expires_at timestamptz NOT NULL, PRIMARY KEY(subject,factor_id,digest)
);
CREATE TABLE virtual_ink_security.recovery_requests (
 id uuid PRIMARY KEY, subject uuid NOT NULL, reason text NOT NULL CHECK(length(reason) BETWEEN 10 AND 500),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), state text NOT NULL DEFAULT 'pending',
 approver_one uuid, approver_two uuid,
 CHECK(state IN('pending','approved')),
 CHECK(approver_one IS NULL OR approver_two IS NULL OR approver_one<>approver_two)
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['configuration','role_requests','events','attempts','used_mfa_codes','recovery_requests'] LOOP
  EXECUTE format('ALTER TABLE virtual_ink_security.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE virtual_ink_security.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY security_owner ON virtual_ink_security.%I TO virtual_ink_security_owner USING(true) WITH CHECK(true)',t);
 END LOOP;
END $$;
GRANT SELECT ON ALL TABLES IN SCHEMA virtual_ink_security TO virtual_ink_security_owner;
GRANT INSERT ON virtual_ink_security.events,virtual_ink_security.role_requests,virtual_ink_security.recovery_requests TO virtual_ink_security_owner;
GRANT INSERT,UPDATE ON virtual_ink_security.attempts,virtual_ink_security.used_mfa_codes TO virtual_ink_security_owner;
GRANT UPDATE(state,approver,executor) ON virtual_ink_security.role_requests TO virtual_ink_security_owner;
GRANT UPDATE(state,approver_one,approver_two) ON virtual_ink_security.recovery_requests TO virtual_ink_security_owner;
CREATE TRIGGER immutable_security_events BEFORE UPDATE OR DELETE ON virtual_ink_security.events
FOR EACH ROW EXECUTE FUNCTION virtual_ink_phase1.immutable_audit();
CREATE TRIGGER immutable_security_events_truncate BEFORE TRUNCATE ON virtual_ink_security.events
FOR EACH STATEMENT EXECUTE FUNCTION virtual_ink_phase1.immutable_audit();
GRANT SELECT ON virtual_ink.users,virtual_ink.identities TO virtual_ink_security_owner;
CREATE POLICY security_user_lookup ON virtual_ink.users FOR SELECT TO virtual_ink_security_owner USING(true);
CREATE POLICY security_identity_lookup ON virtual_ink.identities FOR SELECT TO virtual_ink_security_owner USING(true);
GRANT SELECT,INSERT,UPDATE ON virtual_ink_phase1.role_assignments TO virtual_ink_security_owner;
GRANT SELECT,INSERT ON virtual_ink_phase1.role_assignment_audits TO virtual_ink_security_owner;
CREATE POLICY security_assignment_write ON virtual_ink_phase1.role_assignments TO virtual_ink_security_owner USING(true) WITH CHECK(true);
CREATE POLICY security_assignment_audit ON virtual_ink_phase1.role_assignment_audits TO virtual_ink_security_owner USING(true) WITH CHECK(true);

-- Provider ports: replaced by security-supabase.sql; never accept a boolean MFA flag.
CREATE FUNCTION virtual_ink_security.provider_session(p_subject uuid,p_session uuid,p_mfa bigint,p_primary bigint,p_strong boolean,p_recent boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN RETURN false; END $$;
CREATE FUNCTION virtual_ink_security.revoke_provider_sessions(p_subject uuid) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN RAISE EXCEPTION 'Provider unavailable'; END $$;

-- One private entrypoint, EXECUTE only for the dedicated server group. Authenticated
-- browser roles cannot call it, set its context or directly mutate any security table.
CREATE FUNCTION virtual_ink_security.command(p_action text,p_input jsonb,p_context jsonb) RETURNS jsonb
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
    (SELECT id,target_id,previous_role,new_role,requester,approver,executor,reason,expires_at,request_expires_at,state
     FROM virtual_ink_security.role_requests ORDER BY created_at DESC,id LIMIT 20) q;
  ELSIF p_action='events.list' THEN
   IF actor_role NOT IN('SUPER_ADMIN','SECURITY_ADMIN') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
   SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO result FROM
    (SELECT id,action,outcome,severity,correlation_id,target_id,actor_id,requester,approver,executor,reason,
      previous_roles,new_roles,assurance,source,expires_at,occurred_at FROM virtual_ink_security.events
     ORDER BY occurred_at DESC,id LIMIT 30) q;
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

-- Remove defaults and expose only the command, never table DML, to the server group.
REVOKE ALL ON ALL TABLES IN SCHEMA virtual_ink_security FROM PUBLIC,virtual_ink_security_service;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA virtual_ink_security FROM PUBLIC;
GRANT virtual_ink_security_owner TO CURRENT_USER;
GRANT CREATE ON SCHEMA virtual_ink_security TO virtual_ink_security_owner;
ALTER FUNCTION virtual_ink_security.command(text,jsonb,jsonb) OWNER TO virtual_ink_security_owner;
REVOKE CREATE ON SCHEMA virtual_ink_security FROM virtual_ink_security_owner;
REVOKE virtual_ink_security_owner FROM CURRENT_USER;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA virtual_ink_security TO virtual_ink_security_owner;
GRANT EXECUTE ON FUNCTION virtual_ink_security.command(text,jsonb,jsonb) TO virtual_ink_security_service;
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role','virtual_ink_api','virtual_ink_provisioner','virtual_ink_vendor_service'] LOOP
  IF EXISTS(SELECT FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('REVOKE ALL ON SCHEMA virtual_ink_security FROM %I',r);
   EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA virtual_ink_security FROM %I',r);
   EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA virtual_ink_security FROM %I',r);
  END IF;
 END LOOP;
END $$;
