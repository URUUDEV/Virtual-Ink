-- Forward-only order dashboards. No enablement, login, user or hosted change.
CREATE FUNCTION virtual_ink_workflow.dashboard(p_input jsonb,p_context jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE cfg record;principal uuid;sid uuid;cid uuid;actor uuid;actor_role text;aid uuid:=gen_random_uuid();
 view_name text;filter_state text;oid uuid;cursor_id uuid;cursor_at timestamptz;page_size integer;counter integer;
 high boolean;mfa bigint;primary_time bigint;vendor_ids uuid[];items jsonb;summary jsonb;detail jsonb;failure text;has_more boolean;
BEGIN
 BEGIN
  IF current_setting('transaction_isolation')<>'read committed' THEN RAISE EXCEPTION 'CONFLICT'; END IF;
  IF jsonb_typeof(p_input) IS DISTINCT FROM 'object' OR octet_length(p_input::text)>4096
   OR EXISTS(SELECT FROM jsonb_object_keys(p_input) k WHERE k NOT IN('view','state','orderId','cursor','limit')) THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
  view_name:=p_input->>'view';filter_state:=p_input->>'state';oid:=(p_input->>'orderId')::uuid;
  page_size:=coalesce((p_input->>'limit')::integer,20);
  IF view_name IS NULL OR view_name NOT IN('customer','vendor','admin') OR page_size NOT BETWEEN 1 AND 50
   OR filter_state IS NOT NULL AND filter_state !~ '^[A-Z_]{3,32}$' THEN RAISE EXCEPTION 'VALIDATION_FAILED'; END IF;
  principal:=(p_context->>'subject')::uuid;sid:=(p_context->>'sessionId')::uuid;cid:=(p_context->>'correlationId')::uuid;
  IF principal IS NULL OR sid IS NULL OR cid IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  SELECT * INTO cfg FROM virtual_ink_security.configuration WHERE singleton;
  IF NOT coalesce(cfg.enabled,false) OR cfg.environment IS DISTINCT FROM p_context->>'environment' OR cfg.issuer IS DISTINCT FROM p_context->>'issuer'
   OR NOT EXISTS(SELECT FROM virtual_ink_workflow.configuration WHERE singleton AND enabled) THEN RAISE EXCEPTION 'IDENTITY_UNAVAILABLE'; END IF;
  PERFORM pg_advisory_xact_lock(74016,1);
  high:=view_name='admin';mfa:=(p_context->>'mfaAt')::bigint;primary_time:=(p_context->>'primaryAt')::bigint;
  IF high AND (p_context->>'aal' IS DISTINCT FROM 'aal2' OR mfa IS NULL OR (p_context->>'stepUpAt')::bigint IS DISTINCT FROM mfa) THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF NOT virtual_ink_security.provider_session(principal,sid,mfa,primary_time,high,high) THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  SELECT i.user_id INTO actor FROM virtual_ink.identities i JOIN virtual_ink.users u ON u.id=i.user_id
   WHERE i.provider='supabase' AND i.issuer=cfg.issuer AND i.subject=principal AND i.active AND u.active;
  SELECT role INTO actor_role FROM virtual_ink_phase1.role_assignments WHERE user_id=actor AND active AND (expires_at IS NULL OR expires_at>clock_timestamp());
  IF actor IS NULL OR actor_role IS NULL OR NOT (view_name='customer' AND actor_role='CUSTOMER'
   OR view_name='vendor' AND actor_role='VENDOR' OR high AND actor_role IN('ADMIN','SUPER_ADMIN')) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT coalesce(array_agg(t.id),'{}'::uuid[]) INTO vendor_ids FROM virtual_ink.tenants t
   JOIN virtual_ink.vendor_profiles v ON v.tenant_id=t.id JOIN virtual_ink.memberships m ON m.tenant_id=t.id
   WHERE t.active AND m.active AND m.user_id=actor;
  IF view_name='vendor' AND cardinality(vendor_ids)=0 THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  INSERT INTO virtual_ink_workflow.limits VALUES(actor,clock_timestamp(),1) ON CONFLICT(actor_id) DO UPDATE
   SET attempts=CASE WHEN virtual_ink_workflow.limits.window_at<=clock_timestamp()-interval '5 minutes' THEN 1 ELSE virtual_ink_workflow.limits.attempts+1 END,
    window_at=CASE WHEN virtual_ink_workflow.limits.window_at<=clock_timestamp()-interval '5 minutes' THEN clock_timestamp() ELSE virtual_ink_workflow.limits.window_at END RETURNING attempts INTO counter;
  IF counter>120 THEN RAISE EXCEPTION 'RATE_LIMITED'; END IF;
  IF p_input->>'cursor' IS NOT NULL THEN
   SELECT id,created_at INTO cursor_id,cursor_at FROM virtual_ink_workflow.orders
    WHERE id=(p_input->>'cursor')::uuid AND (high OR view_name='customer' AND owner_id=actor OR view_name='vendor' AND vendor_id=ANY(vendor_ids))
     AND (filter_state IS NULL OR state=filter_state);
   IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  END IF;
  WITH scoped AS (SELECT * FROM virtual_ink_workflow.orders WHERE high OR view_name='customer' AND owner_id=actor OR view_name='vendor' AND vendor_id=ANY(vendor_ids))
   SELECT jsonb_build_object('total',count(*),'active',count(*) FILTER(WHERE state NOT IN('COMPLETED','CANCELLED')),
    'pendingProof',count(*) FILTER(WHERE state='PROOF_UPLOADED'),'inProduction',count(*) FILTER(WHERE state IN('QUEUED_FOR_PRODUCTION','IN_PRODUCTION','QC_PENDING','QC_FAILED')))
    INTO summary FROM scoped;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'state',state,'version',version,'productCode',spec->>'productCode','quantity',spec->'quantity',
    'createdAt',created_at,'updatedAt',updated_at) ORDER BY created_at DESC,id DESC),'[]'::jsonb) INTO items
   FROM(SELECT * FROM virtual_ink_workflow.orders WHERE (high OR view_name='customer' AND owner_id=actor OR view_name='vendor' AND vendor_id=ANY(vendor_ids))
    AND (filter_state IS NULL OR state=filter_state) AND (cursor_id IS NULL OR (created_at,id)<(cursor_at,cursor_id))
    ORDER BY created_at DESC,id DESC LIMIT page_size+1) page;
  has_more:=jsonb_array_length(items)>page_size;items:=items-page_size;
  IF oid IS NOT NULL THEN
   SELECT jsonb_build_object('id',o.id,'state',o.state,'version',o.version,'spec',o.spec,'proofId',o.proof_id,'approvedProofId',o.approved_proof_id,
    'quote',CASE WHEN q.id IS NOT NULL THEN jsonb_build_object('id',q.id,'amountMinor',q.amount_minor,'currency',q.currency,'validUntil',q.valid_until) END,
    'timeline',coalesce((SELECT jsonb_agg(row_data ORDER BY occurred_at DESC,id DESC) FROM
     (SELECT e.id,e.occurred_at,jsonb_build_object('id',e.id,'action',e.action,'fromState',e.from_state,'state',e.to_state,'occurredAt',e.occurred_at) row_data
      FROM virtual_ink_workflow.events e WHERE e.order_id=o.id AND e.outcome='success' AND e.from_state IS DISTINCT FROM e.to_state ORDER BY e.occurred_at DESC,e.id DESC LIMIT 50) history),'[]'::jsonb))
    INTO detail FROM virtual_ink_workflow.orders o LEFT JOIN virtual_ink_workflow.quotes q ON q.id=o.quote_id WHERE o.id=oid
     AND (high OR view_name='customer' AND o.owner_id=actor OR view_name='vendor' AND o.vendor_id=ANY(vendor_ids));
   IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  END IF;
 EXCEPTION WHEN OTHERS THEN
  failure:=CASE WHEN SQLERRM IN('UNAUTHENTICATED','FORBIDDEN','CONFLICT','VALIDATION_FAILED','NOT_FOUND','IDENTITY_UNAVAILABLE','RATE_LIMITED') THEN SQLERRM ELSE 'VALIDATION_FAILED' END;
 END;
 -- The audit stores a bounded receipt, never the whole dashboard or file paths.
 INSERT INTO virtual_ink_workflow.events(id,actor_id,actor_role,assurance,subject,session_id,order_id,action,request_id,request_hash,outcome,result)
 VALUES(aid,actor,actor_role,CASE WHEN p_context->>'aal' IN('aal1','aal2') THEN p_context->>'aal' END,principal,sid,oid,'dashboard.read',coalesce(cid,gen_random_uuid()),'',
  CASE WHEN failure IS NULL THEN 'success' ELSE 'failure' END,CASE WHEN failure IS NULL THEN jsonb_build_object('view',view_name,'count',jsonb_array_length(items)) ELSE jsonb_build_object('error',failure) END);
 IF failure IS NOT NULL THEN RETURN jsonb_build_object('ok',false,'error',failure,'auditId',aid); END IF;
 RETURN jsonb_build_object('ok',true,'auditId',aid,'data',jsonb_build_object('view',view_name,'summary',summary,'orders',items,'detail',detail,
  'nextCursor',CASE WHEN has_more THEN items->(page_size-1)->>'id' END));
END $$;
REVOKE ALL ON FUNCTION virtual_ink_workflow.dashboard(jsonb,jsonb) FROM PUBLIC,anon,authenticated,service_role;
-- Managed migration roles may SET the function owner only within this migration.
GRANT virtual_ink_workflow_owner TO CURRENT_USER WITH INHERIT TRUE, SET TRUE;
GRANT CREATE ON SCHEMA virtual_ink_workflow TO virtual_ink_workflow_owner;
ALTER FUNCTION virtual_ink_workflow.dashboard(jsonb,jsonb) OWNER TO virtual_ink_workflow_owner;
REVOKE CREATE ON SCHEMA virtual_ink_workflow FROM virtual_ink_workflow_owner;
GRANT EXECUTE ON FUNCTION virtual_ink_workflow.dashboard(jsonb,jsonb) TO virtual_ink_security_service;
REVOKE virtual_ink_workflow_owner FROM CURRENT_USER;
