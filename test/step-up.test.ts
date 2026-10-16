import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError } from '../src/backend/api/errors.ts';
import { createStepUpVerifier, type SessionEvidence } from '../src/backend/identity/step-up.ts';
import { createSupabaseSessionEvidenceStore, sessionEvidenceStatement } from '../src/backend/identity/supabase-session.ts';
import { createSupabaseIdentityVerifier, type VerifiedIdentity } from '../src/backend/identity/supabase.ts';
import type { SqlExecutor } from '../src/backend/database/ports.ts';
const subject='11111111-1111-4111-8111-111111111111';
const sessionId='22222222-2222-4222-8222-222222222222';
const otherId='33333333-3333-4333-8333-333333333333';
const issuer='https://abcdefghijklmnopqrst.supabase.co/auth/v1';
const identity: VerifiedIdentity={provider:'supabase',issuer,subject};
const valid={iss:issuer,sub:subject,session_id:sessionId,role:'authenticated',aud:'authenticated',
  aal:'aal2',iat:1000,exp:1500,amr:[{method:'password',timestamp:900},{method:'totp',timestamp:990}]};
const token=(value:unknown=valid)=>`e30.${Buffer.from(JSON.stringify(value)).toString('base64url')}.c2ln`;
const evidence:SessionEvidence={subject,sessionId,mfaAt:990,expiresAt:null};
function fixture(options: { identity?:VerifiedIdentity; evidence?:SessionEvidence; absent?:boolean;
  identityError?:unknown; sessionError?:unknown; advance?:number; time?:number; age?:number }={}) {
  let time=options.time??1000;
  const calls:string[]=[];
  const verifier=createStepUpVerifier({issuer,maximumAgeSeconds:options.age??300,now:()=>time,
    identityVerifier:{async verify(bearer) {calls.push(`identity:${bearer}`); if(options.identityError) throw options.identityError; return options.identity??identity;}},
    sessions:{async read(actual,id) {calls.push('session');assert.deepEqual(actual,options.identity??identity);assert.equal(id,sessionId);
      if(options.sessionError)throw options.sessionError;time+=options.advance??0;return options.absent?undefined:options.evidence??evidence;}}});
  return {verifier,calls};
}

test('step-up validates the same bearer with Auth before consulting server session evidence',async()=>{
  const calls:string[]=[];
  const bearer=token({...valid,user_metadata:{role:'SUPER_ADMIN',aal:'aal2'}});
  const provider=createSupabaseIdentityVerifier({projectUrl:issuer.replace('/auth/v1',''),publishableKey:'sb_publishable_synthetic'},
    async(url,init)=>{calls.push('provider');assert.equal(url,`${issuer}/user`);
      assert.equal((init!.headers as Record<string,string>).Authorization,`Bearer ${bearer}`);
      return Response.json({id:subject,is_anonymous:false});});
  const verifier=createStepUpVerifier({issuer,maximumAgeSeconds:300,now:()=>1000,identityVerifier:provider,
    sessions:{async read(){calls.push('session');return evidence;}}});
  const proof=await verifier.verify(bearer);
  assert.deepEqual(calls,['provider','session']);
  assert.deepEqual(proof,{identity,sessionId,aal:'aal2',mfaAt:990,expiresAt:1290});
  assert.ok(Object.isFrozen(proof)&&Object.isFrozen(proof.identity));
  assert.ok(!('roles'in proof)&&!('grants'in proof)&&!('token'in proof));
  const multi=await fixture({evidence:{...evidence,expiresAt:1100}}).verifier.verify(token({...valid,aud:['authenticated','extra'],nbf:999}));
  assert.equal(multi.expiresAt,1100);
  const short=await fixture().verifier.verify(token({...valid,exp:1010}));
  assert.equal(short.expiresAt,1010);
});

test('step-up rejects forged MFA/metadata and invalid token/identity bindings before session lookup',async()=>{
  const values:unknown[]=[null,[],true,'claims',{},
    {...valid,iss:'https://attacker.invalid/auth/v1'},{...valid,sub:otherId},{...valid,sub:null},
    {...valid,session_id:'injection'},{...valid,role:'service_role'},{...valid,aal:'aal1'},
    {...valid,aal:undefined,user_metadata:{aal:'aal2'}},{...valid,aud:'service_role'},
    {...valid,aud:[]},{...valid,aud:['authenticated',3]},{...valid,aud:Array(9).fill('authenticated')},
    {...valid,iat:'1000'},{...valid,iat:NaN},{...valid,iat:-1},{...valid,iat:1001},
    {...valid,exp:1000},{...valid,exp:990},{...valid,exp:undefined},
    {...valid,nbf:1001},{...valid,nbf:'999'},{...valid,nbf:1500},
    {...valid,amr:null},{...valid,amr:[]},{...valid,amr:Array(17).fill({method:'totp',timestamp:990})},
    {...valid,amr:[null]},{...valid,amr:[[]]},{...valid,amr:[true]},
    {...valid,amr:[{timestamp:990}]},{...valid,amr:[{method:'totp',timestamp:'990'}]},
    {...valid,amr:[{method:'totp',timestamp:990.5}]},{...valid,amr:[{method:'totp',timestamp:-1}]},
    {...valid,amr:[{method:'totp',timestamp:1001}]},{...valid,amr:[{method:'password',timestamp:990}]},
    {...valid,amr:[{method:'totp',timestamp:990},{method:'totp',timestamp:990}]}];
  const malformed=['','not.jwt','a.b.c.d','a.!.b','a.W10=.b','a.Zg.b','a._w.b','a.Zh.b','a.'.concat('a'.repeat(8192),'.b')];
  for(const bearer of [...values.map(token),...malformed]) {
    const f=fixture();await assert.rejects(f.verifier.verify(bearer),{code:'UNAUTHENTICATED'});
    assert.equal(f.calls.length,1,'ineligible claims never reach the session database');
  }
  for(const changed of [{...identity,issuer:'https://other.invalid/auth/v1'},
    {...identity,provider:'other'} as unknown as VerifiedIdentity]) {
    const f=fixture({identity:changed});await assert.rejects(f.verifier.verify(token()),{code:'UNAUTHENTICATED'});
    assert.equal(f.calls.length,1);
  }
});

test('step-up rechecks each request and denies absent, mismatched, stale and expired session evidence',async()=>{
  for(const changed of [{...evidence,subject:otherId},{...evidence,sessionId:otherId},
    {...evidence,mfaAt:989},{...evidence,mfaAt:NaN},{...evidence,expiresAt:1000},
    {...evidence,expiresAt:NaN},{...evidence,expiresAt:-1}]) {
    await assert.rejects(fixture({evidence:changed}).verifier.verify(token()),{code:'UNAUTHENTICATED'});
  }
  await assert.rejects(fixture({absent:true}).verifier.verify(token()),{code:'UNAUTHENTICATED'});
  await assert.rejects(fixture({time:1290}).verifier.verify(token()),{code:'UNAUTHENTICATED'});
  await assert.rejects(fixture({time:NaN}).verifier.verify(token()),{code:'UNAUTHENTICATED'});
  // Expiry while provider/database work is in flight must also deny.
  for(const options of [{advance:290},{advance:500},{advance:100,evidence:{...evidence,expiresAt:1100}}]) {
    await assert.rejects(fixture(options).verifier.verify(token()),{code:'UNAUTHENTICATED'});
  }
  let active=true,reads=0;
  const f=createStepUpVerifier({issuer,maximumAgeSeconds:300,now:()=>1000,
    identityVerifier:{async verify(){return identity;}},sessions:{async read(){reads++;return active?evidence:undefined;}}});
  await f.verify(token());active=false;
  await assert.rejects(f.verify(token()),{code:'UNAUTHENTICATED'});assert.equal(reads,2);
});

test('step-up redacts dependency errors and requires an explicit bounded policy',async()=>{
  for(const error of [new ApiError('UNAUTHENTICATED'),new Error('private upstream detail'),new ApiError('FORBIDDEN')]) {
    const f=fixture({identityError:error});
    await assert.rejects(f.verifier.verify(token()),{code:error instanceof ApiError&&error.code==='UNAUTHENTICATED'?'UNAUTHENTICATED':'IDENTITY_UNAVAILABLE'});
    assert.equal(f.calls.length,1);
  }
  await assert.rejects(fixture({sessionError:new Error('private SQL detail')}).verifier.verify(token()),
    {code:'IDENTITY_UNAVAILABLE',message:'Identity service is unavailable.'});
  for(const maximumAgeSeconds of [0,-1,901,1.5,NaN]) {
    assert.throws(()=>createStepUpVerifier({issuer,maximumAgeSeconds,identityVerifier:{async verify(){return identity;}},sessions:{async read(){return evidence;}}}));
  }
  for(const badIssuer of ['http://synthetic.invalid/auth/v1','https://user@synthetic.invalid/auth/v1',
    `${issuer}?query=1`,`${issuer}#fragment`,`${issuer}/`,'https://synthetic.invalid/other','invalid']) {
    assert.throws(()=>createStepUpVerifier({issuer:badIssuer,maximumAgeSeconds:300,identityVerifier:{async verify(){return identity;}},sessions:{async read(){return evidence;}}}));
  }
  // Real clock default is used only with a current, synthetic claim/evidence pair.
  const current=Math.floor(Date.now()/1000);
  const f=createStepUpVerifier({issuer,maximumAgeSeconds:900,identityVerifier:{async verify(){return identity;}},
    sessions:{async read(){return {...evidence,mfaAt:current};}}});
  assert.equal((await f.verify(token({...valid,iat:current,exp:current+60,amr:[{method:'totp',timestamp:current}]}))).mfaAt,current);
});

test('Supabase session adapter uses a bounded parameterized read and rejects malformed results',async()=>{
  function database(rows:Record<string,unknown>[],count=rows.length):SqlExecutor {
    return {async query<Row extends Record<string,unknown>>(sql:string,parameters:readonly import('../src/backend/database/ports.ts').SqlParameter[]){
      assert.equal(sql,sessionEvidenceStatement);assert.deepEqual(parameters,[sessionId,subject]);
      return {rows:rows as Row[],rowCount:count};
    }};
  }
  const row={subject,session_id:sessionId,mfa_at:990,expires_at:null};
  const good=await createSupabaseSessionEvidenceStore(database([row])).read(identity,sessionId);
  assert.deepEqual(good,evidence);assert.ok(Object.isFrozen(good));
  assert.equal((await createSupabaseSessionEvidenceStore(database([{...row,expires_at:1100}])).read(identity,sessionId))!.expiresAt,1100);
  assert.equal(await createSupabaseSessionEvidenceStore(database([])).read(identity,sessionId),undefined);
  for(const rows of [[row,row],[{...row,subject:null}],[{...row,session_id:null}],
    [{...row,mfa_at:'990'}],[{...row,expires_at:'1100'}]]) {
    await assert.rejects(createSupabaseSessionEvidenceStore(database(rows)).read(identity,sessionId),{code:'IDENTITY_UNAVAILABLE'});
  }
  await assert.rejects(createSupabaseSessionEvidenceStore(database([row],0)).read(identity,sessionId),{code:'IDENTITY_UNAVAILABLE'});
});
