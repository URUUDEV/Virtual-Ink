-- Forward-only receipt reconciliation. No recipient, approval, login or enablement.
ALTER TABLE virtual_ink_workflow.configuration ADD COLUMN manual_payments_enabled boolean NOT NULL DEFAULT false;
CREATE TABLE virtual_ink_workflow.manual_payment_recipients(
 id uuid PRIMARY KEY,vendor_id uuid NOT NULL REFERENCES virtual_ink.vendor_profiles(tenant_id),
 method text NOT NULL CHECK(method IN('bank_transfer','mobile_money')),
 provider_code text NOT NULL CHECK(provider_code~'^[a-z][a-z0-9_]{2,31}$'),
 account_sha256 text NOT NULL CHECK(account_sha256~'^[a-f0-9]{64}$'),
 currency text NOT NULL CHECK(currency='ZMW'),approval_reference uuid NOT NULL,
 enabled boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(provider_code,account_sha256),UNIQUE(id,provider_code));
CREATE INDEX manual_recipients_vendor_idx ON virtual_ink_workflow.manual_payment_recipients(vendor_id,id);
CREATE TABLE virtual_ink_workflow.manual_payment_receipts(
 id uuid PRIMARY KEY,order_id uuid NOT NULL UNIQUE REFERENCES virtual_ink_workflow.orders(id),
 quote_id uuid NOT NULL,recipient_id uuid NOT NULL,provider_code text NOT NULL,
 reference_sha256 text NOT NULL CHECK(reference_sha256~'^[a-f0-9]{64}$'),
 amount_minor bigint NOT NULL CHECK(amount_minor BETWEEN 1 AND 1000000000),currency text NOT NULL CHECK(currency='ZMW'),
 evidence_reference uuid NOT NULL UNIQUE,reviewer_id uuid NOT NULL REFERENCES virtual_ink.users(id),session_id uuid NOT NULL,
 audit_id uuid NOT NULL UNIQUE REFERENCES virtual_ink_workflow.events(id) DEFERRABLE INITIALLY DEFERRED,
 reviewed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(quote_id,order_id) REFERENCES virtual_ink_workflow.quotes(id,order_id),
 FOREIGN KEY(recipient_id,provider_code) REFERENCES virtual_ink_workflow.manual_payment_recipients(id,provider_code),
 UNIQUE(provider_code,reference_sha256));
CREATE INDEX manual_receipts_recipient_idx ON virtual_ink_workflow.manual_payment_receipts(recipient_id,id);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['manual_payment_recipients','manual_payment_receipts'] LOOP
  EXECUTE format('REVOKE ALL ON virtual_ink_workflow.%I FROM PUBLIC,anon,authenticated,service_role',t);
  EXECUTE format('ALTER TABLE virtual_ink_workflow.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE virtual_ink_workflow.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY command_owner ON virtual_ink_workflow.%I TO virtual_ink_workflow_owner USING(true) WITH CHECK(true)',t);
  EXECUTE format('GRANT SELECT ON virtual_ink_workflow.%I TO virtual_ink_workflow_owner',t);
 END LOOP;
END $$;
CREATE TRIGGER immutable_history BEFORE UPDATE OR DELETE ON virtual_ink_workflow.manual_payment_receipts FOR EACH ROW EXECUTE FUNCTION virtual_ink_workflow.immutable();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON virtual_ink_workflow.manual_payment_receipts FOR EACH STATEMENT EXECUTE FUNCTION virtual_ink_workflow.immutable();
GRANT INSERT ON virtual_ink_workflow.manual_payment_receipts TO virtual_ink_workflow_owner;
GRANT virtual_ink_workflow_owner TO CURRENT_USER WITH INHERIT TRUE, SET TRUE;
GRANT CREATE ON SCHEMA virtual_ink_workflow TO virtual_ink_workflow_owner;
SET ROLE virtual_ink_workflow_owner;

-- Called only within the existing locked, authorized payment.confirm transaction.
-- The reviewer attests to independently checked receipt evidence; this is not a
-- bank API or an assertion that a UUID/screenshot independently proves settlement.
CREATE FUNCTION virtual_ink_workflow.reconcile_manual_payment(o virtual_ink_workflow.orders,p_input jsonb,actor uuid,sid uuid,aid uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE settings virtual_ink_workflow.configuration%ROWTYPE;r virtual_ink_workflow.manual_payment_recipients%ROWTYPE;
 q virtual_ink_workflow.quotes%ROWTYPE;reference text;receipt_id uuid:=gen_random_uuid();
BEGIN
 SELECT * INTO settings FROM virtual_ink_workflow.configuration WHERE singleton;
 IF NOT settings.commercial_enabled OR NOT settings.manual_payments_enabled THEN RAISE EXCEPTION 'CONFLICT'; END IF;
 IF NOT p_input ?& ARRAY['recipientId','receiptReference','amountMinor','currency','receiptChecked','evidenceReference']
  OR jsonb_typeof(p_input->'expectedVersion') IS DISTINCT FROM 'number' OR (p_input->>'expectedVersion')::numeric<>trunc((p_input->>'expectedVersion')::numeric)
  OR jsonb_typeof(p_input->'recipientId') IS DISTINCT FROM 'string' OR jsonb_typeof(p_input->'evidenceReference') IS DISTINCT FROM 'string'
  OR jsonb_typeof(p_input->'receiptReference') IS DISTINCT FROM 'string' OR octet_length(p_input->>'receiptReference') NOT BETWEEN 8 AND 128
  OR jsonb_typeof(p_input->'amountMinor') IS DISTINCT FROM 'number' OR (p_input->>'amountMinor')::numeric<>trunc((p_input->>'amountMinor')::numeric)
  OR (p_input->>'amountMinor')::numeric NOT BETWEEN 1 AND 1000000000 OR p_input->>'currency' IS DISTINCT FROM 'ZMW'
  OR p_input->'receiptChecked' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
 -- Only ASCII letters/digits, spaces and hyphens; equivalent presentations
 -- share one database-owned key. No Unicode confusables or arbitrary markup.
 IF p_input->>'receiptReference' !~ '^[A-Za-z0-9 -]+$' THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
 reference:=translate(p_input->>'receiptReference','abcdefghijklmnopqrstuvwxyz -','ABCDEFGHIJKLMNOPQRSTUVWXYZ');
 IF length(reference) NOT BETWEEN 8 AND 100 THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
 SELECT * INTO r FROM virtual_ink_workflow.manual_payment_recipients WHERE id=(p_input->>'recipientId')::uuid AND enabled;
 SELECT * INTO q FROM virtual_ink_workflow.quotes WHERE id=o.accepted_quote_id AND order_id=o.id;
 IF r.id IS NULL OR r.vendor_id IS DISTINCT FROM o.vendor_id OR q.id IS NULL OR r.currency IS DISTINCT FROM q.currency
  OR (p_input->>'amountMinor')::bigint IS DISTINCT FROM q.amount_minor OR p_input->>'currency' IS DISTINCT FROM q.currency
  OR NOT EXISTS(SELECT FROM virtual_ink_workflow.quote_commercial_terms c WHERE c.quote_id=q.id AND c.vendor_id=r.vendor_id AND c.amount_minor=q.amount_minor AND c.currency=q.currency)
  OR NOT EXISTS(SELECT FROM virtual_ink.vendor_profiles v JOIN virtual_ink.tenants t ON t.id=v.tenant_id WHERE v.tenant_id=r.vendor_id AND t.active AND v.availability='accepting_enquiries') THEN RAISE EXCEPTION 'CONFLICT'; END IF;
 IF actor=o.owner_id OR EXISTS(SELECT FROM virtual_ink.memberships WHERE tenant_id=r.vendor_id AND user_id=actor)
  OR EXISTS(SELECT FROM virtual_ink.vendor_profiles WHERE tenant_id=r.vendor_id AND owner_user_id=actor) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
 BEGIN
  INSERT INTO virtual_ink_workflow.manual_payment_receipts(id,order_id,quote_id,recipient_id,provider_code,reference_sha256,amount_minor,currency,evidence_reference,reviewer_id,session_id,audit_id)
   VALUES(receipt_id,o.id,q.id,r.id,r.provider_code,encode(sha256(convert_to(reference,'UTF8')),'hex'),q.amount_minor,q.currency,(p_input->>'evidenceReference')::uuid,actor,sid,aid);
 EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'CONFLICT'; END;
 RETURN receipt_id;
END $$;
REVOKE ALL ON FUNCTION virtual_ink_workflow.reconcile_manual_payment(virtual_ink_workflow.orders,jsonb,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role,virtual_ink_security_service;

CREATE FUNCTION virtual_ink_workflow.require_manual_payment_receipt() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.payment_reference IS NOT NULL
  AND NOT EXISTS(SELECT FROM virtual_ink_workflow.manual_payment_receipts r WHERE r.id=NEW.payment_reference AND r.order_id=NEW.id AND r.quote_id=NEW.accepted_quote_id) THEN RAISE EXCEPTION 'CONFLICT'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION virtual_ink_workflow.require_manual_payment_receipt() FROM PUBLIC,anon,authenticated,service_role,virtual_ink_security_service;

CREATE FUNCTION virtual_ink_workflow.immutable_manual_recipient() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF to_jsonb(NEW)-'enabled' IS DISTINCT FROM to_jsonb(OLD)-'enabled' THEN RAISE EXCEPTION 'Immutable recipient identity' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION virtual_ink_workflow.immutable_manual_recipient() FROM PUBLIC,anon,authenticated,service_role,virtual_ink_security_service;

-- The current command follows, retaining all document, role/session, replay,
-- limit, state, file, proof, production and audit gates. No alternate entry point.
CREATE OR REPLACE FUNCTION virtual_ink_workflow.command(p_action text,p_input jsonb,p_context jsonb) RETURNS jsonb
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
    WHEN 'quote.propose' THEN ARRAY['amountMinor','currency','validUntil'] WHEN 'payment.confirm' THEN ARRAY['evidenceReference','recipientId','receiptReference','amountMinor','currency','receiptChecked']
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
    IF o.id IS NOT NULL OR expected IS DISTINCT FROM 0 OR NOT virtual_ink_workflow.valid_spec(p_input->'spec') THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
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
     o.payment_reference:=virtual_ink_workflow.reconcile_manual_payment(o,p_input,actor,sid,aid);o.state:='PAYMENT_CONFIRMED';
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
REVOKE ALL ON FUNCTION virtual_ink_workflow.command(text,jsonb,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION virtual_ink_workflow.command(text,jsonb,jsonb) TO virtual_ink_security_service;
RESET ROLE;
CREATE TRIGGER manual_payment_receipt_required BEFORE UPDATE ON virtual_ink_workflow.orders FOR EACH ROW EXECUTE FUNCTION virtual_ink_workflow.require_manual_payment_receipt();
CREATE TRIGGER manual_recipient_identity BEFORE UPDATE ON virtual_ink_workflow.manual_payment_recipients FOR EACH ROW EXECUTE FUNCTION virtual_ink_workflow.immutable_manual_recipient();
CREATE TRIGGER immutable_history BEFORE DELETE ON virtual_ink_workflow.manual_payment_recipients FOR EACH ROW EXECUTE FUNCTION virtual_ink_workflow.immutable();
CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON virtual_ink_workflow.manual_payment_recipients FOR EACH STATEMENT EXECUTE FUNCTION virtual_ink_workflow.immutable();
REVOKE CREATE ON SCHEMA virtual_ink_workflow FROM virtual_ink_workflow_owner;
REVOKE virtual_ink_workflow_owner FROM CURRENT_USER;
