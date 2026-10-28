-- Forward-only commercial foundation. No approved policy, login or vendor is seeded.
ALTER TABLE virtual_ink_workflow.configuration ADD COLUMN commercial_enabled boolean NOT NULL DEFAULT false;
CREATE TABLE virtual_ink_workflow.commission_policies(
 id uuid PRIMARY KEY,version integer NOT NULL UNIQUE CHECK(version>0),basis_points integer NOT NULL CHECK(basis_points BETWEEN 1 AND 10000),
 terms text NOT NULL CHECK(length(terms) BETWEEN 20 AND 10000),
 terms_sha256 text NOT NULL CHECK(terms_sha256=encode(sha256(convert_to(terms,'UTF8')),'hex')),
 collection text NOT NULL CHECK(collection='direct_to_vendor'),settlement text NOT NULL CHECK(settlement='weekly'),
 approved boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT clock_timestamp());
ALTER TABLE virtual_ink_workflow.configuration ADD COLUMN commercial_policy_id uuid REFERENCES virtual_ink_workflow.commission_policies(id);
CREATE TABLE virtual_ink_workflow.vendor_agreements(
 vendor_id uuid NOT NULL REFERENCES virtual_ink.vendor_profiles(tenant_id),policy_id uuid NOT NULL REFERENCES virtual_ink_workflow.commission_policies(id),
 actor_id uuid NOT NULL REFERENCES virtual_ink.users(id),session_id uuid NOT NULL,accepted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(vendor_id,policy_id));
CREATE TABLE virtual_ink_workflow.price_headers(id uuid PRIMARY KEY,vendor_id uuid NOT NULL REFERENCES virtual_ink.vendor_profiles(tenant_id));
CREATE INDEX commercial_prices_vendor_idx ON virtual_ink_workflow.price_headers(vendor_id,id);
CREATE TABLE virtual_ink_workflow.price_versions(
 price_id uuid NOT NULL REFERENCES virtual_ink_workflow.price_headers(id),version integer NOT NULL CHECK(version BETWEEN 1 AND 1000000),
 service text NOT NULL CHECK(service IN('printing','design')),label text NOT NULL CHECK(length(label) BETWEEN 1 AND 120 AND label=btrim(label) AND label !~ '[<>[:cntrl:]]'),
 unit text NOT NULL CHECK(unit IN('page','copy','item','job','hour')),amount_minor bigint NOT NULL CHECK(amount_minor BETWEEN 1 AND 1000000000),
 currency text NOT NULL CHECK(currency='ZMW'),active boolean NOT NULL,actor_id uuid NOT NULL REFERENCES virtual_ink.users(id),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(price_id,version));
CREATE TABLE virtual_ink_workflow.quote_commercial_terms(
 quote_id uuid PRIMARY KEY REFERENCES virtual_ink_workflow.quotes(id),vendor_id uuid NOT NULL REFERENCES virtual_ink.vendor_profiles(tenant_id),
 policy_id uuid NOT NULL REFERENCES virtual_ink_workflow.commission_policies(id),amount_minor bigint NOT NULL CHECK(amount_minor BETWEEN 1 AND 1000000000),
 commission_minor bigint NOT NULL CHECK(commission_minor BETWEEN 0 AND amount_minor),currency text NOT NULL CHECK(currency='ZMW'),created_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE INDEX commercial_quote_vendor_idx ON virtual_ink_workflow.quote_commercial_terms(vendor_id,quote_id);
CREATE TABLE virtual_ink_workflow.commission_accruals(
 order_id uuid PRIMARY KEY REFERENCES virtual_ink_workflow.orders(id),quote_id uuid NOT NULL UNIQUE REFERENCES virtual_ink_workflow.quote_commercial_terms(quote_id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE TABLE virtual_ink_workflow.commercial_events(
 id uuid PRIMARY KEY,actor_id uuid REFERENCES virtual_ink.users(id),session_id uuid,vendor_id uuid,operation_id uuid NOT NULL,request_id uuid NOT NULL,
 action text NOT NULL CHECK(action IN('read','agreement.accept','price.save','price.retire')),fingerprint text NOT NULL,
 outcome text NOT NULL CHECK(outcome IN('success','failure')),result jsonb NOT NULL CHECK(octet_length(result::text)<=8192),
 transaction_id bigint NOT NULL DEFAULT txid_current(),occurred_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE UNIQUE INDEX commercial_operation_once_idx ON virtual_ink_workflow.commercial_events(actor_id,operation_id) WHERE outcome='success' AND action<>'read';
CREATE INDEX commercial_events_vendor_idx ON virtual_ink_workflow.commercial_events(vendor_id,occurred_at,id);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['commission_policies','vendor_agreements','price_headers','price_versions','quote_commercial_terms','commission_accruals','commercial_events'] LOOP
  EXECUTE format('REVOKE ALL ON virtual_ink_workflow.%I FROM PUBLIC,anon,authenticated,service_role',t);
  EXECUTE format('ALTER TABLE virtual_ink_workflow.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE virtual_ink_workflow.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY command_owner ON virtual_ink_workflow.%I TO virtual_ink_workflow_owner USING(true) WITH CHECK(true)',t);
  EXECUTE format('GRANT SELECT ON virtual_ink_workflow.%I TO virtual_ink_workflow_owner',t);
  EXECUTE format('CREATE TRIGGER immutable_history BEFORE UPDATE OR DELETE ON virtual_ink_workflow.%I FOR EACH ROW EXECUTE FUNCTION virtual_ink_workflow.immutable()',t);
  EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON virtual_ink_workflow.%I FOR EACH STATEMENT EXECUTE FUNCTION virtual_ink_workflow.immutable()',t);
 END LOOP;
END $$;
GRANT INSERT ON virtual_ink_workflow.vendor_agreements,virtual_ink_workflow.price_headers,virtual_ink_workflow.price_versions,
 virtual_ink_workflow.quote_commercial_terms,virtual_ink_workflow.commission_accruals,virtual_ink_workflow.commercial_events TO virtual_ink_workflow_owner;
GRANT virtual_ink_workflow_owner TO CURRENT_USER WITH INHERIT TRUE, SET TRUE;
GRANT CREATE ON SCHEMA virtual_ink_workflow TO virtual_ink_workflow_owner;
SET ROLE virtual_ink_workflow_owner;

CREATE FUNCTION virtual_ink_workflow.snapshot_commercial_quote() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE settings virtual_ink_workflow.configuration%ROWTYPE;policy virtual_ink_workflow.commission_policies%ROWTYPE;vendor uuid;
BEGIN
 SELECT * INTO settings FROM virtual_ink_workflow.configuration WHERE singleton;
 IF NOT settings.commercial_enabled THEN RETURN NEW; END IF;
 SELECT * INTO policy FROM virtual_ink_workflow.commission_policies WHERE id=settings.commercial_policy_id AND approved;
 SELECT vendor_id INTO vendor FROM virtual_ink_workflow.orders WHERE id=NEW.order_id;
 IF policy.id IS NULL OR NOT EXISTS(SELECT FROM virtual_ink_workflow.vendor_agreements a JOIN virtual_ink.vendor_profiles v ON v.tenant_id=a.vendor_id AND v.owner_user_id=a.actor_id WHERE a.vendor_id=vendor AND a.policy_id=policy.id) THEN RAISE EXCEPTION 'CONFLICT'; END IF;
 INSERT INTO virtual_ink_workflow.quote_commercial_terms(quote_id,vendor_id,policy_id,amount_minor,commission_minor,currency)
 VALUES(NEW.id,vendor,policy.id,NEW.amount_minor,(NEW.amount_minor*policy.basis_points+5000)/10000,NEW.currency);
 RETURN NEW;
END $$;
CREATE FUNCTION virtual_ink_workflow.accrue_completed_commission() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.state='COMPLETED' AND OLD.state<>'COMPLETED' THEN
  IF EXISTS(SELECT FROM virtual_ink_workflow.quote_commercial_terms WHERE quote_id=NEW.accepted_quote_id) THEN
   INSERT INTO virtual_ink_workflow.commission_accruals(order_id,quote_id) VALUES(NEW.id,NEW.accepted_quote_id);
  ELSIF EXISTS(SELECT FROM virtual_ink_workflow.configuration WHERE singleton AND commercial_enabled) THEN RAISE EXCEPTION 'CONFLICT'; END IF;
 END IF;
 RETURN NEW;
END $$;

CREATE FUNCTION virtual_ink_workflow.commercial_command(p_action text,p_input jsonb,p_context jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE cfg record;settings virtual_ink_workflow.configuration%ROWTYPE;policy virtual_ink_workflow.commission_policies%ROWTYPE;
 principal uuid;sid uuid;actor uuid;actor_role text;vendor uuid;op uuid;cid uuid;aid uuid:=gen_random_uuid();mfa bigint;primary_time bigint;
 high boolean;allowed text[];fingerprint text;failure text;result jsonb;receipt record;previous virtual_ink_workflow.price_versions%ROWTYPE;
 price uuid;expected integer;counter integer;scopes jsonb;prices jsonb;accepted boolean;
BEGIN
 BEGIN
  IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION 'CONFLICT'; END IF;
  IF p_action NOT IN('read','agreement.accept','price.save','price.retire') OR p_action IS NULL OR jsonb_typeof(p_input) IS DISTINCT FROM 'object' OR octet_length(p_input::text)>8192 THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
  principal:=(p_context->>'subject')::uuid;sid:=(p_context->>'sessionId')::uuid;cid:=(p_context->>'correlationId')::uuid;
  vendor:=(p_input->>'vendorId')::uuid;op:=(p_input->>'operationId')::uuid;
  IF principal IS NULL OR sid IS NULL OR cid IS NULL OR op IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  PERFORM pg_advisory_xact_lock(74016,1);
  SELECT * INTO cfg FROM virtual_ink_security.configuration WHERE singleton;
  SELECT * INTO settings FROM virtual_ink_workflow.configuration WHERE singleton;
  IF NOT coalesce(cfg.enabled,false) OR cfg.environment IS DISTINCT FROM p_context->>'environment' OR cfg.issuer IS DISTINCT FROM p_context->>'issuer'
   OR NOT coalesce(settings.enabled AND settings.commercial_enabled,false) THEN RAISE EXCEPTION 'IDENTITY_UNAVAILABLE'; END IF;
  high:=p_action<>'read';mfa:=(p_context->>'mfaAt')::bigint;primary_time:=(p_context->>'primaryAt')::bigint;
  IF high AND (p_context->>'aal' IS DISTINCT FROM 'aal2' OR mfa IS NULL OR (p_context->>'stepUpAt')::bigint IS DISTINCT FROM mfa) THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF NOT virtual_ink_security.provider_session(principal,sid,mfa,primary_time,high,high) THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  SELECT i.user_id INTO actor FROM virtual_ink.identities i JOIN virtual_ink.users u ON u.id=i.user_id WHERE i.provider='supabase' AND i.issuer=cfg.issuer AND i.subject=principal AND i.active AND u.active;
  SELECT role INTO actor_role FROM virtual_ink_phase1.role_assignments WHERE user_id=actor AND active AND (expires_at IS NULL OR expires_at>clock_timestamp());
  IF actor_role IS DISTINCT FROM 'VENDOR' THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  INSERT INTO virtual_ink_workflow.limits VALUES(actor,clock_timestamp(),1) ON CONFLICT(actor_id) DO UPDATE
   SET attempts=CASE WHEN virtual_ink_workflow.limits.window_at<=clock_timestamp()-interval '5 minutes' THEN 1 ELSE virtual_ink_workflow.limits.attempts+1 END,
   window_at=CASE WHEN virtual_ink_workflow.limits.window_at<=clock_timestamp()-interval '5 minutes' THEN clock_timestamp() ELSE virtual_ink_workflow.limits.window_at END RETURNING attempts INTO counter;
  IF counter>120 THEN RAISE EXCEPTION 'RATE_LIMITED'; END IF;
  BEGIN
   allowed:=CASE p_action WHEN 'read' THEN ARRAY[]::text[] WHEN 'agreement.accept' THEN ARRAY['policyId','termsSha256','consent'] WHEN 'price.save' THEN ARRAY['priceId','expectedVersion','service','label','unit','amountMinor','currency'] ELSE ARRAY['priceId','expectedVersion'] END;
   IF EXISTS(SELECT FROM jsonb_object_keys(p_input) k WHERE NOT k=ANY(allowed||ARRAY['vendorId','operationId'])) THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
   IF p_action<>'read' AND vendor IS NULL OR vendor IS NOT NULL AND NOT EXISTS(SELECT FROM virtual_ink.vendor_profiles v JOIN virtual_ink.tenants t ON t.id=v.tenant_id
    JOIN virtual_ink.memberships m ON m.tenant_id=v.tenant_id WHERE v.tenant_id=vendor AND v.owner_user_id=actor AND m.user_id=actor AND m.active AND t.active) THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
   fingerprint:=encode(sha256(convert_to(p_action||p_input::text,'UTF8')),'hex');
   SELECT * INTO policy FROM virtual_ink_workflow.commission_policies WHERE id=settings.commercial_policy_id AND approved;
   accepted:=policy.id IS NOT NULL AND EXISTS(SELECT FROM virtual_ink_workflow.vendor_agreements WHERE vendor_id=vendor AND policy_id=policy.id AND actor_id=actor);
   IF p_action<>'read' THEN
    IF policy.id IS NULL THEN RAISE EXCEPTION 'CONFLICT'; END IF;
    IF p_action='agreement.accept' AND (p_input->'consent' IS DISTINCT FROM 'true'::jsonb OR p_input->>'policyId' IS DISTINCT FROM policy.id::text OR p_input->>'termsSha256' IS DISTINCT FROM policy.terms_sha256) THEN RAISE EXCEPTION 'CONFLICT'; END IF;
    IF p_action<>'agreement.accept' AND NOT accepted THEN RAISE EXCEPTION 'CONFLICT'; END IF;
    SELECT * INTO receipt FROM virtual_ink_workflow.commercial_events WHERE actor_id=actor AND operation_id=op AND outcome='success' AND action<>'read';
    IF FOUND THEN
     IF receipt.fingerprint IS DISTINCT FROM fingerprint THEN RAISE EXCEPTION 'CONFLICT'; END IF;
     RETURN jsonb_build_object('ok',true,'data',receipt.result,'auditId',receipt.id);
    END IF;
   END IF;
   IF p_action='read' THEN
    SELECT coalesce(jsonb_agg(s ORDER BY s.id),'[]'::jsonb) INTO scopes FROM (
     SELECT v.tenant_id AS id,v.business_name AS name FROM virtual_ink.vendor_profiles v JOIN virtual_ink.tenants t ON t.id=v.tenant_id
      WHERE v.owner_user_id=actor AND t.active AND EXISTS(SELECT FROM virtual_ink.memberships m WHERE m.tenant_id=v.tenant_id AND m.user_id=actor AND m.active) ORDER BY v.tenant_id LIMIT 20) s;
    SELECT coalesce(jsonb_agg(p ORDER BY p.label,p.id),'[]'::jsonb) INTO prices FROM (
     SELECT DISTINCT ON(h.id) h.id,v.version,v.service,v.label,v.unit,v.amount_minor AS "amountMinor",v.currency,v.active
      FROM virtual_ink_workflow.price_headers h JOIN virtual_ink_workflow.price_versions v ON v.price_id=h.id WHERE h.vendor_id=vendor ORDER BY h.id,v.version DESC) p;
    result:=jsonb_build_object('vendors',scopes,'vendorId',vendor,'prices',prices,'accepted',accepted,'policy',CASE WHEN policy.id IS NULL THEN NULL ELSE jsonb_build_object('id',policy.id,'version',policy.version,'basisPoints',policy.basis_points,'terms',policy.terms,'termsSha256',policy.terms_sha256,'collection',policy.collection,'settlement',policy.settlement) END,
     'accruedCommissionMinor',(SELECT coalesce(sum(q.commission_minor),0) FROM virtual_ink_workflow.commission_accruals a JOIN virtual_ink_workflow.quote_commercial_terms q ON q.quote_id=a.quote_id WHERE q.vendor_id=vendor));
   ELSIF p_action='agreement.accept' THEN
    IF p_input->'consent' IS DISTINCT FROM 'true'::jsonb OR p_input->>'policyId' IS DISTINCT FROM policy.id::text OR p_input->>'termsSha256' IS DISTINCT FROM policy.terms_sha256 THEN RAISE EXCEPTION 'CONFLICT'; END IF;
    INSERT INTO virtual_ink_workflow.vendor_agreements(vendor_id,policy_id,actor_id,session_id) VALUES(vendor,policy.id,actor,sid) ON CONFLICT DO NOTHING;
    IF NOT EXISTS(SELECT FROM virtual_ink_workflow.vendor_agreements WHERE vendor_id=vendor AND policy_id=policy.id AND actor_id=actor) THEN RAISE EXCEPTION 'CONFLICT'; END IF;
    result:=jsonb_build_object('accepted',true,'policyId',policy.id);
   ELSE
    price:=(p_input->>'priceId')::uuid;expected:=(p_input->>'expectedVersion')::integer;
    IF price IS NULL OR jsonb_typeof(p_input->'expectedVersion') IS DISTINCT FROM 'number' OR (p_input->>'expectedVersion')::numeric<>expected OR expected NOT BETWEEN 0 AND 999999 THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
    IF EXISTS(SELECT FROM virtual_ink_workflow.price_headers WHERE id=price AND vendor_id<>vendor) THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    SELECT * INTO previous FROM virtual_ink_workflow.price_versions WHERE price_id=price ORDER BY version DESC LIMIT 1;
    IF coalesce(previous.version,0) IS DISTINCT FROM expected THEN RAISE EXCEPTION 'CONFLICT'; END IF;
    IF p_action='price.save' THEN
     IF jsonb_typeof(p_input->'amountMinor') IS DISTINCT FROM 'number' OR (p_input->>'amountMinor')::numeric<>trunc((p_input->>'amountMinor')::numeric)
      OR (p_input->>'amountMinor')::numeric NOT BETWEEN 1 AND 1000000000 OR p_input->>'currency' IS DISTINCT FROM 'ZMW'
      OR jsonb_typeof(p_input->'label') IS DISTINCT FROM 'string' OR length(p_input->>'label') NOT BETWEEN 1 AND 120 OR p_input->>'label'<>btrim(p_input->>'label')
      OR p_input->>'label' ~ '[<>[:cntrl:]]' OR p_input->>'label' ~ U&'[\0080-\009F\202A-\202E\2066-\2069]' OR p_input->>'service' IS NULL OR p_input->>'unit' IS NULL THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
     IF previous.price_id IS NULL THEN
      IF (SELECT count(*) FROM virtual_ink_workflow.price_headers WHERE vendor_id=vendor)>=100 THEN RAISE EXCEPTION 'CONFLICT'; END IF;
      INSERT INTO virtual_ink_workflow.price_headers VALUES(price,vendor);
     END IF;
     INSERT INTO virtual_ink_workflow.price_versions(price_id,version,service,label,unit,amount_minor,currency,active,actor_id)
      VALUES(price,expected+1,p_input->>'service',p_input->>'label',p_input->>'unit',(p_input->>'amountMinor')::bigint,'ZMW',true,actor);
    ELSE
     IF previous.price_id IS NULL OR NOT previous.active THEN RAISE EXCEPTION 'CONFLICT'; END IF;
     INSERT INTO virtual_ink_workflow.price_versions(price_id,version,service,label,unit,amount_minor,currency,active,actor_id)
      VALUES(price,expected+1,previous.service,previous.label,previous.unit,previous.amount_minor,previous.currency,false,actor);
    END IF;
    result:=jsonb_build_object('priceId',price,'version',expected+1);
   END IF;
  EXCEPTION WHEN OTHERS THEN failure:=CASE WHEN SQLERRM IN('UNAUTHENTICATED','FORBIDDEN','CONFLICT','NOT_FOUND','IDENTITY_UNAVAILABLE','RATE_LIMITED') THEN SQLERRM ELSE 'VALIDATION_FAILED' END;
  END;
 EXCEPTION WHEN OTHERS THEN failure:=CASE WHEN SQLERRM IN('UNAUTHENTICATED','FORBIDDEN','CONFLICT','NOT_FOUND','IDENTITY_UNAVAILABLE','RATE_LIMITED') THEN SQLERRM ELSE 'VALIDATION_FAILED' END;
 END;
 INSERT INTO virtual_ink_workflow.commercial_events(id,actor_id,session_id,vendor_id,operation_id,request_id,action,fingerprint,outcome,result)
  VALUES(aid,actor,sid,vendor,op,cid,p_action,coalesce(fingerprint,''),CASE WHEN failure IS NULL THEN 'success' ELSE 'failure' END,
   CASE WHEN failure IS NOT NULL THEN jsonb_build_object('error',failure) WHEN p_action='read' THEN jsonb_build_object('read',true) ELSE result END);
 RETURN CASE WHEN failure IS NULL THEN jsonb_build_object('ok',true,'data',result,'auditId',aid) ELSE jsonb_build_object('ok',false,'error',failure,'auditId',aid) END;
END $$;
REVOKE ALL ON FUNCTION virtual_ink_workflow.commercial_command(text,jsonb,jsonb),virtual_ink_workflow.snapshot_commercial_quote(),virtual_ink_workflow.accrue_completed_commission() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION virtual_ink_workflow.commercial_command(text,jsonb,jsonb) TO virtual_ink_security_service;
RESET ROLE;
CREATE TRIGGER commercial_quote_snapshot AFTER INSERT ON virtual_ink_workflow.quotes FOR EACH ROW EXECUTE FUNCTION virtual_ink_workflow.snapshot_commercial_quote();
CREATE TRIGGER commercial_completion_accrual AFTER UPDATE ON virtual_ink_workflow.orders FOR EACH ROW EXECUTE FUNCTION virtual_ink_workflow.accrue_completed_commission();
REVOKE CREATE ON SCHEMA virtual_ink_workflow FROM virtual_ink_workflow_owner;
REVOKE virtual_ink_workflow_owner FROM CURRENT_USER;
