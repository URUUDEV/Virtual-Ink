-- Portable PostgreSQL 17 business boundary. No provider auth tables or public SDK.
-- Forward-only development migration; no users, reviewers or vendors are seeded.
CREATE ROLE virtual_ink_vendor_service NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
GRANT USAGE ON SCHEMA virtual_ink TO virtual_ink_vendor_service;

CREATE TABLE virtual_ink.vendor_reviewer_grants (
  provider text NOT NULL CHECK(provider='supabase'), issuer text NOT NULL CHECK(length(issuer) BETWEEN 1 AND 256), subject uuid NOT NULL,
  active boolean NOT NULL DEFAULT true, expires_at timestamptz NOT NULL,
  approval_reference uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(provider,issuer,subject), CHECK(expires_at>created_at AND expires_at<=created_at+interval '30 days')
);
CREATE TABLE virtual_ink.vendor_reviewer_grant_audits (
  id uuid PRIMARY KEY, provider text NOT NULL, issuer text NOT NULL, subject uuid NOT NULL,
  action text NOT NULL CHECK(action IN ('granted','revoked')), approval_reference uuid NOT NULL,
  db_actor text NOT NULL DEFAULT session_user, transaction_id bigint NOT NULL DEFAULT txid_current(), occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vendor_reviewer_audits_subject_idx ON virtual_ink.vendor_reviewer_grant_audits(provider,issuer,subject,occurred_at);
CREATE TABLE virtual_ink.vendor_applications (
  id uuid PRIMARY KEY, provider text NOT NULL CHECK(provider='supabase'), issuer text NOT NULL CHECK(length(issuer) BETWEEN 1 AND 256), subject uuid NOT NULL,
  status text NOT NULL CHECK(status IN ('draft','submitted','changes_requested','approved','rejected')), version integer NOT NULL CHECK(version BETWEEN 1 AND 1000000),
  profile jsonb NOT NULL CHECK(jsonb_typeof(profile)='object' AND octet_length(profile::text)<=8192), consent boolean NOT NULL DEFAULT false,
  feedback text NOT NULL DEFAULT '' CHECK(length(feedback)<=500), submitted_at timestamptz, reviewed_at timestamptz,
  tenant_id uuid REFERENCES virtual_ink.tenants(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK((status='approved')=(tenant_id IS NOT NULL)), CHECK(status NOT IN ('submitted','approved') OR consent)
);
CREATE UNIQUE INDEX vendor_applications_one_open_idx ON virtual_ink.vendor_applications(provider,issuer,subject) WHERE status IN ('draft','submitted','changes_requested');
CREATE INDEX vendor_applications_owner_page_idx ON virtual_ink.vendor_applications(provider,issuer,subject,updated_at DESC,id DESC);
CREATE INDEX vendor_applications_review_page_idx ON virtual_ink.vendor_applications(status,updated_at DESC,id DESC);
CREATE INDEX vendor_applications_tenant_idx ON virtual_ink.vendor_applications(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE TABLE virtual_ink.vendor_application_snapshots (
  application_id uuid NOT NULL REFERENCES virtual_ink.vendor_applications(id), version integer NOT NULL,
  profile jsonb NOT NULL CHECK(octet_length(profile::text)<=8192), consent boolean NOT NULL, status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(application_id,version)
);
CREATE TABLE virtual_ink.vendor_onboarding_events (
  id uuid PRIMARY KEY, actor_provider text NOT NULL, actor_issuer text NOT NULL, actor_subject uuid NOT NULL,
  operation_id uuid NOT NULL, application_id uuid REFERENCES virtual_ink.vendor_applications(id),
  action text NOT NULL CHECK(action IN ('application.created','application.saved','application.submitted','application.changes_requested','application.rejected','application.approved','review.viewed','review.listed','availability.changed')),
  from_status text, to_status text, version integer NOT NULL, request_id uuid NOT NULL,
  request_hash text NOT NULL CHECK(request_hash~'^[a-f0-9]{64}$'), result jsonb NOT NULL CHECK(octet_length(result::text)<=2048),
  evidence_reference uuid, verification_checks jsonb, transaction_id bigint NOT NULL DEFAULT txid_current(), occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(actor_provider,actor_issuer,actor_subject,operation_id)
);
CREATE INDEX vendor_events_application_page_idx ON virtual_ink.vendor_onboarding_events(application_id,occurred_at DESC,id DESC);
CREATE INDEX vendor_events_transaction_idx ON virtual_ink.vendor_onboarding_events(transaction_id,application_id,version);
CREATE TABLE virtual_ink.vendor_profiles (
  tenant_id uuid PRIMARY KEY REFERENCES virtual_ink.tenants(id), application_id uuid NOT NULL UNIQUE REFERENCES virtual_ink.vendor_applications(id),
  owner_user_id uuid NOT NULL REFERENCES virtual_ink.users(id), slug text NOT NULL UNIQUE CHECK(slug~'^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 3 AND 60),
  business_name text NOT NULL CHECK(length(business_name) BETWEEN 1 AND 100), summary text NOT NULL CHECK(length(summary) BETWEEN 1 AND 400),
  country text NOT NULL CHECK(length(country) BETWEEN 1 AND 60), city text NOT NULL CHECK(length(city) BETWEEN 1 AND 80),
  handoff text NOT NULL CHECK(handoff IN ('collection','delivery','both')), typical_working_days integer NOT NULL CHECK(typical_working_days BETWEEN 1 AND 90),
  availability text NOT NULL DEFAULT 'paused' CHECK(availability IN ('accepting_enquiries','paused')), approved_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vendor_profiles_owner_idx ON virtual_ink.vendor_profiles(owner_user_id,tenant_id);
CREATE TABLE virtual_ink.vendor_profile_services (
  tenant_id uuid NOT NULL REFERENCES virtual_ink.vendor_profiles(tenant_id), service_code text NOT NULL CHECK(service_code IN ('apparel','paper','signage','design')),
  PRIMARY KEY(tenant_id,service_code)
);
CREATE INDEX vendor_services_discovery_idx ON virtual_ink.vendor_profile_services(service_code,tenant_id);
CREATE TABLE virtual_ink.vendor_notification_outbox (
  id uuid PRIMARY KEY, application_id uuid NOT NULL REFERENCES virtual_ink.vendor_applications(id),
  recipient_provider text NOT NULL, recipient_issuer text NOT NULL, recipient_subject uuid NOT NULL,
  event text NOT NULL CHECK(event IN ('application.submitted','application.changes_requested','application.rejected','application.approved')),
  version integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz,
  UNIQUE(application_id,version,event)
);
CREATE INDEX vendor_outbox_pending_idx ON virtual_ink.vendor_notification_outbox(created_at,id) WHERE published_at IS NULL;
CREATE TABLE virtual_ink.vendor_request_limits (
  provider text NOT NULL, issuer text NOT NULL, subject uuid NOT NULL, window_started_at timestamptz NOT NULL DEFAULT now(), request_count integer NOT NULL CHECK(request_count BETWEEN 1 AND 60),
  PRIMARY KEY(provider,issuer,subject)
);

CREATE FUNCTION virtual_ink.vendor_subject() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog
AS $$ SELECT nullif(current_setting('app.vendor_actor_subject',true),'')::uuid $$;
CREATE FUNCTION virtual_ink.vendor_actor_user() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog
AS $$ SELECT nullif(current_setting('app.vendor_actor_user',true),'')::uuid $$;
CREATE FUNCTION virtual_ink.vendor_target_user() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog
AS $$ SELECT nullif(current_setting('app.vendor_target_user',true),'')::uuid $$;
CREATE FUNCTION virtual_ink.vendor_can_review() RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog
AS $$ SELECT coalesce(current_setting('app.vendor_actor_mfa',true)='true',false) AND EXISTS (
  SELECT FROM virtual_ink.vendor_reviewer_grants g WHERE g.provider=current_setting('app.vendor_actor_provider',true)
    AND g.issuer=current_setting('app.vendor_actor_issuer',true) AND g.subject=(SELECT virtual_ink.vendor_subject()) AND g.active AND g.expires_at>now()) $$;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['vendor_reviewer_grants','vendor_reviewer_grant_audits','vendor_applications','vendor_application_snapshots','vendor_onboarding_events','vendor_profiles','vendor_profile_services','vendor_notification_outbox','vendor_request_limits'] LOOP
    EXECUTE format('ALTER TABLE virtual_ink.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE virtual_ink.%I FORCE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON virtual_ink.%I FROM PUBLIC',t);
  END LOOP;
END $$;
GRANT SELECT ON virtual_ink.vendor_reviewer_grants TO virtual_ink_vendor_service;
CREATE POLICY vendor_reviewer_self ON virtual_ink.vendor_reviewer_grants FOR SELECT TO virtual_ink_vendor_service
USING(provider=(SELECT current_setting('app.vendor_actor_provider',true)) AND issuer=(SELECT current_setting('app.vendor_actor_issuer',true)) AND subject=(SELECT virtual_ink.vendor_subject()));
GRANT SELECT,INSERT,UPDATE ON virtual_ink.vendor_applications,virtual_ink.vendor_request_limits TO virtual_ink_vendor_service;
GRANT SELECT,INSERT ON virtual_ink.vendor_profiles TO virtual_ink_vendor_service;
GRANT UPDATE(availability) ON virtual_ink.vendor_profiles TO virtual_ink_vendor_service;
GRANT SELECT,INSERT ON virtual_ink.vendor_application_snapshots,virtual_ink.vendor_onboarding_events,virtual_ink.vendor_profile_services TO virtual_ink_vendor_service;
GRANT INSERT ON virtual_ink.vendor_notification_outbox TO virtual_ink_vendor_service;
CREATE POLICY vendor_app_scoped ON virtual_ink.vendor_applications TO virtual_ink_vendor_service
USING((provider=(SELECT current_setting('app.vendor_actor_provider',true)) AND issuer=(SELECT current_setting('app.vendor_actor_issuer',true)) AND subject=(SELECT virtual_ink.vendor_subject())) OR (SELECT virtual_ink.vendor_can_review()))
WITH CHECK((provider=(SELECT current_setting('app.vendor_actor_provider',true)) AND issuer=(SELECT current_setting('app.vendor_actor_issuer',true)) AND subject=(SELECT virtual_ink.vendor_subject())) OR (SELECT virtual_ink.vendor_can_review()));
CREATE POLICY vendor_snapshot_scoped ON virtual_ink.vendor_application_snapshots TO virtual_ink_vendor_service
USING(EXISTS(SELECT FROM virtual_ink.vendor_applications a WHERE a.id=application_id)) WITH CHECK(EXISTS(SELECT FROM virtual_ink.vendor_applications a WHERE a.id=application_id));
CREATE POLICY vendor_event_read ON virtual_ink.vendor_onboarding_events FOR SELECT TO virtual_ink_vendor_service
USING((actor_provider=(SELECT current_setting('app.vendor_actor_provider',true)) AND actor_issuer=(SELECT current_setting('app.vendor_actor_issuer',true)) AND actor_subject=(SELECT virtual_ink.vendor_subject())) OR EXISTS(SELECT FROM virtual_ink.vendor_applications a WHERE a.id=application_id));
CREATE POLICY vendor_event_append ON virtual_ink.vendor_onboarding_events FOR INSERT TO virtual_ink_vendor_service
WITH CHECK(actor_provider=(SELECT current_setting('app.vendor_actor_provider',true)) AND actor_issuer=(SELECT current_setting('app.vendor_actor_issuer',true)) AND actor_subject=(SELECT virtual_ink.vendor_subject()) AND transaction_id=txid_current());
CREATE POLICY vendor_profile_scoped ON virtual_ink.vendor_profiles TO virtual_ink_vendor_service
USING(owner_user_id=(SELECT virtual_ink.vendor_actor_user()) OR (SELECT virtual_ink.vendor_can_review()) OR (current_setting('app.vendor_mode',true)='public' AND slug=current_setting('app.vendor_public_slug',true)))
WITH CHECK((SELECT virtual_ink.vendor_can_review()) OR owner_user_id=(SELECT virtual_ink.vendor_actor_user()));
CREATE POLICY vendor_service_scoped ON virtual_ink.vendor_profile_services TO virtual_ink_vendor_service
USING(EXISTS(SELECT FROM virtual_ink.vendor_profiles p WHERE p.tenant_id=vendor_profile_services.tenant_id)) WITH CHECK((SELECT virtual_ink.vendor_can_review()) AND EXISTS(SELECT FROM virtual_ink.vendor_profiles p WHERE p.tenant_id=vendor_profile_services.tenant_id));
CREATE POLICY vendor_outbox_append ON virtual_ink.vendor_notification_outbox FOR INSERT TO virtual_ink_vendor_service
WITH CHECK(EXISTS(SELECT FROM virtual_ink.vendor_applications a WHERE a.id=application_id AND a.provider=recipient_provider AND a.issuer=recipient_issuer AND a.subject=recipient_subject AND a.version=vendor_notification_outbox.version));
CREATE POLICY vendor_rate_self ON virtual_ink.vendor_request_limits TO virtual_ink_vendor_service
USING(provider=current_setting('app.vendor_actor_provider',true) AND issuer=current_setting('app.vendor_actor_issuer',true) AND subject=(SELECT virtual_ink.vendor_subject()))
WITH CHECK(provider=current_setting('app.vendor_actor_provider',true) AND issuer=current_setting('app.vendor_actor_issuer',true) AND subject=(SELECT virtual_ink.vendor_subject()));

-- The bounded service can activate reviewed owners, but has no private CLI membership,
-- role administration, grant mutation, table ownership, DELETE or file/payment rights.
GRANT SELECT,INSERT ON virtual_ink.users,virtual_ink.identities,virtual_ink.user_roles,virtual_ink.tenants,virtual_ink.memberships,virtual_ink.provisioning_audits TO virtual_ink_vendor_service;
CREATE POLICY vendor_identity_target ON virtual_ink.identities TO virtual_ink_vendor_service
USING(provider=current_setting('app.vendor_actor_provider',true) AND issuer=current_setting('app.vendor_actor_issuer',true) AND subject::text IN (current_setting('app.vendor_actor_subject',true),current_setting('app.vendor_target_subject',true)))
WITH CHECK((SELECT virtual_ink.vendor_can_review()) AND active AND provider=current_setting('app.vendor_actor_provider',true) AND issuer=current_setting('app.vendor_actor_issuer',true) AND subject::text=current_setting('app.vendor_target_subject',true) AND user_id=(SELECT virtual_ink.vendor_target_user()));
CREATE POLICY vendor_user_target ON virtual_ink.users TO virtual_ink_vendor_service
USING(id IN ((SELECT virtual_ink.vendor_actor_user()),(SELECT virtual_ink.vendor_target_user()))) WITH CHECK((SELECT virtual_ink.vendor_can_review()) AND active AND id=(SELECT virtual_ink.vendor_target_user()));
CREATE POLICY vendor_role_target ON virtual_ink.user_roles TO virtual_ink_vendor_service
USING(user_id IN ((SELECT virtual_ink.vendor_actor_user()),(SELECT virtual_ink.vendor_target_user()))) WITH CHECK((SELECT virtual_ink.vendor_can_review()) AND active AND role='Customer' AND user_id=(SELECT virtual_ink.vendor_target_user()));
CREATE POLICY vendor_tenant_target ON virtual_ink.tenants TO virtual_ink_vendor_service
USING(id::text=current_setting('app.vendor_target_tenant',true)) WITH CHECK((SELECT virtual_ink.vendor_can_review()) AND active AND kind='vendor' AND id::text=current_setting('app.vendor_target_tenant',true));
CREATE POLICY vendor_membership_target ON virtual_ink.memberships TO virtual_ink_vendor_service
USING(user_id IN ((SELECT virtual_ink.vendor_actor_user()),(SELECT virtual_ink.vendor_target_user())) AND tenant_id::text=current_setting('app.vendor_target_tenant',true))
WITH CHECK((SELECT virtual_ink.vendor_can_review()) AND active AND role='VendorOwner' AND user_id=(SELECT virtual_ink.vendor_target_user()) AND tenant_id::text=current_setting('app.vendor_target_tenant',true));
CREATE POLICY vendor_provisioning_transaction ON virtual_ink.provisioning_audits TO virtual_ink_vendor_service
USING(transaction_id=txid_current() AND db_actor=session_user)
WITH CHECK((SELECT virtual_ink.vendor_can_review()) AND transaction_id=txid_current() AND db_actor=session_user AND user_id=(SELECT virtual_ink.vendor_target_user()) AND action IN ('create_account','create_vendor'));
GRANT EXECUTE ON FUNCTION virtual_ink.require_provisioning_audit() TO virtual_ink_vendor_service;

CREATE FUNCTION virtual_ink.vendor_immutable() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$ BEGIN RAISE EXCEPTION 'Vendor evidence is append-only' USING ERRCODE='23514'; END $$;
CREATE TRIGGER vendor_events_immutable BEFORE UPDATE OR DELETE ON virtual_ink.vendor_onboarding_events FOR EACH ROW EXECUTE FUNCTION virtual_ink.vendor_immutable();
CREATE TRIGGER vendor_snapshots_immutable BEFORE UPDATE OR DELETE ON virtual_ink.vendor_application_snapshots FOR EACH ROW EXECUTE FUNCTION virtual_ink.vendor_immutable();
CREATE TRIGGER vendor_grant_audits_immutable BEFORE UPDATE OR DELETE ON virtual_ink.vendor_reviewer_grant_audits FOR EACH ROW EXECUTE FUNCTION virtual_ink.vendor_immutable();
CREATE FUNCTION virtual_ink.vendor_require_audit() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
  IF TG_TABLE_NAME='vendor_reviewer_grants' THEN
    IF NOT EXISTS(SELECT FROM virtual_ink.vendor_reviewer_grant_audits a WHERE a.transaction_id=txid_current() AND a.db_actor=session_user AND a.provider=NEW.provider AND a.issuer=NEW.issuer AND a.subject=NEW.subject AND a.approval_reference=NEW.approval_reference AND a.action=CASE WHEN NEW.active THEN 'granted' ELSE 'revoked' END) THEN RAISE EXCEPTION 'Reviewer changes require a matching transaction audit' USING ERRCODE='23514'; END IF;
  ELSIF TG_TABLE_NAME='vendor_profiles' THEN
    IF NOT EXISTS(SELECT FROM virtual_ink.vendor_onboarding_events e WHERE e.transaction_id=txid_current() AND e.application_id=NEW.application_id AND ((TG_OP='INSERT' AND e.action='application.approved') OR (TG_OP='UPDATE' AND e.action='availability.changed' AND e.result->>'availability'=NEW.availability))) THEN RAISE EXCEPTION 'Storefront changes require a matching transaction audit' USING ERRCODE='23514'; END IF;
  ELSE
    IF NOT EXISTS(SELECT FROM virtual_ink.vendor_onboarding_events e WHERE e.transaction_id=txid_current() AND e.application_id=NEW.id AND e.version=NEW.version AND e.to_status=NEW.status AND e.action IN ('application.created','application.saved','application.submitted','application.changes_requested','application.rejected','application.approved')) OR
      NOT EXISTS(SELECT FROM virtual_ink.vendor_application_snapshots s WHERE s.application_id=NEW.id AND s.version=NEW.version AND s.profile=NEW.profile AND s.status=NEW.status AND s.consent=NEW.consent) THEN RAISE EXCEPTION 'Application changes require matching transaction evidence' USING ERRCODE='23514'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER vendor_required_audit AFTER INSERT OR UPDATE ON virtual_ink.vendor_applications DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION virtual_ink.vendor_require_audit();
CREATE CONSTRAINT TRIGGER vendor_required_audit AFTER INSERT OR UPDATE ON virtual_ink.vendor_profiles DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION virtual_ink.vendor_require_audit();
CREATE CONSTRAINT TRIGGER vendor_required_audit AFTER INSERT OR UPDATE ON virtual_ink.vendor_reviewer_grants DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION virtual_ink.vendor_require_audit();

CREATE FUNCTION virtual_ink.vendor_profile_valid(p jsonb,complete boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE k text; v text; max_size integer; codes jsonb; required_fields text[]:=ARRAY['businessName','contactName','email','country','city','slug','summary']; fields text[]:=ARRAY['businessName','contactName','email','phone','country','city','slug','summary','registrationNumber','notes','services','handoff','typicalWorkingDays'];
BEGIN
  IF jsonb_typeof(p) IS DISTINCT FROM 'object' OR (SELECT count(*) FROM jsonb_object_keys(p))<>13 OR EXISTS(SELECT FROM jsonb_object_keys(p) x WHERE NOT x=ANY(fields)) THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
  FOREACH k IN ARRAY fields[1:10] LOOP
    max_size:=CASE k WHEN 'businessName' THEN 100 WHEN 'contactName' THEN 80 WHEN 'email' THEN 254 WHEN 'phone' THEN 40 WHEN 'country' THEN 60 WHEN 'city' THEN 80 WHEN 'slug' THEN 60 WHEN 'summary' THEN 400 WHEN 'registrationNumber' THEN 60 ELSE 500 END;
    v:=p->>k;
    IF jsonb_typeof(p->k) IS DISTINCT FROM 'string' OR length(v)>max_size OR v~('[<>[:cntrl:]'||chr(8234)||'-'||chr(8238)||chr(8294)||'-'||chr(8297)||']') OR (complete AND k=ANY(required_fields) AND length(btrim(v))=0) THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
    p:=jsonb_set(p,ARRAY[k],to_jsonb(btrim(v)));
  END LOOP;
  v:=p->>'slug';
  IF (v<>'' OR complete) AND (length(v) NOT BETWEEN 3 AND 60 OR v!~'^[a-z0-9]+(-[a-z0-9]+)*$' OR v=ANY(ARRAY['join','prepare','onboarding','account','register','admin','signin','login','store'])) THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
  IF complete AND p->>'email'!~'^[^[:space:]@]+@[^[:space:]@.]+(\.[^[:space:]@.]+)+$' THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
  codes:=p->'services';
  IF jsonb_typeof(codes) IS DISTINCT FROM 'array' OR jsonb_array_length(codes)>4 OR (complete AND jsonb_array_length(codes)=0) OR EXISTS(SELECT FROM jsonb_array_elements(codes) x WHERE jsonb_typeof(x)<>'string' OR x#>>'{}' NOT IN ('apparel','paper','signage','design')) OR (SELECT count(DISTINCT x) FROM jsonb_array_elements(codes) x)<>jsonb_array_length(codes) THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
  IF jsonb_typeof(p->'handoff') IS DISTINCT FROM 'string' OR p->>'handoff' NOT IN ('','collection','delivery','both') OR (complete AND p->>'handoff'='') THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
  IF (p->'typicalWorkingDays'<>'null'::jsonb OR complete) AND (jsonb_typeof(p->'typicalWorkingDays') IS DISTINCT FROM 'number' OR p->>'typicalWorkingDays'!~'^[1-9][0-9]?$' OR (p->>'typicalWorkingDays')::integer>90) THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF;
  RETURN p;
END $$;

CREATE FUNCTION virtual_ink.vendor_storefront_data(p virtual_ink.vendor_profiles) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
SELECT jsonb_build_object('tenantId',p.tenant_id,'businessName',p.business_name,'slug',p.slug,'summary',p.summary,'country',p.country,'city',p.city,'handoff',p.handoff,'typicalWorkingDays',p.typical_working_days,'availability',p.availability,'approvedAt',p.approved_at,'services',coalesce((SELECT jsonb_agg(s.service_code ORDER BY s.service_code) FROM virtual_ink.vendor_profile_services s WHERE s.tenant_id=p.tenant_id),'[]'::jsonb)) $$;
CREATE FUNCTION virtual_ink.vendor_summary(a virtual_ink.vendor_applications) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
SELECT jsonb_build_object('id',a.id,'status',a.status,'version',a.version,'businessName',a.profile->>'businessName','slug',a.profile->>'slug','updatedAt',a.updated_at,'submittedAt',a.submitted_at,'tenantId',a.tenant_id) $$;

-- Only the service role executes business helpers; clients use a separately reviewed provider adapter.
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='virtual_ink'::regnamespace AND proname LIKE 'vendor_%' LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',p.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO virtual_ink_vendor_service',p.signature);
  END LOOP;
END $$;

-- Business state machine. Called only by trusted, verified provider/HTTP adapters.
CREATE FUNCTION virtual_ink.vendor_payload(p jsonb,allowed text[]) RETURNS void LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN IF jsonb_typeof(p) IS DISTINCT FROM 'object' OR octet_length(p::text)>16384 OR EXISTS(SELECT FROM jsonb_object_keys(p) k WHERE NOT k=ANY(allowed||ARRAY['requestId'])) THEN RAISE EXCEPTION 'VENDOR_VALIDATION_FAILED'; END IF; END $$;
CREATE FUNCTION virtual_ink.vendor_live_profile(p virtual_ink.vendor_profiles) RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
  PERFORM set_config('app.vendor_target_user',p.owner_user_id::text,true),set_config('app.vendor_target_tenant',p.tenant_id::text,true);
  RETURN EXISTS(SELECT FROM virtual_ink.tenants t WHERE t.id=p.tenant_id AND t.active) AND
    EXISTS(SELECT FROM virtual_ink.users u WHERE u.id=p.owner_user_id AND u.active) AND
    EXISTS(SELECT FROM virtual_ink.memberships m WHERE m.tenant_id=p.tenant_id AND m.user_id=p.owner_user_id AND m.role='VendorOwner' AND m.active) AND
    EXISTS(SELECT FROM virtual_ink.user_roles r WHERE r.user_id=p.owner_user_id AND r.role='Customer' AND r.active) AND
    NOT EXISTS(SELECT FROM virtual_ink.user_roles r WHERE r.user_id=p.owner_user_id AND r.role='DeliveryPartner' AND r.active);
END $$;
CREATE POLICY vendor_public_application_check ON virtual_ink.vendor_applications FOR SELECT TO virtual_ink_vendor_service
USING(current_setting('app.vendor_mode',true)='public' AND status='approved' AND tenant_id::text=current_setting('app.vendor_target_tenant',true));

CREATE FUNCTION virtual_ink.vendor_onboarding_command(command text,p jsonb) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $$
#variable_conflict use_variable
DECLARE actor_provider text:=current_setting('app.vendor_actor_provider',true); actor_issuer text:=current_setting('app.vendor_actor_issuer',true); actor_subject uuid:=virtual_ink.vendor_subject();
  actor_user uuid; owner_user uuid; target_tenant uuid; app_id uuid; operation uuid; request_id uuid; fingerprint text; existing virtual_ink.vendor_onboarding_events;
  a virtual_ink.vendor_applications; storefront virtual_ink.vendor_profiles; identity_row virtual_ink.identities; person virtual_ink.users;
  new_profile jsonb; result jsonb; items jsonb:='[]'::jsonb; detail jsonb; event_id uuid:=gen_random_uuid(); event_action text; previous_status text;
  next_status text; next_version integer; expected integer; total integer; page_limit integer; seen integer:=0; last_time timestamptz; last_id uuid;
  cursor_data jsonb; next_cursor text; status_filter text; candidate record; rate_written integer; review_granted boolean; decision text; checks jsonb; feedback text; evidence uuid; service text;
BEGIN
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
