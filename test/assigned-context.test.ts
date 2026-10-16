import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAssignedPhase1Actor, assignedRoleStatement } from '../src/backend/identity/assigned-context.ts';
import { phase1Roles, permitsPhase1 } from '../src/backend/permissions/phase1.ts';
import type { SqlExecutor, SqlParameter } from '../src/backend/database/ports.ts';
const userId='11111111-1111-4111-8111-111111111111';
const otherId='22222222-2222-4222-8222-222222222222';
const identity={provider:'supabase' as const,issuer:'https://synthetic.invalid/auth/v1',subject:userId};
function fixture(rows: Record<string,unknown>[], options: { mapped?:boolean; active?:boolean; fail?:boolean }={}) {
  const calls: { sql:string; parameters:readonly SqlParameter[] }[]=[];
  const tx: SqlExecutor={async query<Row extends Record<string,unknown>>(sql:string,parameters:readonly SqlParameter[]) {
    calls.push({sql,parameters});
    let data: Record<string,unknown>[]=[];
    if(sql.startsWith('SELECT user_id FROM virtual_ink.identities')) data=options.mapped===false?[]:[{user_id:userId}];
    else if(sql.startsWith('SELECT id, active')) data=options.active===false?[]:[{id:userId,active:true}];
    else if(sql===assignedRoleStatement) { if(options.fail) throw new Error('synthetic query failure'); data=rows; }
    // Legacy roles deliberately empty: explicit assignment is required.
    return {rows:data as Row[],rowCount:data.length};
  }};
  return {tx,calls};
}
test('explicit assignment loader supports all eight server roles without inferred grants or MFA',async()=>{
  for(const role of phase1Roles) {
    const f=fixture([{user_id:userId,role,active:true,version:1}]);
    const actor=await loadAssignedPhase1Actor(f.tx,identity);
    assert.deepEqual(actor,{userId,active:true,roles:[role],organizationIds:[],
      activeVendorAssignment:false,activeDesignerAssignment:false,assignedDeliveryPartner:false,aal:'aal1',grants:[]});
    assert.ok(Object.isFrozen(actor)&&Object.isFrozen(actor.roles)&&Object.isFrozen(actor.grants)&&Object.isFrozen(actor.organizationIds));
    const query=f.calls.find(call=>call.sql===assignedRoleStatement)!;
    assert.deepEqual(query.parameters,[userId]);
    assert.ok(!query.sql.includes(userId));
    assert.match(query.sql,/LIMIT 2$/);
    assert.match(f.calls[0].sql,/app.tenant_id/);
    assert.match(f.calls.at(-1)!.sql,/app.access_mode', ''/);
    const resource={id:otherId,ownerUserId:otherId,organizationMembershipActive:false,vendorVerified:false,
      assignedDesignerIds:[],fileIsActive:true,fileApproved:true,fileStatus:'SAFE' as const,filePurpose:'production' as const,
      paymentRequired:false,paymentConfirmed:false,proofRequired:false,proofApproved:false,proofIsLatest:false};
    for(const action of ['identity.manage','identity.super_admin','file.download','order.read']) {
      assert.equal(permitsPhase1(action,{actor,resource,now:1}),false,`${role}/${action} needs separate authority`);
    }
  }
});
test('explicit loader rejects absent, ambiguous, cross-user, revoked and malformed assignment facts',async()=>{
  const valid={user_id:userId,role:'CUSTOMER',active:true,version:1};
  for(const rows of [[],[valid,valid],[{...valid,user_id:otherId}],[{...valid,role:'PlatformOperator'}],
    [{...valid,role:null}],[{...valid,active:false}],[{...valid,active:'true'}],[{...valid,version:2}],
    [{...valid,version:'1'}],[{...valid,version:undefined}]]) {
    await assert.rejects(loadAssignedPhase1Actor(fixture(rows).tx,identity),{code:'FORBIDDEN'});
  }
});
test('explicit assignments never bypass missing identity, suspension or unavailable schema',async()=>{
  for(const options of [{mapped:false},{active:false}]) {
    const f=fixture([{user_id:userId,role:'SUPER_ADMIN',active:true,version:1}],options);
    await assert.rejects(loadAssignedPhase1Actor(f.tx,identity),{code:'FORBIDDEN'});
    assert.ok(!f.calls.some(call=>call.sql===assignedRoleStatement));
  }
  await assert.rejects(loadAssignedPhase1Actor(fixture([],{fail:true}).tx,identity),/query failure/);
});
