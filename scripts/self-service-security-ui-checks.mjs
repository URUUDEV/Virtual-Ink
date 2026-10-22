// Server component checks with synthetic dependencies, not browser acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(resolve('apps/web/package.json')),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const privilegedRoles=['ADMIN','SUPER_ADMIN','SECURITY_ADMIN','FINANCE_ADMIN','DISPUTE_REVIEWER','PAYOUT_APPROVER'];
async function page({role='CUSTOMER',enabled=true,failure=false,admin=false}={}){
 const calls=[];
 const dependencies={auth:{async identity(){calls.push('identity');return {stepUpAt:null};},async factors(){calls.push('factors');return [];},async assurance(){return {currentLevel:'aal1'};}},
  commands:{async run(action){calls.push(action);if(failure)throw new Error('PRIVATE_DATABASE_DETAIL');return {data:{userId:'synthetic',role,canManageRoles:role==='SUPER_ADMIN'}};}}};
 const overrides={
  'next/headers':{cookies:async()=>({getAll:()=>[],get:()=>undefined})},
  'next/navigation':{redirect:location=>{throw Object.assign(new Error('redirect'),{location});}},
  'next/link':{__esModule:true,default:({children,...props})=>React.createElement('a',props,children)},
  '@backend/identity/security-admin.ts':{loadSecurityConfig:()=>enabled?{}:undefined,privilegedRoles},
  '@/lib/security-admin':{securityDependencies:async()=>dependencies},'@/lib/web-auth':{webAuthClient:()=>({})},
  '@/components/security-admin-panel':{SecurityAdminPanel:({selfService,initial})=>React.createElement('p',null,`${selfService?'Self service':'Administration'} ${initial.role}`)},
 };
 const path=resolve(`apps/web/src/app/${admin?'admin':'account'}/security/page.tsx`),module={exports:{}};
 const source=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 vm.runInThisContext(`(function(require,module,exports){${source}\n})`,{filename:path})(name=>Object.hasOwn(overrides,name)?overrides[name]:require(name),module,module.exports);
 try{return {html:renderToStaticMarkup(await module.exports.default()),calls};}
 catch(error){if(error.location)return {location:error.location,calls};throw error;}
}
test('customer and vendor security pages verify identity and load self-scoped data before rendering',async()=>{
 for(const role of ['CUSTOMER','VENDOR']){
  const result=await page({role});assert.match(result.html,new RegExp(`Self service ${role}`));
  assert.deepEqual(result.calls,['identity','account.security','factors']);assert.match(result.html,/href="\/account"/);
 }
});
test('unavailable, denied and unassigned security pages do not render sensitive controls',async()=>{
 const disabled=await page({enabled:false});assert.match(disabled.html,/unavailable/);assert.deepEqual(disabled.calls,[]);
 for(const input of [{failure:true},{role:null},{role:'DELIVERY_PARTNER'}]){
  const result=await page(input);assert.equal(result.location,'/account');assert.equal(result.html,undefined);
 }
 assert.equal((await page({role:'SUPER_ADMIN'})).location,'/admin/security');
});
test('administrative page independently rejects customer/vendor roles and keeps privileged entry',async()=>{
 for(const role of ['CUSTOMER','VENDOR',null])assert.equal((await page({role,admin:true})).location,'/account');
 const admin=await page({role:'ADMIN',admin:true});assert.match(admin.html,/Administration ADMIN/);assert.equal(admin.calls[1],'status');
});
