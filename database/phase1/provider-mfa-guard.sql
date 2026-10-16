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
