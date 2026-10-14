-- Supabase-only adapter. Business tables/functions stay portable in core/commands.sql.
-- Public forwarding is SECURITY INVOKER; the narrow definer lives in a private schema,
-- runs as a NOLOGIN/NOBYPASSRLS non-owner, and accepts no caller-owned identity/role.
CREATE SCHEMA virtual_ink_auth_bridge;
CREATE ROLE virtual_ink_vendor_gateway_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
GRANT virtual_ink_vendor_service TO virtual_ink_vendor_gateway_owner WITH INHERIT TRUE, SET FALSE;
REVOKE ALL ON SCHEMA virtual_ink_auth_bridge FROM PUBLIC;
GRANT USAGE ON SCHEMA virtual_ink_auth_bridge TO anon,authenticated,virtual_ink_vendor_service,virtual_ink_vendor_gateway_owner;
GRANT USAGE ON SCHEMA auth TO virtual_ink_vendor_service;
GRANT SELECT(id,is_anonymous,email_confirmed_at,banned_until,deleted_at) ON auth.users TO virtual_ink_vendor_service;
GRANT SELECT(id,user_id,not_after,aal,factor_id) ON auth.sessions TO virtual_ink_vendor_service;
GRANT SELECT(id,user_id,status,factor_type) ON auth.mfa_factors TO virtual_ink_vendor_service;

CREATE FUNCTION virtual_ink_auth_bridge.vendor_gateway(p_action text,p_payload jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE claims jsonb; principal uuid; session_id uuid; live_session record; mfa_time bigint; fresh_mfa boolean:=false; context_name text; target_subject uuid;
  issuer constant text:='https://odgxcuwueessxfsoveza.supabase.co/auth/v1';
BEGIN
  FOREACH context_name IN ARRAY ARRAY['actor_provider','actor_issuer','actor_subject','actor_user','target_user','target_subject','target_tenant','public_slug','mode','actor_verified','actor_mfa'] LOOP PERFORM set_config('app.vendor_'||context_name,'',true); END LOOP;
  IF p_action='storefront.get' THEN RETURN virtual_ink.vendor_onboarding_command(p_action,p_payload); END IF;
  claims:=auth.jwt(); principal:=auth.uid();
  IF principal IS NULL OR claims->>'iss' IS DISTINCT FROM issuer OR claims->>'role' IS DISTINCT FROM 'authenticated' OR claims->>'session_id' IS NULL OR claims->>'exp' IS NULL OR claims->>'exp'!~'^[0-9]{1,12}$' OR (claims->>'exp')::bigint<=extract(epoch FROM clock_timestamp()) OR NOT coalesce((claims->>'aud'='authenticated' OR claims->'aud'@>'["authenticated"]'::jsonb),false) THEN RAISE EXCEPTION 'VENDOR_UNAUTHENTICATED'; END IF;
  session_id:=(claims->>'session_id')::uuid;
  SELECT s.id,s.aal,s.factor_id INTO live_session FROM auth.sessions s JOIN auth.users u ON u.id=s.user_id
    WHERE s.id=session_id AND s.user_id=principal AND (s.not_after IS NULL OR s.not_after>clock_timestamp()) AND NOT u.is_anonymous AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=clock_timestamp());
  IF NOT FOUND THEN RAISE EXCEPTION 'VENDOR_UNAUTHENTICATED'; END IF;
  IF claims->>'aal'='aal2' AND live_session.aal::text='aal2' AND jsonb_typeof(claims->'amr')='array' AND
    EXISTS(SELECT FROM auth.mfa_factors f WHERE f.id=live_session.factor_id AND f.user_id=principal AND f.status::text='verified' AND f.factor_type::text='totp') THEN
    SELECT max(CASE WHEN e->>'timestamp'~'^[0-9]{1,12}$' THEN (e->>'timestamp')::bigint END) INTO mfa_time FROM jsonb_array_elements(claims->'amr') e WHERE e->>'method'='totp';
    fresh_mfa:=mfa_time BETWEEN extract(epoch FROM clock_timestamp())-900 AND extract(epoch FROM clock_timestamp())+30;
  END IF;
  PERFORM set_config('app.vendor_actor_provider','supabase',true),set_config('app.vendor_actor_issuer',issuer,true),set_config('app.vendor_actor_subject',principal::text,true),set_config('app.vendor_actor_verified','true',true),set_config('app.vendor_actor_mfa',coalesce(fresh_mfa,false)::text,true);
  -- Approval rechecks the target's provider account too; a banned/deleted/unverified
  -- applicant cannot be activated while an older submission is waiting for review.
  IF p_action='admin.decide' AND p_payload->>'decision'='approve' THEN
    SELECT a.subject INTO target_subject FROM virtual_ink.vendor_applications a WHERE a.id=(p_payload->>'applicationId')::uuid;
    IF target_subject IS NOT NULL AND NOT EXISTS(SELECT FROM auth.users u WHERE u.id=target_subject AND NOT u.is_anonymous AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=clock_timestamp())) THEN RAISE EXCEPTION 'VENDOR_FORBIDDEN'; END IF;
  END IF;
  RETURN virtual_ink.vendor_onboarding_command(p_action,p_payload);
EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN RAISE EXCEPTION 'VENDOR_UNAUTHENTICATED';
END $$;
REVOKE ALL ON FUNCTION virtual_ink_auth_bridge.vendor_gateway(text,jsonb) FROM PUBLIC;
-- Ownership transfer needs a temporary DDL membership and CREATE, never a runtime grant.
GRANT virtual_ink_vendor_gateway_owner TO CURRENT_USER;
GRANT CREATE ON SCHEMA virtual_ink_auth_bridge TO virtual_ink_vendor_gateway_owner;
ALTER FUNCTION virtual_ink_auth_bridge.vendor_gateway(text,jsonb) OWNER TO virtual_ink_vendor_gateway_owner;
REVOKE CREATE ON SCHEMA virtual_ink_auth_bridge FROM virtual_ink_vendor_gateway_owner;
REVOKE virtual_ink_vendor_gateway_owner FROM CURRENT_USER;
GRANT EXECUTE ON FUNCTION virtual_ink_auth_bridge.vendor_gateway(text,jsonb) TO anon,authenticated;

CREATE FUNCTION public.virtual_ink_vendor_onboarding(p_action text,p_payload jsonb) RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path=pg_catalog
AS $$ SELECT virtual_ink_auth_bridge.vendor_gateway(p_action,p_payload) $$;
REVOKE ALL ON FUNCTION public.virtual_ink_vendor_onboarding(text,jsonb) FROM PUBLIC,service_role;
GRANT EXECUTE ON FUNCTION public.virtual_ink_vendor_onboarding(text,jsonb) TO anon,authenticated;
NOTIFY pgrst,'reload schema';
