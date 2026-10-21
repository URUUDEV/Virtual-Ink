// Component rendering and server-action contracts with synthetic dependencies.
// These are not browser, genuine hosted-session or physical-device acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
const root=resolve('.'),web=resolve(root,'apps/web/src'),require=createRequire(resolve(root,'apps/web/package.json'));
const ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
function loader(overrides={}) {
 const cache=new Map();
 function load(path){
  if(cache.has(path))return cache.get(path).exports;
  const module={exports:{}};cache.set(path,module);
  const compiled=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  function local(name){
   if(Object.hasOwn(overrides,name))return overrides[name];
   if(name==='server-only'||name.endsWith('.css'))return {};
   if(name==='next/link')return {__esModule:true,default:({children,...props})=>React.createElement('a',props,children)};
   let path=name.startsWith('@/')?resolve(web,name.slice(2)):name.startsWith('@backend/')?resolve(root,'src/backend',name.slice(9)):name.startsWith('.')?resolve(dirname(modulePath),name):null;
   if(!path)return require(name);
   if(!/\.tsx?$/.test(path))path+=existsSync(`${path}.tsx`)?'.tsx':'.ts';
   return load(path);
  }
  const modulePath=path;
  vm.runInThisContext(`(function(require,module,exports){${compiled}\n})`,{filename:path})(local,module,module.exports);
  return module.exports;
 }
 return load;
}
const id='12345678-1234-4123-8123-123456789abc';
const row={id,state:'DRAFT',version:1,productCode:'synthetic-shirt',quantity:2,createdAt:'2026-10-21T10:00:00Z',updatedAt:'2026-10-21T10:00:00Z'};
const detail={...row,spec:{productCode:row.productCode,quantity:2,widthMm:100,heightMm:150},proofId:null,approvedProofId:null,quote:null,timeline:[]};
const dataset={orders:[row],detail,summary:{total:7,active:4,pendingProof:2,inProduction:1},nextCursor:null};
async function render(view,data=dataset,error){
 const load=loader({'@/lib/order-dashboard':{async orderDashboardSession(){if(error)throw typeof error==='string'?new (load(resolve(root,'src/backend/api/errors.ts')).ApiError)(error):error;return {identity:{},dashboard:{async read(input){assert.equal(input.view,view);return data;}}};}},
  '@/lib/order-dashboard-actions':{orderDashboardAction:async()=>{}}});
 const {OrderDashboard}=load(resolve(web,'components/order-dashboard.tsx'));
 return renderToStaticMarkup(await OrderDashboard({view,searchParams:Promise.resolve({})}));
}
test('three order views render genuine query values and scoped working navigation',async()=>{
 for(const view of ['customer','vendor','admin']){
  const html=await render(view);
  assert.match(html,/<dd>7<\/dd>/);assert.match(html,/<dd>4<\/dd>/);
  assert.match(html,new RegExp(`href="/${view}\\?orderId=${id}`));
  assert.match(html,/synthetic-shirt/);assert.match(html,/<label for="order-state">/);
  assert.doesNotMatch(html,/Fake|Revenue|Payout|objectVersion|sha256|storage_path/);
 }
});
test('unavailable and denied reads never fabricate empty totals or expose exceptions',async()=>{
 for(const error of [new Error('private credential or SQL diagnostic'),'FORBIDDEN']){
  const html=await render('admin',dataset,error);
  assert.doesNotMatch(html,/<dd>|private credential|SQL diagnostic|synthetic-shirt/);
  assert.match(html,/role="status"/);
  if(error==='FORBIDDEN')assert.match(html,/not available with your current access/);
 }
 const empty=await render('customer',{...dataset,orders:[],detail:null,summary:{total:0,active:0,pendingProof:0,inProduction:0}});
 assert.match(empty,/No orders match this view/);
});
test('state forms preserve versioned commands, native labels and QC requirements',async()=>{
 const ready=await render('vendor',{...dataset,detail:{...detail,state:'QC_PENDING'}});
 assert.match(ready,/Record quality control/);assert.match(ready,/name="expectedVersion" value="1"/);
 assert.match(ready,/name="operationId"/);assert.match(ready,/<input(?=[^>]*name="passed")(?=[^>]*required="")[^>]*>/);
 assert.match(ready,/<fieldset>/);assert.match(ready,/Artwork matches the approved proof/);
 const proof=await render('customer',{...dataset,detail:{...detail,state:'PROOF_UPLOADED',proofId:id}});
 assert.match(proof,/when private file delivery is connected/);assert.doesNotMatch(proof,/Approve proof|name="approve"/);
 const collecting=await render('vendor',{...dataset,detail:{...detail,state:'QC_PASSED'}});
 assert.match(collecting,/<input(?=[^>]*name="handoff")(?=[^>]*value="collection")(?=[^>]*required="")[^>]*>/);
});
test('server mutations reject cross-origin and injected or duplicate fields before command execution',async()=>{
 let calls=0,origin='https://app.example.test';
 const load=loader({'next/headers':{headers:async()=>new Headers({origin})},'next/navigation':{redirect:location=>{throw Object.assign(new Error('redirect'),{location});}},
  './order-dashboard':{orderDashboardSession:async()=>({origin:'https://app.example.test',identity:{},commands:{async run(action,input){calls++;assert.equal(action,'order.cancel');assert.equal(input.expectedVersion,1);}}})}});
 const {orderDashboardAction}=load(resolve(web,'lib/order-dashboard-actions.ts'));
 const values={view:'customer',action:'order.cancel',orderId:id,operationId:id,expectedVersion:'1'};
 const form=patch=>{const data=new FormData();for(const [name,value] of Object.entries({...values,...patch}))data.append(name,value);return data;};
 const invoke=async data=>{try{await orderDashboardAction(data);assert.fail('redirect required');}catch(error){assert(error.location);return error.location;}};
 assert.match(await invoke(form()),/message=saved/);assert.equal(calls,1);
 origin='https://attacker.invalid';assert.match(await invoke(form()),/message=FORBIDDEN/);assert.equal(calls,1);
 origin='https://app.example.test';
 assert.match(await invoke(form({role:'SUPER_ADMIN'})),/message=VALIDATION_FAILED/);
 const duplicate=form();duplicate.append('action','payment.confirm');assert.match(await invoke(duplicate),/message=VALIDATION_FAILED/);
 assert.match(await invoke(form({view:'https://attacker.invalid'})),/^\/customer\?/);
 assert.equal(calls,1);
});
