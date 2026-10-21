import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardInput, dashboardMutation, createDashboardQueries } from '../src/backend/orders/dashboard.ts';
import { ApiError } from '../src/backend/api/errors.ts';
import type { SqlExecutor } from '../src/backend/database/ports.ts';
import type { SecurityIdentity } from '../src/backend/identity/security-admin.ts';
const id='12345678-1234-4123-8123-123456789abc';
const identity:SecurityIdentity={issuer:'https://synthetic.invalid/auth/v1',subject:id,sessionId:id,aal:'aal1',mfaAt:null,primaryAt:null,stepUpAt:null};
const common={orderId:id,operationId:id,expectedVersion:'1'};
test('dashboard query rejects injected scope, malformed filters and unbounded pages',()=>{
 for(const view of ['customer','vendor','admin'])assert.equal(dashboardInput({view,limit:50,cursor:id,orderId:id,state:'IN_PRODUCTION'}).view,view);
 assert.deepEqual(dashboardInput({view:'customer'}),{view:'customer'});
 for(const value of [null,[],{view:'administrator'},{view:'customer',role:'ADMIN'},{view:'customer',ownerId:id},
  {view:'customer',state:1},{view:'customer',state:'x'},{view:'vendor',limit:0},{view:'vendor',limit:51},
  {view:'vendor',limit:1.5},{view:'admin',cursor:'../other'},{view:'customer',orderId:'invalid'}])assert.throws(()=>dashboardInput(value),ApiError);
});
test('dashboard forms keep action allowlists, version and idempotency boundaries',()=>{
 for(const action of ['order.cancel','quote.review','quote.accept','quote.reject','job.accept','proof.request','production.queue','production.start','production.finish','production.correct','order.complete']){
  assert.equal(dashboardMutation({...common,action}).action,action);
  assert.throws(()=>dashboardMutation({...common,action,role:'ADMIN'}),ApiError);
  assert.throws(()=>dashboardMutation({...common,action,reasonCode:'unexpected'}),ApiError);
 }
 assert.equal(dashboardMutation({...common,action:'order.ready',handoff:'pickup'}).input.handoff,'pickup');
 assert.equal(dashboardMutation({...common,action:'job.decline',reasonCode:'capacity_unavailable'}).input.reasonCode,'capacity_unavailable');
 const created=dashboardMutation({...common,expectedVersion:'0',action:'order.create',productCode:'synthetic',quantity:'2',widthMm:'100',heightMm:'150'});
 assert.deepEqual(created.input.spec,{productCode:'synthetic',quantity:2,widthMm:100,heightMm:150});
 const qc=dashboardMutation({...common,action:'qc.record',passed:'true',artwork:'on',quantityChecked:'on',finish:'on',reasonCode:'qc_passed'});
 assert.deepEqual(qc.input.checks,{artwork:true,quantity:true,finish:true});
 assert.equal(dashboardMutation({...common,action:'qc.record',passed:'false'}).input.passed,false);
 assert.throws(()=>dashboardMutation({...common,action:'qc.record',passed:'yes'}),ApiError);
 for(const patch of [{action:'payment.confirm'},{action:'order.cancel',expectedVersion:'bad'},{action:'order.cancel',operationId:'invalid'}])assert.throws(()=>dashboardMutation({...common,...patch}),ApiError);
});
test('dashboard reads require committed audits and preserve typed safe failures',async()=>{
 const data={view:'customer',orders:[],summary:{total:0}};
 const executor=(result:unknown):SqlExecutor=>({async query(sql,values){assert.match(sql,/virtual_ink_workflow.dashboard/);assert.equal(JSON.parse(String(values[1])).subject,id);return {rows:[{result}] as never,rowCount:1};}});
 assert.deepEqual(await createDashboardQueries(executor({ok:true,data,auditId:id}),'local').read({view:'customer'},identity,id),{...data,auditId:id});
 for(const result of [null,[],{ok:true,data},{ok:true,auditId:id,data:null},{ok:true,auditId:id,data:{...data,view:'admin'}},{ok:true,auditId:id,data:{view:'customer',orders:{},summary:{}}},
  {ok:false,auditId:id,error:'secret database detail'}])await assert.rejects(createDashboardQueries(executor(result),'local').read({view:'customer'},identity,id),ApiError);
 for(const code of ['FORBIDDEN','UNAUTHENTICATED','NOT_FOUND','CONFLICT','VALIDATION_FAILED','RATE_LIMITED','IDENTITY_UNAVAILABLE']){
  await assert.rejects(createDashboardQueries(executor({ok:false,auditId:id,error:code}),'local').read({view:'customer'},identity,id),error=>error instanceof ApiError&&error.code===code);
 }
 const failing:SqlExecutor={async query(){throw new Error('private database detail');}};
 await assert.rejects(createDashboardQueries(failing,'preview').read({view:'customer'},identity,id),error=>error instanceof ApiError&&error.code==='AUDIT_UNAVAILABLE'&&!error.message.includes('private'));
 const empty:SqlExecutor={async query(){return {rows:[],rowCount:0};}};
 await assert.rejects(createDashboardQueries(empty,'local').read({view:'customer'},identity,id),ApiError);
 await assert.rejects(createDashboardQueries(executor(null),'local').read({view:'customer'},identity,'invalid'),ApiError);
});
