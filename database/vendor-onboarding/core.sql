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
