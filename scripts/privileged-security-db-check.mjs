// Synthetic provider-shaped SQL evidence only. Never genuine Auth/MFA acceptance.
import assert from 'node:assert/strict';
import pg from 'pg';
import {randomUUID} from 'node:crypto';
import {loadAssignedPhase1Actor} from '../src/backend/identity/assigned-context.ts';
const config={host:'127.0.0.1',port:54329,user:'vendor_replay',database:'postgres',password:process.env.PGPASSWORD,
 ssl:false,connectionTimeoutMillis:5000,statement_timeout:5000};
const client=new pg.Client(config);
const id=i=>`e1000000-0000-4000-8000-${String(i).padStart(12,'0')}`;
const issuer='https://synthetic.invalid/auth/v1';
const roles=['SUPER_ADMIN','SUPER_ADMIN','ADMIN','CUSTOMER','VENDOR','SECURITY_ADMIN','FINANCE_ADMIN','PAYOUT_APPROVER','DISPUTE_REVIEWER'];
const current=Math.floor(Date.now()/1000);
let checks=0;
await client.connect();
try {
 assert.equal((await client.query("SELECT current_database()='postgres' AND EXISTS(SELECT FROM pg_roles WHERE rolname='vendor_replay' AND rolsuper) AS isolated")).rows[0].isolated,true);
 await client.query('BEGIN');
 await client.query("UPDATE virtual_ink_security.configuration SET enabled=true,environment='local',issuer=$1",[issuer]);
 for(let i=1;i<=10;i++) {
  const role=roles[i-1]??'ADMIN';
  await client.query('INSERT INTO virtual_ink.users(id) VALUES($1)',[id(i)]);
  await client.query("INSERT INTO virtual_ink.identities(provider,issuer,subject,user_id) VALUES('supabase',$1,$2,$3)",[issuer,id(100+i),id(i)]);
  await client.query("INSERT INTO virtual_ink.provisioning_audits(operation_id,approval_id,reviewer_id,db_actor,action,request_fingerprint,user_id,outcome) VALUES(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),session_user,'create_account',repeat('d',64),$1,'created')",[id(i)]);
  await client.query("INSERT INTO virtual_ink_phase1.role_assignments(id,user_id,role,granted_by,approval_reference,reason_code,created_at,expires_at) VALUES($1,$2,$3,$2,gen_random_uuid(),'synthetic_setup',clock_timestamp()-interval '2 minutes',CASE WHEN $4 THEN clock_timestamp()-interval '1 minute' ELSE NULL END)",[id(400+i),id(i),role,i===10]);
  await client.query("INSERT INTO virtual_ink_phase1.role_assignment_audits(id,assignment_id,user_id,role,version,action,actor_id,approval_reference,reason_code,request_id) SELECT gen_random_uuid(),id,user_id,role,version,'role.granted',granted_by,approval_reference,reason_code,gen_random_uuid() FROM virtual_ink_phase1.role_assignments WHERE user_id=$1",[id(i)]);
  await client.query('INSERT INTO auth.users VALUES($1,false,to_timestamp($2),NULL,NULL)',[id(100+i),current-100]);
  await client.query("INSERT INTO auth.sessions VALUES($1,$2,'aal2',$3,NULL)",[id(200+i),id(100+i),id(300+i)]);
  await client.query("INSERT INTO auth.mfa_factors VALUES($1,$2,'totp','verified',to_timestamp($3))",[id(300+i),id(100+i),current-100]);
  await client.query("INSERT INTO auth.mfa_amr_claims VALUES($1,'password',to_timestamp($2)),($1,'totp',to_timestamp($3))",[id(200+i),current-10,current-1]);
 }
 await client.query('SET CONSTRAINTS ALL IMMEDIATE');await client.query('SET CONSTRAINTS ALL DEFERRED');
 const context=(i,patch={})=>({issuer,environment:'local',subject:id(100+i),sessionId:id(200+i),aal:'aal2',mfaAt:current-1,primaryAt:current-10,stepUpAt:current-1,correlationId:randomUUID(),...patch});
 async function command(i,action,input={},patch={}) {
  await client.query('SET LOCAL ROLE virtual_ink_security_service');
  try{return (await client.query('SELECT virtual_ink_security.command($1,$2,$3) AS result',[action,input,context(i,patch)])).rows[0].result;}
  finally{await client.query('RESET ROLE');}
 }
 async function denied(i,action,input={},error='FORBIDDEN',patch={}) {const result=await command(i,action,input,patch);assert.equal(result.ok,false,action);
  if(result.error!==error)console.log('Synthetic SQL diagnostic:',(await client.query('SELECT metadata FROM virtual_ink_security.events WHERE id=$1',[result.auditId])).rows);
  assert.equal(result.error,error,JSON.stringify(result));assert.ok(result.auditId);checks++;return result;}
 const request=(target,role='ADMIN')=>({requestId:randomUUID(),targetUserId:id(target),expectedAssignmentId:id(400+target),role,reason:'Synthetic authorized security review',expiresAt:null});
 for(const i of [4,5])await denied(i,'role.request',request(i,'SUPER_ADMIN'));
 await denied(3,'role.request',request(4,'SUPER_ADMIN'));
 await denied(1,'role.request',request(1,'ADMIN'));
 await denied(10,'status');
 await client.query('SET LOCAL ROLE virtual_ink_phase1_reader');
 await assert.rejects(loadAssignedPhase1Actor({query:(sql,values)=>client.query(sql,values)},
  {provider:'supabase',issuer,subject:id(110)}),{code:'FORBIDDEN'});checks++;
 await client.query('RESET ROLE');
 await denied(1,'role.request',{...request(4),reason:''},'VALIDATION_FAILED');
 await denied(1,'role.request',{...request(4),expiresAt:new Date((current-1)*1000).toISOString()},'VALIDATION_FAILED');
 await denied(1,'role.request',request(4),'IDENTITY_UNAVAILABLE',{environment:'preview'});
 await denied(1,'role.request',request(4),'UNAUTHENTICATED',{mfaAt:current-2});
 await denied(1,'role.request',request(4),'UNAUTHENTICATED',{aal:'aal1'});
 await denied(1,'role.request',request(4),'UNAUTHENTICATED',{stepUpAt:null});
 await denied(1,'role.request',request(4),'UNAUTHENTICATED',{primaryAt:current-11});
 await client.query('SAVEPOINT no_mfa');await client.query("UPDATE auth.sessions SET aal='aal1' WHERE id=$1",[id(201)]);
 for(const capability of ['role.assign','role.remove','vendor.verify','account.suspend','refund.approve','payment.release','payout.change','security.settings','security.read']) {
  await denied(1,'protected.check',{capability},'UNAUTHENTICATED');
 }
 await denied(1,'password.begin',{},'UNAUTHENTICATED');
 await client.query('ROLLBACK TO SAVEPOINT no_mfa');
 await client.query('SAVEPOINT stale_primary');
 await client.query("UPDATE auth.mfa_amr_claims SET updated_at=to_timestamp($1) WHERE session_id=$2 AND authentication_method='password'",[current-301,id(201)]);
 await denied(1,'role.request',request(4),'UNAUTHENTICATED',{primaryAt:current-301});
 await client.query('ROLLBACK TO SAVEPOINT stale_primary');
 // Ordinary database roles cannot bypass the UI, the command, or append-only audits.
 for(const role of ['authenticated','anon','service_role','virtual_ink_api','virtual_ink_provisioner','virtual_ink_vendor_service','virtual_ink_security_service']) {
  for(const statement of ["UPDATE virtual_ink_phase1.role_assignments SET role='SUPER_ADMIN'",'DELETE FROM virtual_ink_security.events',"UPDATE virtual_ink_security.configuration SET enabled=true"]) {
   await client.query('SAVEPOINT rights');await client.query(`SET LOCAL ROLE ${role}`);
   await assert.rejects(client.query(statement),{code:'42501'});checks++;await client.query('ROLLBACK TO SAVEPOINT rights');
  }
  if(role!=='virtual_ink_security_service') {
   await client.query('SAVEPOINT entrypoint');await client.query(`SET LOCAL ROLE ${role}`);
   await assert.rejects(client.query("SELECT virtual_ink_security.command('status','{}','{}')"),{code:'42501'});checks++;await client.query('ROLLBACK TO SAVEPOINT entrypoint');
  }
 }
 // Durable code fingerprints prevent replay across challenges/sessions.
 const reservation={kind:'verify',factorId:id(301),digest:'a'.repeat(64)};
 assert.equal((await command(1,'mfa.reserve',reservation)).ok,true);checks++;
 await denied(1,'mfa.reserve',reservation,'UNAUTHENTICATED');
 for(let n=0;n<3;n++)assert.equal((await command(1,'mfa.reserve',{...reservation,digest:String(n+1).repeat(64)})).ok,true);
 await denied(1,'mfa.reserve',{...reservation,digest:'b'.repeat(64)},'RATE_LIMITED');
 assert.ok(Number((await client.query("SELECT count(*) FROM virtual_ink_security.events WHERE severity='alert'")).rows[0].count)>0);checks++;
 // A different approver and current assignments are mandatory at every stage.
 const input=request(3,'SECURITY_ADMIN');
 assert.equal((await command(1,'role.request',input)).ok,true);checks++;
 await denied(1,'role.approve',{requestId:input.requestId});
 assert.equal((await command(2,'role.approve',{requestId:input.requestId})).ok,true);checks++;
 const executed=await command(1,'role.execute',{requestId:input.requestId});assert.equal(executed.ok,true,JSON.stringify(executed));checks++;
 assert.equal((await client.query('SELECT count(*) FROM auth.sessions WHERE user_id=$1',[id(103)])).rows[0].count,'0');checks++;
 await denied(3,'status',{},'UNAUTHENTICATED');
 await denied(1,'role.execute',{requestId:input.requestId});
 assert.equal((await client.query('SELECT role FROM virtual_ink_phase1.role_assignments WHERE user_id=$1 AND active',[id(3)])).rows[0].role,'SECURITY_ADMIN');
 const changed=await client.query("SELECT * FROM virtual_ink_security.events WHERE action='role.execute' AND outcome='success'");
 assert.equal(changed.rows.length,1);assert.deepEqual(changed.rows[0].previous_roles,['ADMIN']);assert.deepEqual(changed.rows[0].new_roles,['SECURITY_ADMIN']);
 assert.equal(changed.rows[0].requester,id(1));assert.equal(changed.rows[0].approver,id(2));assert.equal(changed.rows[0].executor,id(1));assert.equal(changed.rows[0].assurance,'aal2');checks++;
 // A stale expected assignment never overwrites the reviewed target.
 await denied(1,'role.request',{...request(3),expectedAssignmentId:id(403)},'CONFLICT');
 // Provider revocation failure rolls the role and its transaction audits back;
 // a separate failure security event remains visible in the transaction.
 const failing=request(4);
 assert.equal((await command(1,'role.request',failing)).ok,true);
 assert.equal((await command(2,'role.approve',{requestId:failing.requestId})).ok,true);
 await client.query('SAVEPOINT provider_failure');
 await client.query("CREATE OR REPLACE FUNCTION virtual_ink_security.revoke_provider_sessions(p_subject uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$ BEGIN RAISE EXCEPTION 'Synthetic provider unavailable'; END $$");
 const beforeAudits=(await client.query('SELECT count(*) FROM virtual_ink_phase1.role_assignment_audits')).rows[0].count;
 const failed=await denied(1,'role.execute',{requestId:failing.requestId},'CONFLICT');
 assert.equal((await client.query('SELECT role FROM virtual_ink_phase1.role_assignments WHERE user_id=$1 AND active',[id(4)])).rows[0].role,'CUSTOMER');
 assert.equal((await client.query('SELECT count(*) FROM virtual_ink_phase1.role_assignment_audits')).rows[0].count,beforeAudits);
 assert.equal((await client.query('SELECT count(*) FROM auth.sessions WHERE user_id=$1',[id(104)])).rows[0].count,'1');
 assert.equal((await client.query('SELECT outcome FROM virtual_ink_security.events WHERE id=$1',[failed.auditId])).rows[0].outcome,'failure');checks++;
 await client.query('ROLLBACK TO SAVEPOINT provider_failure');
 assert.equal((await command(1,'role.execute',{requestId:failing.requestId})).ok,true);checks++;
 const activeTarget=(await client.query('SELECT id FROM virtual_ink_phase1.role_assignments WHERE user_id=$1 AND active',[id(4)])).rows[0].id;
 await client.query("INSERT INTO auth.sessions VALUES($1,$2,'aal2',$3,NULL)",[id(904),id(104),id(304)]);
 await client.query("INSERT INTO auth.mfa_amr_claims SELECT $1,authentication_method,updated_at FROM auth.mfa_amr_claims WHERE session_id=$2",[id(904),id(204)]);
 assert.equal((await command(4,'status',{}, {sessionId:id(904)})).ok,true);checks++;
 const removal={...request(4,'CUSTOMER'),expectedAssignmentId:activeTarget};
 assert.equal((await command(1,'role.request',removal)).ok,true);
 assert.equal((await command(2,'role.approve',{requestId:removal.requestId})).ok,true);
 assert.equal((await command(1,'role.execute',{requestId:removal.requestId})).ok,true);checks++;
 await denied(4,'status',{},'UNAUTHENTICATED',{sessionId:id(904)});
 assert.equal((await client.query('SELECT role FROM virtual_ink_phase1.role_assignments WHERE user_id=$1 AND active',[id(4)])).rows[0].role,'CUSTOMER');checks++;
 await client.query('SAVEPOINT last_super');await client.query('UPDATE virtual_ink.users SET active=false WHERE id=$1',[id(2)]);
 assert.equal((await client.query("SELECT count(*) FROM virtual_ink_phase1.role_assignments r JOIN virtual_ink.users u ON u.id=r.user_id WHERE r.role='SUPER_ADMIN' AND r.active AND u.active")).rows[0].count,'1');
 await denied(1,'role.request',request(1,'CUSTOMER'));
 assert.equal((await client.query('SELECT role FROM virtual_ink_phase1.role_assignments WHERE user_id=$1 AND active',[id(1)])).rows[0].role,'SUPER_ADMIN');checks++;
 await client.query('ROLLBACK TO SAVEPOINT last_super');
 // Recovery is a review record only; no HTTP support bypass removes a factor.
 await client.query("INSERT INTO auth.sessions VALUES($1,$2,'aal1',NULL,NULL)",[id(905),id(104)]);
 await client.query("INSERT INTO auth.mfa_amr_claims VALUES($1,'password',to_timestamp($2))",[id(905),current-10]);
 const recoveryId=randomUUID();assert.equal((await command(4,'recovery.request',{requestId:recoveryId,reason:'Synthetic lost authenticator request'},
  {sessionId:id(905),aal:'aal1',mfaAt:null})).ok,true);
 assert.equal((await command(1,'recovery.approve',{requestId:recoveryId})).ok,true);
 await denied(1,'recovery.approve',{requestId:recoveryId});
 assert.equal((await command(2,'recovery.approve',{requestId:recoveryId})).ok,true);
 assert.equal((await client.query('SELECT count(*) FROM auth.mfa_factors')).rows[0].count,'10');checks++;
 // A serialization lock really blocks a second connection, rather than granting on a stale snapshot.
 const concurrent=new pg.Client(config);await concurrent.connect();
 try {
  await concurrent.query('BEGIN');
  assert.equal((await concurrent.query('SELECT pg_try_advisory_xact_lock(74016,1) AS acquired')).rows[0].acquired,false);checks++;
  await concurrent.query('ROLLBACK');await concurrent.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
  await concurrent.query('SET LOCAL ROLE virtual_ink_security_service');
  const stale=(await concurrent.query("SELECT virtual_ink_security.command('role.request',$1,$2) AS result",[request(4),context(1)])).rows[0].result;
  assert.equal(stale.error,'CONFLICT');checks++;
 }finally{await concurrent.query('ROLLBACK');await concurrent.end();}
 await client.query('SET CONSTRAINTS ALL IMMEDIATE');
 await client.query('ROLLBACK');
 const clean=await client.query('SELECT (SELECT count(*) FROM virtual_ink.users) AS users,(SELECT count(*) FROM virtual_ink_security.events) AS events,(SELECT count(*) FROM auth.sessions) AS sessions');
 assert.deepEqual(clean.rows[0],{users:'0',events:'0',sessions:'0'});
 console.log(`Passed: ${checks} actual SQL security assertions, dual approval, atomic role/audit/session revocation, expiry, replay/rate limits, DB denials, lock contention and zero data residue. Provider Auth is synthetic.`);
}finally{await client.query('ROLLBACK').catch(()=>{});await client.end();}
