-- Explicit Free-plan application compensation. Native-hook policy stays default.
-- These are APPLICATION verification receipts, never simulated provider-hook receipts.
ALTER TABLE virtual_ink_security.configuration ADD COLUMN mfa_policy text NOT NULL DEFAULT 'provider_hook'
 CHECK(mfa_policy IN('provider_hook','application_receipt'));

CREATE TABLE virtual_ink_security.application_mfa_receipts (
 subject uuid NOT NULL, session_id uuid NOT NULL, factor_id uuid NOT NULL,
 mfa_at bigint NOT NULL CHECK(mfa_at>=0), primary_at bigint NOT NULL CHECK(primary_at>=0),
 correlation_id uuid NOT NULL UNIQUE, audit_id uuid NOT NULL UNIQUE REFERENCES virtual_ink_security.events(id),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(subject,session_id,mfa_at)
);
CREATE INDEX application_mfa_factor_latest ON virtual_ink_security.application_mfa_receipts(subject,factor_id,recorded_at DESC,audit_id DESC);
ALTER TABLE virtual_ink_security.application_mfa_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_ink_security.application_mfa_receipts FORCE ROW LEVEL SECURITY;
REVOKE ALL ON virtual_ink_security.application_mfa_receipts FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role','supabase_auth_admin','virtual_ink_api','virtual_ink_provisioner','virtual_ink_vendor_service','virtual_ink_security_service'] LOOP
  IF EXISTS(SELECT FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('REVOKE ALL ON virtual_ink_security.application_mfa_receipts FROM %I',r);
  END IF;
 END LOOP;
END $$;
CREATE POLICY security_owner ON virtual_ink_security.application_mfa_receipts
 TO virtual_ink_security_owner USING(true) WITH CHECK(true);
GRANT SELECT,INSERT ON virtual_ink_security.application_mfa_receipts TO virtual_ink_security_owner;
CREATE TRIGGER immutable_application_mfa_receipts BEFORE UPDATE OR DELETE ON virtual_ink_security.application_mfa_receipts
 FOR EACH ROW EXECUTE FUNCTION virtual_ink_phase1.immutable_audit();
CREATE TRIGGER immutable_application_mfa_receipts_truncate BEFORE TRUNCATE ON virtual_ink_security.application_mfa_receipts
 FOR EACH STATEMENT EXECUTE FUNCTION virtual_ink_phase1.immutable_audit();

-- Provider-owned RLS remains intact. Only the existing private broker owner has
-- native table access; the runtime can call neither this helper nor Auth tables.
CREATE FUNCTION virtual_ink_security.provider_session_facts(p_subject uuid,p_session uuid,p_mfa bigint,p_primary bigint,
 p_strong boolean,p_recent boolean,p_factor uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE live record; mfa_time bigint; primary_time bigint; now_second bigint;
BEGIN
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
  IF live.aal<>'aal2' OR p_mfa IS NULL OR p_factor IS NOT NULL AND live.factor_id IS DISTINCT FROM p_factor THEN RETURN false; END IF;
  SELECT floor(extract(epoch FROM a.updated_at))::bigint INTO mfa_time FROM auth.mfa_amr_claims a
   JOIN auth.mfa_factors f ON f.id=live.factor_id AND f.user_id=p_subject AND f.factor_type::text='totp'
    AND f.status::text='verified' AND f.created_at<=a.updated_at
   WHERE a.session_id=p_session AND a.authentication_method='totp';
  IF mfa_time IS DISTINCT FROM p_mfa OR mfa_time>now_second OR mfa_time<=now_second-300 THEN RETURN false; END IF;
 END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION virtual_ink_security.provider_session_facts(uuid,uuid,bigint,bigint,boolean,boolean,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION virtual_ink_security.provider_session_facts(uuid,uuid,bigint,bigint,boolean,boolean,uuid) TO virtual_ink_security_owner;

CREATE OR REPLACE FUNCTION virtual_ink_security.provider_session(p_subject uuid,p_session uuid,p_mfa bigint,p_primary bigint,p_strong boolean,p_recent boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE cfg record; factor uuid;
BEGIN
 IF NOT virtual_ink_security.provider_session_facts(p_subject,p_session,p_mfa,p_primary,p_strong,p_recent,NULL) THEN RETURN false; END IF;
 IF NOT p_strong THEN RETURN true; END IF;
 SELECT * INTO cfg FROM virtual_ink_security.configuration WHERE singleton;
 IF NOT cfg.enabled OR cfg.environment NOT IN('local','preview') THEN RETURN false; END IF;
 SELECT factor_id INTO factor FROM auth.sessions WHERE id=p_session AND user_id=p_subject;
 IF cfg.mfa_policy='provider_hook' THEN
  -- Preserve the existing native-hook requirement exactly for the default policy.
  RETURN EXISTS(SELECT FROM virtual_ink_auth_guard.settings g
   JOIN virtual_ink_auth_guard.factor_state f ON f.user_id=p_subject AND f.factor_id=factor
   WHERE g.singleton AND g.enabled AND g.environment=cfg.environment
    AND floor(extract(epoch FROM f.last_accepted_at))::bigint BETWEEN p_mfa-10 AND p_mfa);
 ELSIF cfg.mfa_policy='application_receipt' THEN
  -- A provider-direct AAL2 token, JWT claim or signed cookie alone is insufficient.
  -- A later successful application verification supersedes this factor's older receipts.
  RETURN EXISTS(SELECT FROM virtual_ink_security.application_mfa_receipts r
   JOIN virtual_ink_security.events e ON e.id=r.audit_id
   WHERE r.subject=p_subject AND r.session_id=p_session AND r.factor_id=factor
    AND r.mfa_at=p_mfa AND r.primary_at=p_primary
    AND e.subject=p_subject AND e.session_id=p_session AND e.correlation_id=r.correlation_id
    AND e.action='mfa.verify' AND e.outcome='success' AND e.assurance='aal2' AND e.source='web-admin'
    AND e.metadata->>'factorId'=factor::text
    AND NOT EXISTS(SELECT FROM virtual_ink_security.application_mfa_receipts newer
     WHERE newer.subject=p_subject AND newer.factor_id=factor
      AND (newer.recorded_at,newer.audit_id)>(r.recorded_at,r.audit_id)));
 END IF;
 RETURN false;
END $$;
REVOKE ALL ON FUNCTION virtual_ink_security.provider_session(uuid,uuid,bigint,bigint,boolean,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION virtual_ink_security.provider_session(uuid,uuid,bigint,bigint,boolean,boolean) TO virtual_ink_security_owner;

GRANT virtual_ink_security_owner TO CURRENT_USER WITH INHERIT TRUE, SET TRUE;
GRANT CREATE ON SCHEMA virtual_ink_security TO virtual_ink_security_owner;
SET ROLE virtual_ink_security_owner;
ALTER FUNCTION virtual_ink_security.command(text,jsonb,jsonb) RENAME TO command_native_policy;
REVOKE ALL ON FUNCTION virtual_ink_security.command_native_policy(text,jsonb,jsonb) FROM PUBLIC,virtual_ink_security_service;
CREATE FUNCTION virtual_ink_security.command(p_action text,p_input jsonb,p_context jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE result jsonb; principal uuid; sid uuid; factor uuid; mfa bigint; primary_time bigint; cid uuid; aid uuid;
BEGIN
 -- Existing role checks, durable budgets, HMAC replay reservations, recovery,
 -- alerts, immutable events and every business decision remain in the original.
 result:=virtual_ink_security.command_native_policy(p_action,p_input,p_context);
 IF result->>'ok'='true' AND p_action='mfa.result' AND p_input->>'kind'='verify' AND p_input->>'outcome'='success'
  AND EXISTS(SELECT FROM virtual_ink_security.configuration WHERE singleton AND mfa_policy='application_receipt') THEN
  principal:=(p_context->>'subject')::uuid;sid:=(p_context->>'sessionId')::uuid;
  factor:=(p_input->>'factorId')::uuid;mfa:=(p_context->>'mfaAt')::bigint;primary_time:=(p_context->>'primaryAt')::bigint;
  cid:=(p_context->>'correlationId')::uuid;aid:=(result->>'auditId')::uuid;
  IF factor IS NULL OR mfa IS NULL OR primary_time IS NULL
   OR NOT virtual_ink_security.provider_session_facts(principal,sid,mfa,primary_time,true,false,factor)
   OR NOT EXISTS(SELECT FROM virtual_ink_security.events e
    WHERE e.subject=principal AND e.correlation_id=cid AND e.action='mfa.verify' AND e.outcome='attempt'
     AND e.source='web-admin' AND e.metadata->>'factorId'=factor::text
     AND mfa BETWEEN floor(extract(epoch FROM e.occurred_at))::bigint AND floor(extract(epoch FROM e.occurred_at))::bigint+10) THEN
   -- The query fails closed, rolling back its success audit too. The earlier
   -- separately committed reservation remains for private reconciliation.
   RAISE EXCEPTION 'MFA application receipt could not be committed' USING ERRCODE='28000';
  END IF;
  INSERT INTO virtual_ink_security.application_mfa_receipts(subject,session_id,factor_id,mfa_at,primary_at,correlation_id,audit_id)
   VALUES(principal,sid,factor,mfa,primary_time,cid,aid);
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION virtual_ink_security.command(text,jsonb,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION virtual_ink_security.command(text,jsonb,jsonb) TO virtual_ink_security_service;
RESET ROLE;
REVOKE CREATE ON SCHEMA virtual_ink_security FROM virtual_ink_security_owner;

-- Migration-owner default grants must not expose new helpers or the renamed
-- implementation, even if the provider changes its public-schema defaults.
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role','supabase_auth_admin','virtual_ink_api','virtual_ink_provisioner','virtual_ink_vendor_service','virtual_ink_security_service'] LOOP
  IF EXISTS(SELECT FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('REVOKE ALL ON FUNCTION virtual_ink_security.provider_session_facts(uuid,uuid,bigint,bigint,boolean,boolean,uuid),virtual_ink_security.provider_session(uuid,uuid,bigint,bigint,boolean,boolean),virtual_ink_security.command_native_policy(text,jsonb,jsonb) FROM %I',r);
   IF r<>'virtual_ink_security_service' THEN
    EXECUTE format('REVOKE ALL ON FUNCTION virtual_ink_security.command(text,jsonb,jsonb) FROM %I',r);
   END IF;
  END IF;
 END LOOP;
END $$;
REVOKE virtual_ink_security_owner FROM CURRENT_USER;
