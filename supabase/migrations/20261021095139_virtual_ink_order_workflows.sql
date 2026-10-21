-- Forward-only, disabled Phase 1 workflow. No hosted enablement, logins or seeds.
CREATE SCHEMA virtual_ink_workflow;
REVOKE ALL ON SCHEMA virtual_ink_workflow FROM PUBLIC;
CREATE ROLE virtual_ink_workflow_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE virtual_ink_scan_service NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE TABLE virtual_ink_workflow.configuration(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),enabled boolean NOT NULL DEFAULT false);
INSERT INTO virtual_ink_workflow.configuration VALUES(true,false);
CREATE TABLE virtual_ink_workflow.orders(
 id uuid PRIMARY KEY,owner_id uuid NOT NULL REFERENCES virtual_ink.users(id),vendor_id uuid REFERENCES virtual_ink.tenants(id),
 state text NOT NULL CHECK(state IN('DRAFT','SUBMITTED','QUOTE_PENDING','QUOTED','CUSTOMER_REVIEW','AWAITING_PAYMENT','PAYMENT_CONFIRMED','VENDOR_ASSIGNED','VENDOR_ACCEPTED','PROOF_REQUIRED','PROOF_UPLOADED','CHANGES_REQUESTED','PROOF_APPROVED','QUEUED_FOR_PRODUCTION','IN_PRODUCTION','QC_PENDING','QC_FAILED','QC_PASSED','READY_FOR_PICKUP','READY_FOR_DELIVERY','COMPLETED','CANCELLED','DISPUTED')),
 version integer NOT NULL CHECK(version BETWEEN 1 AND 1000000),spec jsonb NOT NULL CHECK(jsonb_typeof(spec)='object' AND octet_length(spec::text)<=4096),
 quote_id uuid,accepted_quote_id uuid,payment_reference uuid,proof_id uuid,approved_proof_id uuid,production_proof_id uuid,source_file_id uuid,
 delivery_user_id uuid REFERENCES virtual_ink.users(id),production_started_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE INDEX workflow_orders_owner_idx ON virtual_ink_workflow.orders(owner_id,created_at,id);
CREATE INDEX workflow_orders_vendor_idx ON virtual_ink_workflow.orders(vendor_id,created_at,id) WHERE vendor_id IS NOT NULL;
CREATE TABLE virtual_ink_workflow.quotes(
 id uuid PRIMARY KEY,order_id uuid NOT NULL REFERENCES virtual_ink_workflow.orders(id),actor_id uuid NOT NULL REFERENCES virtual_ink.users(id),
 amount_minor bigint NOT NULL CHECK(amount_minor BETWEEN 1 AND 1000000000),currency text NOT NULL CHECK(currency='ZMW'),
 valid_until timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(id,order_id),CHECK(valid_until>created_at));
CREATE INDEX workflow_quotes_order_idx ON virtual_ink_workflow.quotes(order_id,created_at,id);
CREATE TABLE virtual_ink_workflow.files(
 id uuid PRIMARY KEY,order_id uuid NOT NULL REFERENCES virtual_ink_workflow.orders(id),owner_id uuid NOT NULL REFERENCES virtual_ink.users(id),
 purpose text NOT NULL CHECK(purpose IN('source','proof','production','evidence','dispute')),
 status text NOT NULL DEFAULT 'QUARANTINED' CHECK(status IN('QUARANTINED','SAFE','REJECTED','REVIEW_REQUIRED')),is_active boolean NOT NULL DEFAULT true,
 size integer NOT NULL CHECK(size BETWEEN 1 AND 26214400),mime text NOT NULL CHECK(mime IN('application/pdf','image/png','image/jpeg')),
 object_version text CHECK(length(object_version) BETWEEN 1 AND 256),sha256 text CHECK(sha256~'^[a-f0-9]{64}$'),duplicate_of uuid REFERENCES virtual_ink_workflow.files(id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),scanned_at timestamptz,UNIQUE(id,order_id),
 CHECK(status<>'SAFE' OR (object_version IS NOT NULL AND object_version LIKE 'approved:%' AND sha256 IS NOT NULL AND scanned_at IS NOT NULL)));
CREATE INDEX workflow_files_order_idx ON virtual_ink_workflow.files(order_id,created_at,id);
CREATE INDEX workflow_files_owner_hash_idx ON virtual_ink_workflow.files(owner_id,sha256) WHERE sha256 IS NOT NULL;
CREATE TABLE virtual_ink_workflow.proofs(
 id uuid PRIMARY KEY,order_id uuid NOT NULL REFERENCES virtual_ink_workflow.orders(id),file_id uuid NOT NULL UNIQUE,
 version integer NOT NULL CHECK(version>0),sha256 text NOT NULL CHECK(sha256~'^[a-f0-9]{64}$'),actor_id uuid NOT NULL REFERENCES virtual_ink.users(id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(order_id,version),UNIQUE(id,order_id),
 FOREIGN KEY(file_id,order_id) REFERENCES virtual_ink_workflow.files(id,order_id));
CREATE TABLE virtual_ink_workflow.evidence(
 id uuid PRIMARY KEY,order_id uuid NOT NULL REFERENCES virtual_ink_workflow.orders(id),file_id uuid NOT NULL UNIQUE,
 proof_id uuid NOT NULL,actor_id uuid NOT NULL REFERENCES virtual_ink.users(id),stage text NOT NULL CHECK(stage IN('printing','finishing','packing')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(file_id,order_id) REFERENCES virtual_ink_workflow.files(id,order_id),FOREIGN KEY(proof_id,order_id) REFERENCES virtual_ink_workflow.proofs(id,order_id));
CREATE INDEX workflow_evidence_order_idx ON virtual_ink_workflow.evidence(order_id,created_at,id);
CREATE TABLE virtual_ink_workflow.qc_records(
 id uuid PRIMARY KEY,order_id uuid NOT NULL REFERENCES virtual_ink_workflow.orders(id),actor_id uuid NOT NULL REFERENCES virtual_ink.users(id),
 passed boolean NOT NULL,checks jsonb NOT NULL CHECK(jsonb_typeof(checks)='object'),reason_code text NOT NULL CHECK(reason_code~'^[a-z][a-z0-9_]{2,63}$'),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE INDEX workflow_qc_order_idx ON virtual_ink_workflow.qc_records(order_id,created_at,id);
CREATE TABLE virtual_ink_workflow.grants(
 id uuid PRIMARY KEY,actor_id uuid NOT NULL REFERENCES virtual_ink.users(id),order_id uuid NOT NULL REFERENCES virtual_ink_workflow.orders(id),
 capability text NOT NULL CHECK(capability IN('order.assign','payment.confirm','delivery.assign')),reason_code text NOT NULL CHECK(reason_code~'^[a-z][a-z0-9_]{2,63}$'),
 approval_reference uuid NOT NULL,expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(expires_at>created_at AND expires_at<=created_at+interval '1 day'));
CREATE INDEX workflow_grants_actor_order_idx ON virtual_ink_workflow.grants(actor_id,order_id,capability,expires_at);
CREATE TABLE virtual_ink_workflow.events(
 id uuid PRIMARY KEY,actor_id uuid REFERENCES virtual_ink.users(id),actor_role text,assurance text CHECK(assurance IN('aal1','aal2')),subject uuid,session_id uuid,order_id uuid,
 action text NOT NULL CHECK(length(action)<=64),operation_id uuid,request_id uuid NOT NULL,request_hash text NOT NULL,
 outcome text NOT NULL CHECK(outcome IN('success','failure')),from_state text,to_state text,version integer,
 result jsonb NOT NULL CHECK(octet_length(result::text)<=8192),reason_code text,
 transaction_id bigint NOT NULL DEFAULT txid_current(),db_actor name NOT NULL DEFAULT session_user,
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE UNIQUE INDEX workflow_operation_once_idx ON virtual_ink_workflow.events(actor_id,operation_id) WHERE outcome='success' AND operation_id IS NOT NULL;
CREATE INDEX workflow_events_order_idx ON virtual_ink_workflow.events(order_id,occurred_at,id);
CREATE TABLE virtual_ink_workflow.limits(actor_id uuid PRIMARY KEY REFERENCES virtual_ink.users(id),window_at timestamptz NOT NULL,attempts integer NOT NULL CHECK(attempts>0));
ALTER TABLE virtual_ink_workflow.orders ADD FOREIGN KEY(quote_id,id) REFERENCES virtual_ink_workflow.quotes(id,order_id),
 ADD FOREIGN KEY(source_file_id,id) REFERENCES virtual_ink_workflow.files(id,order_id),
 ADD FOREIGN KEY(accepted_quote_id,id) REFERENCES virtual_ink_workflow.quotes(id,order_id),
 ADD FOREIGN KEY(proof_id,id) REFERENCES virtual_ink_workflow.proofs(id,order_id),
 ADD FOREIGN KEY(approved_proof_id,id) REFERENCES virtual_ink_workflow.proofs(id,order_id),
 ADD FOREIGN KEY(production_proof_id,id) REFERENCES virtual_ink_workflow.proofs(id,order_id);
ALTER TABLE virtual_ink_workflow.files ADD COLUMN proof_reference uuid;
ALTER TABLE virtual_ink_workflow.files ADD FOREIGN KEY(proof_reference,order_id) REFERENCES virtual_ink_workflow.proofs(id,order_id);
CREATE UNIQUE INDEX workflow_production_copy_once_idx ON virtual_ink_workflow.files(order_id,proof_reference) WHERE purpose='production';

CREATE FUNCTION virtual_ink_workflow.immutable() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN RAISE EXCEPTION 'Immutable workflow history' USING ERRCODE='23514'; END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['configuration','orders','quotes','files','proofs','evidence','qc_records','grants','events','limits'] LOOP
  EXECUTE format('ALTER TABLE virtual_ink_workflow.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE virtual_ink_workflow.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY command_owner ON virtual_ink_workflow.%I TO virtual_ink_workflow_owner USING(true) WITH CHECK(true)',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['quotes','proofs','evidence','qc_records','grants','events'] LOOP
  EXECUTE format('CREATE TRIGGER immutable_history BEFORE UPDATE OR DELETE ON virtual_ink_workflow.%I FOR EACH ROW EXECUTE FUNCTION virtual_ink_workflow.immutable()',t);
  EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON virtual_ink_workflow.%I FOR EACH STATEMENT EXECUTE FUNCTION virtual_ink_workflow.immutable()',t);
 END LOOP;
END $$;
GRANT USAGE ON SCHEMA virtual_ink_workflow,virtual_ink,virtual_ink_phase1,virtual_ink_security TO virtual_ink_workflow_owner;
GRANT SELECT ON virtual_ink_workflow.configuration,virtual_ink_workflow.grants TO virtual_ink_workflow_owner;
GRANT SELECT,INSERT,UPDATE ON virtual_ink_workflow.orders,virtual_ink_workflow.files,virtual_ink_workflow.limits TO virtual_ink_workflow_owner;
GRANT SELECT,INSERT ON virtual_ink_workflow.quotes,virtual_ink_workflow.proofs,virtual_ink_workflow.evidence,virtual_ink_workflow.qc_records,virtual_ink_workflow.events TO virtual_ink_workflow_owner;
GRANT SELECT ON virtual_ink.users,virtual_ink.identities,virtual_ink.tenants,virtual_ink.memberships,virtual_ink.vendor_profiles,virtual_ink_phase1.role_assignments,virtual_ink_security.configuration TO virtual_ink_workflow_owner;
CREATE POLICY workflow_user_read ON virtual_ink.users FOR SELECT TO virtual_ink_workflow_owner USING(true);
CREATE POLICY workflow_identity_read ON virtual_ink.identities FOR SELECT TO virtual_ink_workflow_owner USING(true);
CREATE POLICY workflow_tenant_read ON virtual_ink.tenants FOR SELECT TO virtual_ink_workflow_owner USING(true);
CREATE POLICY workflow_membership_read ON virtual_ink.memberships FOR SELECT TO virtual_ink_workflow_owner USING(true);
CREATE POLICY workflow_vendor_read ON virtual_ink.vendor_profiles FOR SELECT TO virtual_ink_workflow_owner USING(true);
CREATE POLICY workflow_role_read ON virtual_ink_phase1.role_assignments FOR SELECT TO virtual_ink_workflow_owner USING(true);
CREATE POLICY workflow_security_config ON virtual_ink_security.configuration FOR SELECT TO virtual_ink_workflow_owner USING(true);
GRANT EXECUTE ON FUNCTION virtual_ink_security.provider_session(uuid,uuid,bigint,bigint,boolean,boolean) TO virtual_ink_workflow_owner;

CREATE FUNCTION virtual_ink_workflow.command(p_action text,p_input jsonb,p_context jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE cfg record;o virtual_ink_workflow.orders%ROWTYPE;f virtual_ink_workflow.files%ROWTYPE;q virtual_ink_workflow.quotes%ROWTYPE;
 principal uuid;sid uuid;actor uuid;actor_role text;oid uuid;op uuid;cid uuid;aid uuid:=gen_random_uuid();hid uuid;
 mfa bigint;primary_time bigint;high boolean;is_owner boolean;is_vendor boolean;is_delivery boolean;
 previous text;failure text;result jsonb;receipt record;counter integer;expected integer;fingerprint text;new_id uuid;allowed text[];grant_reason text;page_size integer;cursor_at timestamptz;cursor_id uuid;timeline jsonb;has_more boolean;
BEGIN
 BEGIN
  IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION 'CONFLICT'; END IF;
  IF jsonb_typeof(p_input) IS DISTINCT FROM 'object' OR octet_length(p_input::text)>16384 THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
  principal:=(p_context->>'subject')::uuid;sid:=(p_context->>'sessionId')::uuid;cid:=(p_context->>'correlationId')::uuid;
  oid:=(p_input->>'orderId')::uuid;op:=(p_input->>'operationId')::uuid;expected:=(p_input->>'expectedVersion')::integer;
  IF principal IS NULL OR sid IS NULL OR cid IS NULL OR oid IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  SELECT * INTO cfg FROM virtual_ink_security.configuration WHERE singleton;
  IF NOT coalesce(cfg.enabled,false) OR cfg.environment IS DISTINCT FROM p_context->>'environment' OR cfg.issuer IS DISTINCT FROM p_context->>'issuer'
   OR NOT EXISTS(SELECT FROM virtual_ink_workflow.configuration WHERE singleton AND enabled) THEN RAISE EXCEPTION 'IDENTITY_UNAVAILABLE'; END IF;
  -- Same lock as the role writer: recheck authority after concurrent revocation.
  PERFORM pg_advisory_xact_lock(74016,1);
  high:=p_action IN('order.assign','payment.confirm','delivery.assign');
  mfa:=(p_context->>'mfaAt')::bigint;primary_time:=(p_context->>'primaryAt')::bigint;
  IF high AND (p_context->>'aal' IS DISTINCT FROM 'aal2' OR mfa IS NULL OR (p_context->>'stepUpAt')::bigint IS DISTINCT FROM mfa) THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF NOT virtual_ink_security.provider_session(principal,sid,mfa,primary_time,high,high) THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  SELECT i.user_id INTO actor FROM virtual_ink.identities i JOIN virtual_ink.users u ON u.id=i.user_id
   WHERE i.provider='supabase' AND i.issuer=cfg.issuer AND i.subject=principal AND i.active AND u.active;
  SELECT role INTO actor_role FROM virtual_ink_phase1.role_assignments WHERE user_id=actor AND active AND (expires_at IS NULL OR expires_at>clock_timestamp());
  IF actor IS NULL OR actor_role IS NULL THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  INSERT INTO virtual_ink_workflow.limits VALUES(actor,clock_timestamp(),1) ON CONFLICT(actor_id) DO UPDATE
   SET attempts=CASE WHEN virtual_ink_workflow.limits.window_at<=clock_timestamp()-interval '5 minutes' THEN 1 ELSE virtual_ink_workflow.limits.attempts+1 END,
    window_at=CASE WHEN virtual_ink_workflow.limits.window_at<=clock_timestamp()-interval '5 minutes' THEN clock_timestamp() ELSE virtual_ink_workflow.limits.window_at END RETURNING attempts INTO counter;
  IF counter>120 THEN RAISE EXCEPTION 'RATE_LIMITED'; END IF;
  -- Mutation subtransaction: a failed action rolls back, its denial audit persists.
  BEGIN
   SELECT * INTO o FROM virtual_ink_workflow.orders WHERE id=oid FOR UPDATE;
   previous:=o.state;
   is_owner:=o.owner_id=actor AND actor_role='CUSTOMER';
   is_vendor:=actor_role='VENDOR' AND EXISTS(SELECT FROM virtual_ink.vendor_profiles v JOIN virtual_ink.tenants t ON t.id=v.tenant_id
    JOIN virtual_ink.memberships m ON m.tenant_id=v.tenant_id WHERE v.tenant_id=o.vendor_id AND t.active AND m.user_id=actor AND m.active);
   is_delivery:=actor_role='DELIVERY_PARTNER' AND o.delivery_user_id=actor;
   IF p_action='order.create' THEN
    IF actor_role<>'CUSTOMER' THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
   ELSIF o.id IS NULL OR NOT (coalesce(is_owner,false) OR coalesce(is_vendor,false) OR coalesce(is_delivery,false) OR high) THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
   IF high AND (actor_role NOT IN('ADMIN','SUPER_ADMIN','FINANCE_ADMIN') OR actor_role='FINANCE_ADMIN' AND p_action<>'payment.confirm'
    OR NOT EXISTS(SELECT FROM virtual_ink_workflow.grants g WHERE g.actor_id=actor AND g.order_id=oid AND g.capability=p_action AND g.expires_at>clock_timestamp())) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
   IF high THEN SELECT reason_code INTO grant_reason FROM virtual_ink_workflow.grants WHERE actor_id=actor AND order_id=oid AND capability=p_action AND expires_at>clock_timestamp() ORDER BY expires_at DESC LIMIT 1; END IF;
   allowed:=CASE p_action WHEN 'order.create' THEN ARRAY['spec'] WHEN 'order.assign' THEN ARRAY['vendorId']
    WHEN 'quote.propose' THEN ARRAY['amountMinor','currency','validUntil'] WHEN 'payment.confirm' THEN ARRAY['evidenceReference']
    WHEN 'proof.upload' THEN ARRAY['fileId'] WHEN 'proof.respond' THEN ARRAY['proofId','approve','reasonCode']
    WHEN 'production.evidence' THEN ARRAY['fileId','stage'] WHEN 'qc.record' THEN ARRAY['passed','checks','reasonCode']
    WHEN 'order.ready' THEN ARRAY['handoff'] WHEN 'delivery.assign' THEN ARRAY['deliveryUserId'] WHEN 'order.dispute' THEN ARRAY['reasonCode'] WHEN 'job.decline' THEN ARRAY['reasonCode']
    WHEN 'file.reserve' THEN ARRAY['fileId','purpose','mime','size'] WHEN 'file.access' THEN ARRAY['fileId'] WHEN 'order.timeline' THEN ARRAY['limit','cursor'] ELSE ARRAY[]::text[] END;
   IF EXISTS(SELECT FROM jsonb_object_keys(p_input) k WHERE NOT k=ANY(allowed||ARRAY['orderId','operationId','expectedVersion'])) THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
   fingerprint:=encode(sha256(convert_to(p_action||p_input::text,'UTF8')),'hex');
   IF op IS NULL THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
   SELECT * INTO receipt FROM virtual_ink_workflow.events WHERE actor_id=actor AND operation_id=op AND outcome='success';
   IF FOUND THEN
    IF receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'CONFLICT'; END IF;
    IF p_action IN('file.access','order.read','order.timeline') THEN op:=NULL;
    ELSE RETURN jsonb_build_object('ok',true,'data',receipt.result,'auditId',receipt.id); END IF;
   END IF;
   IF p_action='order.create' THEN
    IF o.id IS NOT NULL OR expected IS DISTINCT FROM 0 OR jsonb_typeof(p_input->'spec') IS DISTINCT FROM 'object'
     OR EXISTS(SELECT FROM jsonb_object_keys(p_input->'spec') k WHERE k NOT IN('productCode','quantity','widthMm','heightMm'))
     OR p_input#>>'{spec,productCode}' IS NULL OR p_input#>>'{spec,productCode}' !~ '^[a-z][a-z0-9_-]{2,63}$'
     OR coalesce((p_input#>>'{spec,quantity}')::integer,0) NOT BETWEEN 1 AND 10000
     OR coalesce((p_input#>>'{spec,widthMm}')::integer,0) NOT BETWEEN 1 AND 10000
     OR coalesce((p_input#>>'{spec,heightMm}')::integer,0) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
    INSERT INTO virtual_ink_workflow.orders(id,owner_id,state,version,spec) VALUES(oid,actor,'DRAFT',1,p_input->'spec');
   ELSE
    IF p_action NOT IN('order.read','order.timeline','file.access') AND expected IS DISTINCT FROM o.version THEN RAISE EXCEPTION 'CONFLICT'; END IF;
    IF p_action IN('order.read','order.timeline') THEN NULL;
    ELSIF p_action='order.submit' AND is_owner AND o.state='DRAFT' THEN
     SELECT id INTO o.source_file_id FROM virtual_ink_workflow.files WHERE order_id=oid AND purpose='source' AND status='SAFE' AND is_active ORDER BY created_at DESC,id DESC LIMIT 1;
     IF o.source_file_id IS NULL THEN RAISE EXCEPTION 'CONFLICT'; END IF;
     o.state:='SUBMITTED';
    ELSIF p_action='order.assign' AND o.state IN('SUBMITTED','QUOTE_PENDING','PAYMENT_CONFIRMED') THEN
     IF NOT EXISTS(SELECT FROM virtual_ink.vendor_profiles v JOIN virtual_ink.tenants t ON t.id=v.tenant_id WHERE v.tenant_id=(p_input->>'vendorId')::uuid AND t.active AND v.availability='accepting_enquiries')
      OR EXISTS(SELECT FROM virtual_ink.memberships WHERE tenant_id=(p_input->>'vendorId')::uuid AND user_id=actor AND active)
      OR o.accepted_quote_id IS NOT NULL AND o.vendor_id IS DISTINCT FROM (p_input->>'vendorId')::uuid THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
     o.vendor_id:=(p_input->>'vendorId')::uuid;o.state:=CASE WHEN o.state='PAYMENT_CONFIRMED' THEN 'VENDOR_ASSIGNED' ELSE 'QUOTE_PENDING' END;
    ELSIF p_action='quote.propose' AND is_vendor AND o.state='QUOTE_PENDING' THEN
     IF p_input->>'currency' IS DISTINCT FROM 'ZMW' OR (p_input->>'validUntil')::timestamptz NOT BETWEEN clock_timestamp()+interval '1 minute' AND clock_timestamp()+interval '7 days' THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
     new_id:=gen_random_uuid();INSERT INTO virtual_ink_workflow.quotes VALUES(new_id,oid,actor,(p_input->>'amountMinor')::bigint,'ZMW',(p_input->>'validUntil')::timestamptz,clock_timestamp());
     o.quote_id:=new_id;o.state:='QUOTED';
    ELSIF p_action='quote.review' AND is_owner AND o.state='QUOTED' THEN o.state:='CUSTOMER_REVIEW';
    ELSIF p_action='quote.accept' AND is_owner AND o.state IN('QUOTED','CUSTOMER_REVIEW') THEN
     SELECT * INTO q FROM virtual_ink_workflow.quotes WHERE id=o.quote_id AND valid_until>clock_timestamp();
     IF q.id IS NULL THEN RAISE EXCEPTION 'CONFLICT'; END IF;
     o.accepted_quote_id:=q.id;o.state:='AWAITING_PAYMENT';
    ELSIF p_action='quote.reject' AND is_owner AND o.state IN('QUOTED','CUSTOMER_REVIEW') THEN o.state:='QUOTE_PENDING';o.quote_id:=NULL;
    ELSIF p_action='payment.confirm' AND o.state='AWAITING_PAYMENT' THEN
     o.payment_reference:=(p_input->>'evidenceReference')::uuid;IF o.payment_reference IS NULL THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;o.state:='PAYMENT_CONFIRMED';
    ELSIF p_action='job.accept' AND is_vendor AND o.state='VENDOR_ASSIGNED' THEN o.state:='VENDOR_ACCEPTED';
    ELSIF p_action='job.decline' AND is_vendor AND o.state='VENDOR_ASSIGNED' THEN
     IF p_input->>'reasonCode' IS NULL OR p_input->>'reasonCode' !~ '^[a-z][a-z0-9_]{2,63}$' THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;o.state:='DISPUTED';
    ELSIF p_action='proof.request' AND is_vendor AND o.state='VENDOR_ACCEPTED' THEN o.state:='PROOF_REQUIRED';
    ELSIF p_action='proof.upload' AND is_vendor AND o.state IN('PROOF_REQUIRED','CHANGES_REQUESTED') THEN
     SELECT * INTO f FROM virtual_ink_workflow.files WHERE id=(p_input->>'fileId')::uuid AND order_id=oid AND purpose='proof' AND status='SAFE' AND is_active AND owner_id=actor;
     IF f.id IS NULL THEN RAISE EXCEPTION 'CONFLICT'; END IF;
     new_id:=gen_random_uuid();INSERT INTO virtual_ink_workflow.proofs SELECT new_id,oid,f.id,coalesce(max(version),0)+1,f.sha256,actor,clock_timestamp() FROM virtual_ink_workflow.proofs WHERE order_id=oid;
     o.proof_id:=new_id;o.approved_proof_id:=NULL;o.state:='PROOF_UPLOADED';
    ELSIF p_action='proof.respond' AND is_owner AND o.state='PROOF_UPLOADED' THEN
     IF o.proof_id IS DISTINCT FROM (p_input->>'proofId')::uuid OR jsonb_typeof(p_input->'approve') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'CONFLICT'; END IF;
     IF (p_input->>'approve')::boolean THEN o.approved_proof_id:=o.proof_id;o.state:='PROOF_APPROVED';
     ELSE
      IF p_input->>'reasonCode' IS NULL OR p_input->>'reasonCode' !~ '^[a-z][a-z0-9_]{2,63}$' THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
      o.approved_proof_id:=NULL;o.state:='CHANGES_REQUESTED';
     END IF;
    ELSIF p_action='production.queue' AND is_vendor AND o.state='PROOF_APPROVED' THEN
     IF o.payment_reference IS NULL OR o.approved_proof_id IS DISTINCT FROM o.proof_id THEN RAISE EXCEPTION 'CONFLICT'; END IF;o.state:='QUEUED_FOR_PRODUCTION';
    ELSIF p_action='production.start' AND is_vendor AND o.state='QUEUED_FOR_PRODUCTION' THEN
     IF o.payment_reference IS NULL OR o.approved_proof_id IS NULL OR o.approved_proof_id IS DISTINCT FROM o.proof_id THEN RAISE EXCEPTION 'CONFLICT'; END IF;
     o.production_proof_id:=o.proof_id;o.production_started_at:=clock_timestamp();o.state:='IN_PRODUCTION';
    ELSIF p_action='production.evidence' AND is_vendor AND o.state='IN_PRODUCTION' THEN
     SELECT * INTO f FROM virtual_ink_workflow.files WHERE id=(p_input->>'fileId')::uuid AND order_id=oid AND purpose='evidence' AND status='SAFE' AND owner_id=actor AND created_at>=o.production_started_at;
     IF f.id IS NULL OR p_input->>'stage' IS NULL OR p_input->>'stage' NOT IN('printing','finishing','packing') THEN RAISE EXCEPTION 'CONFLICT'; END IF;
     INSERT INTO virtual_ink_workflow.evidence VALUES(gen_random_uuid(),oid,f.id,o.production_proof_id,actor,p_input->>'stage',clock_timestamp());
    ELSIF p_action='production.finish' AND is_vendor AND o.state='IN_PRODUCTION' THEN
     IF EXISTS(SELECT FROM unnest(ARRAY['printing','finishing','packing']) stage WHERE NOT EXISTS(SELECT FROM virtual_ink_workflow.evidence e WHERE e.order_id=oid AND e.stage=stage AND e.proof_id=o.production_proof_id
      AND e.created_at>coalesce((SELECT max(created_at) FROM virtual_ink_workflow.qc_records WHERE order_id=oid),'-infinity'::timestamptz))) THEN RAISE EXCEPTION 'CONFLICT'; END IF;o.state:='QC_PENDING';
    ELSIF p_action='qc.record' AND is_vendor AND o.state='QC_PENDING' THEN
     IF jsonb_typeof(p_input->'passed') IS DISTINCT FROM 'boolean' OR jsonb_typeof(p_input->'checks') IS DISTINCT FROM 'object'
      OR p_input->>'reasonCode' IS NULL OR p_input->>'reasonCode' !~ '^[a-z][a-z0-9_]{2,63}$' THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
     IF (p_input->>'passed')::boolean AND p_input->'checks' IS DISTINCT FROM '{"artwork":true,"quantity":true,"finish":true}'::jsonb THEN RAISE EXCEPTION 'CONFLICT'; END IF;
     INSERT INTO virtual_ink_workflow.qc_records VALUES(gen_random_uuid(),oid,actor,(p_input->>'passed')::boolean,p_input->'checks',p_input->>'reasonCode',clock_timestamp());
     o.state:=CASE WHEN (p_input->>'passed')::boolean THEN 'QC_PASSED' ELSE 'QC_FAILED' END;
    ELSIF p_action='production.correct' AND is_vendor AND o.state='QC_FAILED' THEN o.state:='IN_PRODUCTION';
    ELSIF p_action='delivery.assign' AND o.state='QC_PASSED' THEN
     IF NOT EXISTS(SELECT FROM virtual_ink_phase1.role_assignments r JOIN virtual_ink.users u ON u.id=r.user_id WHERE r.user_id=(p_input->>'deliveryUserId')::uuid AND u.active AND r.active AND r.role='DELIVERY_PARTNER' AND (r.expires_at IS NULL OR r.expires_at>clock_timestamp())) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
     o.delivery_user_id:=(p_input->>'deliveryUserId')::uuid;
    ELSIF p_action='order.ready' AND is_vendor AND o.state='QC_PASSED' THEN
     IF p_input->>'handoff'='collection' THEN o.state:='READY_FOR_PICKUP';o.delivery_user_id:=NULL;
     ELSIF p_input->>'handoff'='delivery' AND EXISTS(SELECT FROM virtual_ink_phase1.role_assignments r JOIN virtual_ink.users u ON u.id=r.user_id WHERE r.user_id=o.delivery_user_id AND u.active AND r.active AND r.role='DELIVERY_PARTNER' AND (r.expires_at IS NULL OR r.expires_at>clock_timestamp())) THEN
      o.state:='READY_FOR_DELIVERY';
     ELSE RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
    ELSIF p_action='order.complete' AND (is_owner AND o.state='READY_FOR_PICKUP' OR is_delivery AND o.state='READY_FOR_DELIVERY') THEN o.state:='COMPLETED';
    ELSIF p_action='order.cancel' AND is_owner AND o.state IN('DRAFT','SUBMITTED','QUOTE_PENDING','QUOTED','CUSTOMER_REVIEW','AWAITING_PAYMENT') THEN o.state:='CANCELLED';
    ELSIF p_action='order.dispute' AND is_owner AND o.state IN('READY_FOR_PICKUP','READY_FOR_DELIVERY','COMPLETED') THEN
     IF p_input->>'reasonCode' IS NULL OR p_input->>'reasonCode' !~ '^[a-z][a-z0-9_]{2,63}$' THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;o.state:='DISPUTED';
    ELSIF p_action='file.reserve' AND (is_owner AND o.state IN('DRAFT','SUBMITTED') AND p_input->>'purpose'='source'
     OR is_vendor AND o.state IN('PROOF_REQUIRED','CHANGES_REQUESTED') AND p_input->>'purpose'='proof'
     OR is_vendor AND o.state='IN_PRODUCTION' AND p_input->>'purpose'='evidence') THEN
     INSERT INTO virtual_ink_workflow.files(id,order_id,owner_id,purpose,size,mime) VALUES((p_input->>'fileId')::uuid,oid,actor,p_input->>'purpose',(p_input->>'size')::integer,p_input->>'mime');
    ELSIF p_action='file.access' AND NOT is_delivery THEN
     SELECT * INTO f FROM virtual_ink_workflow.files WHERE id=(p_input->>'fileId')::uuid AND order_id=oid AND status='SAFE' AND is_active;
     IF f.id IS NULL OR NOT(is_owner AND (f.purpose='source' OR f.purpose='proof' AND EXISTS(SELECT FROM virtual_ink_workflow.proofs p WHERE p.file_id=f.id AND p.id=o.proof_id))
      OR is_vendor AND (f.purpose='production' AND f.proof_reference=o.approved_proof_id AND o.approved_proof_id=o.proof_id
       OR f.owner_id=actor AND (f.purpose='evidence' OR f.purpose='proof' AND EXISTS(SELECT FROM virtual_ink_workflow.proofs p WHERE p.file_id=f.id AND p.id=o.proof_id)))) THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    ELSE RAISE EXCEPTION 'CONFLICT'; END IF;
    IF p_action NOT IN('order.read','order.timeline','file.access') THEN
     UPDATE virtual_ink_workflow.orders SET state=o.state,vendor_id=o.vendor_id,quote_id=o.quote_id,accepted_quote_id=o.accepted_quote_id,
      payment_reference=o.payment_reference,proof_id=o.proof_id,approved_proof_id=o.approved_proof_id,production_proof_id=o.production_proof_id,source_file_id=o.source_file_id,
      production_started_at=o.production_started_at,delivery_user_id=o.delivery_user_id,version=version+1,updated_at=clock_timestamp() WHERE id=oid;
    END IF;
   END IF;
   SELECT * INTO o FROM virtual_ink_workflow.orders WHERE id=oid;
   result:=jsonb_build_object('orderId',o.id,'state',o.state,'version',o.version);
   IF NOT coalesce(is_delivery,false) THEN
    result:=result||jsonb_build_object('spec',o.spec,'proofId',o.proof_id,'approvedProofId',o.approved_proof_id,'acceptedQuoteId',o.accepted_quote_id);
    IF o.quote_id IS NOT NULL THEN SELECT * INTO q FROM virtual_ink_workflow.quotes WHERE id=o.quote_id;result:=result||jsonb_build_object('quote',jsonb_build_object('id',q.id,'amountMinor',q.amount_minor,'currency',q.currency,'validUntil',q.valid_until)); END IF;
   END IF;
   IF p_action='file.access' THEN result:=result||jsonb_build_object('fileId',f.id,'purpose',f.purpose,'objectVersion',f.object_version,'sha256',f.sha256,'mime',f.mime,'size',f.size); END IF;
   IF p_action='order.timeline' THEN
    page_size:=coalesce((p_input->>'limit')::integer,20);
    IF page_size NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
    IF p_input->>'cursor' IS NOT NULL THEN
     SELECT id,occurred_at INTO cursor_id,cursor_at FROM virtual_ink_workflow.events WHERE id=(p_input->>'cursor')::uuid AND order_id=oid;
     IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    END IF;
    SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'action',action,'fromState',from_state,'state',to_state,'version',version,'occurredAt',occurred_at) ORDER BY occurred_at DESC,id DESC),'[]'::jsonb) INTO timeline
     FROM(SELECT * FROM virtual_ink_workflow.events e WHERE e.order_id=oid AND e.outcome='success' AND e.from_state IS DISTINCT FROM e.to_state
      AND (NOT coalesce(is_delivery,false) OR e.to_state IN('READY_FOR_DELIVERY','COMPLETED'))
      AND (p_input->>'cursor' IS NULL OR (e.occurred_at,e.id)<(cursor_at,cursor_id)) ORDER BY e.occurred_at DESC,e.id DESC LIMIT page_size+1) page;
    has_more:=jsonb_array_length(timeline)>page_size;
    timeline:=timeline-page_size;
    result:=result||jsonb_build_object('timeline',timeline,'nextCursor',CASE WHEN has_more THEN timeline->(page_size-1)->>'id' END);
   END IF;
  EXCEPTION WHEN OTHERS THEN
   failure:=CASE WHEN SQLERRM IN('FORBIDDEN','CONFLICT','VALIDATION_FAILED','NOT_FOUND') THEN SQLERRM ELSE 'VALIDATION_FAILED' END;
  END;
 EXCEPTION WHEN OTHERS THEN
  failure:=CASE WHEN SQLERRM IN('UNAUTHENTICATED','FORBIDDEN','CONFLICT','VALIDATION_FAILED','NOT_FOUND','IDENTITY_UNAVAILABLE','RATE_LIMITED') THEN SQLERRM ELSE 'VALIDATION_FAILED' END;
 END;
 -- No response if the required append-only audit cannot commit.
 INSERT INTO virtual_ink_workflow.events(id,actor_id,actor_role,assurance,subject,session_id,order_id,action,operation_id,request_id,request_hash,outcome,from_state,to_state,version,result,reason_code)
 VALUES(aid,actor,actor_role,p_context->>'aal',principal,sid,oid,left(coalesce(p_action,'invalid'),64),op,coalesce(cid,gen_random_uuid()),coalesce(fingerprint,''),CASE WHEN failure IS NULL THEN 'success' ELSE 'failure' END,
  previous,CASE WHEN failure IS NULL THEN o.state END,CASE WHEN failure IS NULL THEN o.version END,CASE WHEN failure IS NULL THEN result ELSE jsonb_build_object('error',failure) END,
  coalesce(CASE WHEN p_input->>'reasonCode' ~ '^[a-z][a-z0-9_]{2,63}$' THEN p_input->>'reasonCode' END,grant_reason));
 RETURN CASE WHEN failure IS NULL THEN jsonb_build_object('ok',true,'data',result,'auditId',aid) ELSE jsonb_build_object('ok',false,'error',failure,'auditId',aid) END;
END $$;

CREATE FUNCTION virtual_ink_workflow.record_scan(p_file uuid,p_version text,p_hash text,p_status text,p_size integer,p_mime text,p_request uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE f virtual_ink_workflow.files%ROWTYPE;
BEGIN
 IF NOT pg_has_role(session_user,'virtual_ink_scan_service','USAGE') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 IF NOT EXISTS(SELECT FROM virtual_ink_workflow.configuration WHERE singleton AND enabled) THEN RAISE EXCEPTION 'IDENTITY_UNAVAILABLE'; END IF;
 PERFORM pg_advisory_xact_lock(74016,1);
 SELECT * INTO f FROM virtual_ink_workflow.files WHERE id=p_file FOR UPDATE;
 IF f.id IS NULL OR f.status<>'QUARANTINED' OR p_request IS NULL OR p_size IS DISTINCT FROM f.size OR p_mime IS DISTINCT FROM f.mime
  OR p_hash IS NULL OR p_hash !~ '^[a-f0-9]{64}$' OR p_status='SAFE' AND p_version IS NULL OR length(p_version) NOT BETWEEN 1 AND 256
  OR p_status IS NULL OR p_status NOT IN('SAFE','REJECTED','REVIEW_REQUIRED') THEN RAISE EXCEPTION 'CONFLICT'; END IF;
 IF p_status='SAFE' AND NOT EXISTS(SELECT FROM virtual_ink_workflow.orders o WHERE o.id=f.order_id AND
  (f.purpose='source' AND o.state='DRAFT' OR f.purpose='proof' AND o.state IN('PROOF_REQUIRED','CHANGES_REQUESTED') OR f.purpose='evidence' AND o.state='IN_PRODUCTION'
   OR f.purpose='production' AND o.state IN('PROOF_APPROVED','QUEUED_FOR_PRODUCTION','IN_PRODUCTION') AND o.payment_reference IS NOT NULL AND o.approved_proof_id=o.proof_id
    AND f.proof_reference=o.proof_id AND EXISTS(SELECT FROM virtual_ink_workflow.proofs p WHERE p.id=f.proof_reference AND p.sha256=p_hash))) THEN p_status:='REVIEW_REQUIRED'; END IF;
 IF p_status='SAFE' AND f.purpose IN('source','proof') THEN UPDATE virtual_ink_workflow.files SET is_active=false WHERE order_id=f.order_id AND purpose=f.purpose AND id<>f.id AND status='SAFE'; END IF;
 UPDATE virtual_ink_workflow.files SET status=p_status,object_version=p_version,sha256=p_hash,scanned_at=clock_timestamp(),
  duplicate_of=(SELECT id FROM virtual_ink_workflow.files WHERE owner_id=f.owner_id AND purpose=f.purpose AND sha256=p_hash AND status='SAFE' AND id<>p_file ORDER BY created_at,id LIMIT 1) WHERE id=p_file;
 INSERT INTO virtual_ink_workflow.events(id,order_id,action,request_id,request_hash,outcome,result)
 VALUES(gen_random_uuid(),f.order_id,'file.scanned',p_request,p_hash,'success',jsonb_build_object('fileId',p_file,'status',p_status));
 RETURN jsonb_build_object('fileId',p_file,'status',p_status);
END $$;

CREATE FUNCTION virtual_ink_workflow.prepare_production_copy(p_order uuid,p_request uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE o virtual_ink_workflow.orders%ROWTYPE;s virtual_ink_workflow.files%ROWTYPE;t virtual_ink_workflow.files%ROWTYPE;
BEGIN
 IF NOT pg_has_role(session_user,'virtual_ink_scan_service','USAGE') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 IF NOT EXISTS(SELECT FROM virtual_ink_workflow.configuration WHERE singleton AND enabled) THEN RAISE EXCEPTION 'IDENTITY_UNAVAILABLE'; END IF;
 PERFORM pg_advisory_xact_lock(74016,1);
 SELECT * INTO o FROM virtual_ink_workflow.orders WHERE id=p_order FOR UPDATE;
 IF o.id IS NULL OR p_request IS NULL OR o.state NOT IN('PROOF_APPROVED','QUEUED_FOR_PRODUCTION','IN_PRODUCTION') OR o.payment_reference IS NULL
  OR o.approved_proof_id IS NULL OR o.approved_proof_id IS DISTINCT FROM o.proof_id THEN RAISE EXCEPTION 'CONFLICT'; END IF;
 SELECT f.* INTO s FROM virtual_ink_workflow.files f JOIN virtual_ink_workflow.proofs p ON p.file_id=f.id
  WHERE p.id=o.approved_proof_id AND p.order_id=o.id AND p.sha256=f.sha256 AND f.status='SAFE' AND f.is_active;
 IF s.id IS NULL THEN RAISE EXCEPTION 'CONFLICT'; END IF;
 SELECT * INTO t FROM virtual_ink_workflow.files WHERE order_id=o.id AND purpose='production' AND proof_reference=o.approved_proof_id;
 IF t.id IS NULL THEN
  INSERT INTO virtual_ink_workflow.files(id,order_id,owner_id,purpose,size,mime,proof_reference)
   VALUES(gen_random_uuid(),o.id,s.owner_id,'production',s.size,s.mime,o.approved_proof_id) RETURNING * INTO t;
 END IF;
 INSERT INTO virtual_ink_workflow.events(id,order_id,action,request_id,request_hash,outcome,result)
 VALUES(gen_random_uuid(),o.id,'file.production.prepared',p_request,s.sha256,'success',jsonb_build_object('fileId',t.id,'proofId',o.approved_proof_id));
 RETURN jsonb_build_object('file',jsonb_build_object('fileId',t.id,'orderId',t.order_id,'purpose',t.purpose,'mime',t.mime,'size',t.size),
  'source',jsonb_build_object('fileId',s.id,'orderId',s.order_id,'purpose',s.purpose,'mime',s.mime,'size',s.size),
  'sourceVersion',s.object_version,'sha256',s.sha256,'status',t.status);
END $$;

CREATE FUNCTION virtual_ink_workflow.pending_file(p_file uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE f virtual_ink_workflow.files%ROWTYPE;
BEGIN
 IF NOT pg_has_role(session_user,'virtual_ink_scan_service','USAGE') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 IF NOT EXISTS(SELECT FROM virtual_ink_workflow.configuration WHERE singleton AND enabled) THEN RAISE EXCEPTION 'IDENTITY_UNAVAILABLE'; END IF;
 SELECT * INTO f FROM virtual_ink_workflow.files WHERE id=p_file AND status='QUARANTINED';
 IF f.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
 RETURN jsonb_build_object('fileId',f.id,'orderId',f.order_id,'purpose',f.purpose,'mime',f.mime,'size',f.size);
END $$;

-- Restrict defaults, then expose only reviewed commands to private service groups.
REVOKE ALL ON ALL TABLES IN SCHEMA virtual_ink_workflow FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA virtual_ink_workflow FROM PUBLIC;
GRANT virtual_ink_workflow_owner TO CURRENT_USER WITH INHERIT TRUE, SET TRUE;
GRANT CREATE ON SCHEMA virtual_ink_workflow TO virtual_ink_workflow_owner;
ALTER FUNCTION virtual_ink_workflow.command(text,jsonb,jsonb) OWNER TO virtual_ink_workflow_owner;
ALTER FUNCTION virtual_ink_workflow.record_scan(uuid,text,text,text,integer,text,uuid) OWNER TO virtual_ink_workflow_owner;
ALTER FUNCTION virtual_ink_workflow.pending_file(uuid) OWNER TO virtual_ink_workflow_owner;
ALTER FUNCTION virtual_ink_workflow.prepare_production_copy(uuid,uuid) OWNER TO virtual_ink_workflow_owner;
REVOKE CREATE ON SCHEMA virtual_ink_workflow FROM virtual_ink_workflow_owner;
GRANT USAGE ON SCHEMA virtual_ink_workflow TO virtual_ink_security_service,virtual_ink_scan_service;
GRANT EXECUTE ON FUNCTION virtual_ink_workflow.command(text,jsonb,jsonb) TO virtual_ink_security_service;
GRANT EXECUTE ON FUNCTION virtual_ink_workflow.record_scan(uuid,text,text,text,integer,text,uuid) TO virtual_ink_scan_service;
GRANT EXECUTE ON FUNCTION virtual_ink_workflow.pending_file(uuid) TO virtual_ink_scan_service;
GRANT EXECUTE ON FUNCTION virtual_ink_workflow.prepare_production_copy(uuid,uuid) TO virtual_ink_scan_service;
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role','virtual_ink_api','virtual_ink_provisioner','virtual_ink_vendor_service','virtual_ink_phase1_reader'] LOOP
  IF EXISTS(SELECT FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('REVOKE ALL ON SCHEMA virtual_ink_workflow FROM %I',r);
   EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA virtual_ink_workflow FROM %I',r);
   EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA virtual_ink_workflow FROM %I',r);
  END IF;
 END LOOP;
END $$;
REVOKE virtual_ink_workflow_owner FROM CURRENT_USER;
