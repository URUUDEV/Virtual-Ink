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
